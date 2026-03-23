from sqlalchemy.orm import Session
from app.core.gemini_client import gemini_json
from app.models.vm_tower import (
    DesignIntent, VMLayout, ConceptLock, VMGuideline, WorkflowStatus
)
import json


def generate_vm_guidelines(db: Session, intent_id: int, user_id: int) -> VMGuideline:
    intent = db.query(DesignIntent).filter(
        DesignIntent.id == intent_id,
        DesignIntent.user_id == user_id
    ).first()
    if not intent:
        return None

    layouts = db.query(VMLayout).filter(
        VMLayout.intent_id == intent_id,
        VMLayout.is_approved == 1
    ).all()

    lock = db.query(ConceptLock).filter(
        ConceptLock.intent_id == intent_id,
        ConceptLock.is_active == 1
    ).first()

    guidelines = _generate_all_guidelines(intent, layouts, lock)

    # Handle case where Gemini returns a list instead of dict
    if isinstance(guidelines, list):
        guidelines = guidelines[0] if guidelines else {}
    if not isinstance(guidelines, dict):
        guidelines = _generate_fallback_guidelines(intent, layouts)

    guideline = VMGuideline(
        intent_id=intent_id,
        user_id=user_id,
        vm_instruction_sheet=guidelines.get("vm_instruction_sheet"),
        shoot_team_shot_list=guidelines.get("shoot_team_shot_list"),
        styling_notes=guidelines.get("styling_notes"),
        placement_guide=guidelines.get("placement_guide"),
        concept_explanation=guidelines.get("concept_explanation"),
    )
    db.add(guideline)

    intent.status = WorkflowStatus.VM_READY
    db.commit()
    db.refresh(guideline)
    return guideline


def get_guidelines(db: Session, intent_id: int, user_id: int) -> VMGuideline:
    return db.query(VMGuideline).filter(
        VMGuideline.intent_id == intent_id,
        VMGuideline.user_id == user_id
    ).order_by(VMGuideline.created_at.desc()).first()


def _generate_all_guidelines(intent: DesignIntent, layouts: list[VMLayout], lock: ConceptLock) -> dict:
    try:
        layouts_desc = []
        for layout in layouts:
            layouts_desc.append({
                "type": layout.layout_type,
                "name": layout.name,
                "placement": layout.placement_plan,
                "grouping": layout.product_grouping,
                "reasoning": layout.reasoning,
            })

        lock_desc = {}
        if lock:
            lock_desc = {
                "color_rules": lock.color_continuity_rules,
                "hierarchy": lock.focal_hierarchy_rules,
                "category": lock.category_balance_rules,
                "placement": lock.placement_rules,
            }

        prompt = f"""You are a visual merchandising documentation AI. Generate comprehensive VM guidelines.

Design Intent:
- Theme: {intent.theme}
- Season: {intent.season}
- Color Flow: {json.dumps(intent.color_flow)}
- Category Mix: {json.dumps(intent.category_mix)}
- Visual Mood: {intent.visual_mood}
- Store Type: {intent.target_store_type}
- Styling Rules: {json.dumps(intent.styling_rules)}
- AI Context: {intent.ai_context_summary}

Approved Layouts:
{json.dumps(layouts_desc, indent=2)}

Concept Lock Constraints:
{json.dumps(lock_desc, indent=2)}

Generate 5 documents as JSON:
{{
    "vm_instruction_sheet": "Detailed step-by-step VM setup instructions with zones, fixtures, and product placement. Use markdown formatting.",
    "shoot_team_shot_list": "Detailed shot list for the shoot team including angles, lighting, and styling notes. Use markdown formatting.",
    "styling_notes": "Styling guidelines for each look/display including fabric handling, folding techniques, and prop usage. Use markdown formatting.",
    "placement_guide": "Zone-by-zone placement guide with measurements, heights, and spacing. Use markdown formatting.",
    "concept_explanation": "Brand narrative explaining the concept for store teams to understand the WHY. Use markdown formatting."
}}

Each document should be professional, detailed, and ready for a retail VM team to execute."""

        raw = gemini_json(
            prompt=prompt,
            system_instruction="You are a VM documentation expert. Return valid JSON with markdown-formatted content.",
            temperature=0.6,
        )
        result = json.loads(raw)
        if isinstance(result, list):
            result = result[0] if result else {}
        if not isinstance(result, dict):
            return _generate_fallback_guidelines(intent, layouts)
        return result

    except Exception:
        return _generate_fallback_guidelines(intent, layouts)


