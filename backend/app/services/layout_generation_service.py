from pathlib import Path

from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.gemini_client import gemini_json, get_gemini_client
from app.models.vm_tower import DesignIntent, VMLayout, ProductRange, WorkflowStatus
from google.genai import types
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


def _load_range_image_parts(intent: DesignIntent) -> list:
    """Extract range images from intent.key_piece_priority and return as Gemini Parts."""
    parts = []
    raw_items = intent.key_piece_priority or []
    for item in raw_items:
        if not isinstance(item, dict) or item.get("type") != "range_image":
            continue
        rel_url = item.get("image_url", "")
        if not rel_url:
            continue
        try:
            clean = rel_url.lstrip("/")
            abs_path = Path(clean)
            if not abs_path.exists():
                abs_path = Path(settings.UPLOAD_DIR).parent / clean
            img_bytes = abs_path.read_bytes()
            ext = abs_path.suffix.lower()
            mime = {".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp"}.get(ext, "image/jpeg")
            label = item.get("label", "Range Image")
            parts.append(types.Part.from_text(text=f"[{label}]:"))
            parts.append(types.Part.from_bytes(data=img_bytes, mime_type=mime))
        except Exception:
            continue
    return parts


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

PRODUCT CATALOG (use ONLY these — do NOT rename, paraphrase, or invent products):
{products_str}

Available Fixtures: {fixtures_str}

CRITICAL RULES:
- You MUST reference products ONLY by their exact "sku" and "name" from the catalog above.
- Do NOT create, rename, or describe products that are not in the catalog.
- Every product referenced in placement_plan and product_grouping MUST exist in the catalog.
- If the catalog is empty, leave product_grouping arrays empty and note "awaiting products" in reasoning.

Generate exactly 4 layout suggestions (one of each type):
1. wall_story - A wall display story
2. fixture - A fixture/table layout
3. mannequin - Mannequin styling looks (2-3 looks)
4. focal_display - A focal point display

For each layout, provide:
- name: descriptive name
- layout_type: one of [wall_story, fixture, mannequin, focal_display]
- placement_plan: object with zones, positions, product placement details using exact SKUs
- product_grouping: array of product groups — each product referenced by exact "sku" and "name" from the catalog
- reasoning: 2-3 sentences explaining the merchandising logic

Return a JSON object with a "layouts" key containing an array of 4 objects."""

        # Use range images as visual context if available
        range_parts = _load_range_image_parts(intent)

        if range_parts:
            client = get_gemini_client()
            contents = [
                *range_parts,
                types.Part.from_text(text=(
                    "The images above are the uploaded range/collection images. "
                    "Use them ONLY as visual context for understanding colors, fabrics, and styling. "
                    "You MUST still reference products ONLY by the exact SKU and name from the PRODUCT CATALOG below. "
                    "Do NOT invent new product names based on what you see in the images.\n\n" + prompt
                )),
            ]
            response = client.models.generate_content(
                model=settings.GEMINI_TEXT_MODEL,
                contents=contents,
                config=types.GenerateContentConfig(
                    temperature=0.7,
                    response_mime_type="application/json",
                    response_modalities=["TEXT"],
                ),
            )
            raw = response.text
        else:
            raw = gemini_json(
                prompt=prompt,
                system_instruction="You are a visual merchandising AI. Return valid JSON only.",
                temperature=0.7,
            )

        result = json.loads(raw)
        layouts = result.get("layouts", result.get("suggestions", []))
        if isinstance(result, list):
            layouts = result

        # Post-process: validate product references against actual catalog
        if products:
            layouts = _validate_product_references(layouts[:4], products)

        return layouts[:4]

    except Exception as e:
        print(f"Layout generation failed: {e}")
        return _generate_fallback_layouts(intent, products)


def _validate_product_references(layouts: list[dict], products: list[dict]) -> list[dict]:
    """Replace hallucinated product names with actual catalog entries.

    Gemini sometimes renames products despite instructions.  This function
    fuzzy-matches every product string in groupings back to the real catalog
    and replaces it with the canonical name.
    """
    catalog_names = {p.get("name", "").lower(): p.get("name", "") for p in products}
    catalog_skus = {p.get("sku", "").lower(): p.get("sku", "") for p in products}
    # Build quick lookup: sku -> name, name -> sku
    sku_to_name = {p.get("sku", ""): p.get("name", "") for p in products}
    name_to_sku = {p.get("name", ""): p.get("sku", "") for p in products}

    def _best_match(text: str) -> str | None:
        """Return the canonical product name if text matches a catalog entry."""
        t = text.strip().lower()
        # Exact match on name
        if t in catalog_names:
            return catalog_names[t]
        # Exact match on SKU
        if t in catalog_skus:
            return sku_to_name.get(catalog_skus[t], text)
        # Substring match — catalog name contained in AI text or vice versa
        for cname_lower, cname in catalog_names.items():
            if cname_lower in t or t in cname_lower:
                return cname
        return None

    def _fix_list(items: list) -> list:
        fixed = []
        for item in items:
            if isinstance(item, str):
                match = _best_match(item)
                fixed.append(match if match else item)
            elif isinstance(item, dict):
                fixed.append(_fix_dict(item))
            else:
                fixed.append(item)
        return fixed

    def _fix_dict(d: dict) -> dict:
        out = {}
        for k, v in d.items():
            if isinstance(v, list):
                out[k] = _fix_list(v)
            elif isinstance(v, dict):
                out[k] = _fix_dict(v)
            elif isinstance(v, str) and k in ("name", "product", "product_name"):
                match = _best_match(v)
                out[k] = match if match else v
            else:
                out[k] = v
        return out

    return [_fix_dict(layout) if isinstance(layout, dict) else layout for layout in layouts]


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
