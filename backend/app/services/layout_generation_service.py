from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.gemini_client import gemini_json
from app.models.vm_tower import DesignIntent, VMLayout, ProductRange, WorkflowStatus
import json


def generate_layouts(db: Session, intent_id: int, user_id: int, fixture_templates: list[str] = None) -> list[VMLayout]:
    intent = db.query(DesignIntent).filter(
        DesignIntent.id == intent_id,
        DesignIntent.user_id == user_id
    ).first()
    if not intent:
        return []

    products = db.query(ProductRange).filter(
        ProductRange.intent_id == intent_id
    ).all()

    product_list = []
    for p in products:
        product_list.append({
            "sku": p.sku,
            "name": p.name,
            "category": p.category,
            "color": p.color,
            "fabric": p.fabric,
        })

    layouts = _generate_layout_suggestions(intent, product_list, fixture_templates)

    created_layouts = []
    for layout_data in layouts:
        layout = VMLayout(
            intent_id=intent_id,
            user_id=user_id,
            layout_type=layout_data["layout_type"],
            name=layout_data["name"],
            placement_plan=layout_data.get("placement_plan"),
            product_grouping=layout_data.get("product_grouping"),
            reasoning=layout_data.get("reasoning"),
        )
        db.add(layout)
        created_layouts.append(layout)

    # Update intent status
    intent.status = WorkflowStatus.AI_LAYOUT_SUGGESTED
    db.commit()

    for layout in created_layouts:
        db.refresh(layout)

    return created_layouts


def get_layouts_for_intent(db: Session, intent_id: int, user_id: int) -> list[VMLayout]:
    return db.query(VMLayout).filter(
        VMLayout.intent_id == intent_id,
        VMLayout.user_id == user_id
    ).order_by(VMLayout.created_at.desc()).all()


def approve_layouts(db: Session, layout_ids: list[int], user_id: int, intent_id: int) -> list[VMLayout]:
    layouts = db.query(VMLayout).filter(
        VMLayout.id.in_(layout_ids),
        VMLayout.user_id == user_id
    ).all()

    for layout in layouts:
        layout.is_approved = 1

    intent = db.query(DesignIntent).filter(
        DesignIntent.id == intent_id,
        DesignIntent.user_id == user_id
    ).first()
    if intent:
        intent.status = WorkflowStatus.DESIGNER_APPROVED

    db.commit()
    for layout in layouts:
        db.refresh(layout)
    return layouts


def _generate_layout_suggestions(intent: DesignIntent, products: list[dict], fixture_templates: list[str] = None) -> list[dict]:
    try:
        color_flow_str = " → ".join(intent.color_flow) if intent.color_flow else "not specified"
        category_mix_str = json.dumps(intent.category_mix) if intent.category_mix else "{}"
        products_str = json.dumps(products[:30], indent=2) if products else "No products uploaded yet"
        fixtures_str = ", ".join(fixture_templates) if fixture_templates else "standard wall, table, mannequin"

        prompt = f"""You are a visual merchandising layout AI. Generate merchandising layout suggestions.

Design Intent:
- Theme: {intent.theme}
- Season: {intent.season}
- Color Flow: {color_flow_str}
- Visual Mood: {intent.visual_mood}
- Store Type: {intent.target_store_type}
- Category Mix: {category_mix_str}
- AI Context: {intent.ai_context_summary or 'N/A'}

Available Products:
{products_str}

Available Fixtures: {fixtures_str}

Generate exactly 4 layout suggestions (one of each type):
1. wall_story - A wall display story
2. fixture - A fixture/table layout
3. mannequin - Mannequin styling looks (2-3 looks)
4. focal_display - A focal point display

For each layout, provide:
- name: descriptive name
- layout_type: one of [wall_story, fixture, mannequin, focal_display]
- placement_plan: object with zones, positions, product placement details
- product_grouping: array of product groups with SKUs/names
- reasoning: 2-3 sentences explaining the merchandising logic

Return a JSON object with a "layouts" key containing an array of 4 objects."""

        raw = gemini_json(
            prompt=prompt,
            system_instruction="You are a visual merchandising AI. Return valid JSON only.",
            temperature=0.7,
        )

        result = json.loads(raw)
        layouts = result.get("layouts", result.get("suggestions", []))
        if isinstance(result, list):
            layouts = result
        return layouts[:4]

    except Exception as e:
        # Fallback layouts
        return _generate_fallback_layouts(intent, products)


def _generate_fallback_layouts(intent: DesignIntent, products: list[dict]) -> list[dict]:
    colors = intent.color_flow or ["neutral"]
    theme = intent.theme or "Collection"

    product_names = [p.get("name", p.get("sku", "Product")) for p in products[:10]]

    return [
        {
            "layout_type": "wall_story",
            "name": f"{theme} — Wall Story",
            "placement_plan": {
                "zones": ["top_shelf", "eye_level", "mid_shelf", "bottom"],
                "color_progression": "left_to_right",
                "hero_position": "eye_level_center",
                "flow": f"Color transitions from {colors[0]} to {colors[-1] if len(colors) > 1 else colors[0]}"
            },
            "product_grouping": [
                {"zone": "eye_level", "products": product_names[:3], "reason": "Hero products at eye level"},
                {"zone": "mid_shelf", "products": product_names[3:6], "reason": "Supporting range"},
            ],
            "reasoning": f"Wall story follows the {' → '.join(colors)} color flow, placing hero pieces at eye level to anchor the {intent.visual_mood} mood."
        },
        {
            "layout_type": "fixture",
            "name": f"{theme} — Feature Table",
            "placement_plan": {
                "fixture_type": "center_table",
                "layers": ["base", "mid", "top"],
                "focal_point": "center_top",
                "styling": "folded_with_props"
            },
            "product_grouping": [
                {"layer": "top", "products": product_names[:2], "reason": "Key pieces displayed open"},
                {"layer": "base", "products": product_names[2:5], "reason": "Folded supporting items"},
            ],
            "reasoning": f"Feature table creates a curated edit of the {theme} story with layered presentation supporting the visual narrative."
        },
        {
            "layout_type": "mannequin",
            "name": f"{theme} — Mannequin Looks",
            "placement_plan": {
                "num_mannequins": 3,
                "positioning": "staggered_triangle",
                "looks": [
                    {"look": 1, "style": "hero_look", "position": "center_front"},
                    {"look": 2, "style": "supporting", "position": "left_back"},
                    {"look": 3, "style": "transition", "position": "right_back"},
                ]
            },
            "product_grouping": [
                {"look": 1, "products": product_names[:2], "reason": "Hero outfit"},
                {"look": 2, "products": product_names[2:4], "reason": "Complementary styling"},
                {"look": 3, "products": product_names[4:6], "reason": "Color transition look"},
            ],
            "reasoning": f"Three mannequin looks tell the complete {theme} story — from hero to transition, each reflecting the {intent.visual_mood} aesthetic."
        },
        {
            "layout_type": "focal_display",
            "name": f"{theme} — Focal Point",
            "placement_plan": {
                "display_type": "spotlight_pedestal",
                "position": "store_entrance",
                "lighting": "accent_spotlight",
                "props": ["seasonal_elements", "texture_accents"]
            },
            "product_grouping": [
                {"position": "focal", "products": product_names[:1], "reason": "Single hero product as statement piece"},
            ],
            "reasoning": f"Focal display anchors the {theme} concept at the store entrance, drawing customers into the story with the season's hero piece."
        },
    ]