def _generate_fallback_guidelines(intent: DesignIntent, layouts: list[VMLayout]) -> dict:
    theme = intent.theme
    season = intent.season
    colors = " → ".join(intent.color_flow or ["neutral"])
    mood = intent.visual_mood

    layout_names = [l.name for l in layouts]
    layout_list = "\n".join([f"- {name}" for name in layout_names])

    return {
        "vm_instruction_sheet": f"""# VM Instruction Sheet — {theme}\n\n## Season: {season}\n## Mood: {mood}\n\n### Setup Overview\nThis guide covers the complete visual merchandising setup for the {theme} concept.\n\n### Approved Layouts\n{layout_list}\n\n### Color Flow\nFollow the color progression: {colors}\n\n### Step-by-Step Setup\n1. **Prepare fixtures** — Clean and position all fixtures per floor plan\n2. **Stage wall stories** — Begin with the primary wall, following left-to-right color flow\n3. **Dress mannequins** — Style mannequins per the approved looks\n4. **Set focal displays** — Position hero products at entrance focal points\n5. **Final styling** — Steam garments, adjust lighting, add props\n6. **Quality check** — Verify against concept lock guidelines""",
        "shoot_team_shot_list": f"""# Shoot Team Shot List — {theme}\n\n## Overview\nCapture the complete {theme} visual story for {season}.\n\n### Required Shots\n1. **Wide store shot** — Full view showing all displays in context\n2. **Wall story close-up** — Each wall display, straight-on at eye level\n3. **Mannequin portraits** — Each mannequin look, 3/4 angle with detail shots\n4. **Focal display** — Hero product spotlight with mood lighting\n5. **Detail shots** — Fabric textures, styling details, product tags\n6. **Lifestyle context** — Styled vignettes showing product in use\n\n### Lighting Notes\n- Use natural-style lighting for {mood} mood\n- Key light from upper-right for product definition\n- Fill light to maintain shadow detail""",
        "styling_notes": f"""# Styling Notes — {theme}\n\n## Visual Mood: {mood}\n## Season: {season}\n\n### General Styling Guidelines\n- Maintain the {mood} aesthetic throughout all displays\n- Color flow must follow: {colors}\n- All garments must be steamed and lint-free before display\n\n### Folding Techniques\n- Shirts: casual fold showing collar and top button\n- Trousers: single fold with crease visible\n- Knitwear: soft roll to show texture\n\n### Mannequin Styling\n- Natural poses, avoid stiff positioning\n- Accessories should complement, not compete\n- Ensure proper fit — use pins discreetly if needed""",
        "placement_guide": f"""# Placement Guide — {theme}\n\n## Store Type: {intent.target_store_type}\n\n### Zone Layout\n- **Zone A (Entrance)**: Focal display — hero product spotlight\n- **Zone B (Primary Wall)**: Main wall story — full color progression\n- **Zone C (Center)**: Feature table — curated edit\n- **Zone D (Secondary Wall)**: Supporting range display\n- **Zone E (Mannequins)**: 3 styled looks in staggered triangle\n\n### Height Guidelines\n- Eye level (120-160cm): Hero products and key pieces\n- Upper shelf (170-200cm): Folded basics, color blocks\n- Lower shelf (60-110cm): Folded separates, accessories\n- Floor level: Shoes, bags\n\n### Spacing\n- Minimum 5cm between hangers\n- Table displays: 15cm between stacks\n- Mannequin spacing: minimum 80cm apart""",
        "concept_explanation": f"""# Concept Explanation — {theme}\n\n## The Story\nThis {season} concept tells the story of {theme}. The visual narrative follows a {colors} color progression that guides the customer through a curated journey of style and comfort.\n\n## The Mood\nThe overall mood is {mood} — every element from fixture selection to product styling reinforces this sensibility.\n\n## The Why\nThis concept was designed to:\n1. Highlight the season's hero products at natural focal points\n2. Create a cohesive color story that flows through the store\n3. Balance categories to show range depth without overwhelming\n4. Inspire customers through styled looks that feel achievable""",
    }
