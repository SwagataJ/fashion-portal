from sqlalchemy.orm import Session
from app.core.gemini_client import gemini_json
from app.models.vm_tower import DesignIntent, ConceptLock, VMLayout, WorkflowStatus
import json


def activate_concept_lock(db: Session, intent_id: int, user_id: int, flexibility_level: str = "moderate") -> ConceptLock:
    intent = db.query(DesignIntent).filter(
        DesignIntent.id == intent_id,
        DesignIntent.user_id == user_id
    ).first()
    if not intent:
        return None

    approved_layouts = db.query(VMLayout).filter(
        VMLayout.intent_id == intent_id,
        VMLayout.is_approved == 1
    ).all()

    constraints = _generate_constraints(intent, approved_layouts, flexibility_level)

    # Deactivate any existing locks for this intent
    db.query(ConceptLock).filter(
        ConceptLock.intent_id == intent_id
    ).update({"is_active": 0})

    lock = ConceptLock(
        intent_id=intent_id,
        user_id=user_id,
        color_continuity_rules=constraints.get("color_continuity"),
        focal_hierarchy_rules=constraints.get("focal_hierarchy"),
        category_balance_rules=constraints.get("category_balance"),
        placement_rules=constraints.get("placement"),
        flexibility_level=flexibility_level,
        is_active=1,
    )
    db.add(lock)

    intent.status = WorkflowStatus.CONCEPT_LOCKED
    db.commit()
    db.refresh(lock)
    return lock


def get_active_lock(db: Session, intent_id: int) -> ConceptLock:
    return db.query(ConceptLock).filter(
        ConceptLock.intent_id == intent_id,
        ConceptLock.is_active == 1
    ).first()


def deactivate_concept_lock(db: Session, intent_id: int, user_id: int) -> bool:
    lock = db.query(ConceptLock).filter(
        ConceptLock.intent_id == intent_id,
        ConceptLock.user_id == user_id,
        ConceptLock.is_active == 1
    ).first()
    if not lock:
        return False
    lock.is_active = 0
    db.commit()
    return True


def _generate_constraints(intent: DesignIntent, layouts: list[VMLayout], flexibility_level: str) -> dict:
    try:
        layouts_summary = []
        for layout in layouts:
            layouts_summary.append({
                "type": layout.layout_type,
                "name": layout.name,
                "placement": layout.placement_plan,
                "grouping": layout.product_grouping,
            })

        prompt = f"""You are a visual merchandising concept lock AI. Convert design intent and approved layouts into enforceable constraints.

Design Intent:
- Theme: {intent.theme}
- Season: {intent.season}
- Color Flow: {json.dumps(intent.color_flow)}
- Category Mix: {json.dumps(intent.category_mix)}
- Visual Mood: {intent.visual_mood}
- Store Type: {intent.target_store_type}
- Styling Rules: {json.dumps(intent.styling_rules)}

Approved Layouts:
{json.dumps(layouts_summary, indent=2)}

Flexibility Level: {flexibility_level}

Generate concept lock constraints as JSON with these keys:
1. color_continuity: rules about maintaining color flow and palette
2. focal_hierarchy: rules about hero product placement and visual hierarchy
3. category_balance: rules about maintaining category proportions
4. placement: rules about fixture/zone placement that must be preserved

Each should have "rules" array and "tolerance" level.
Return valid JSON object."""

        raw = gemini_json(
            prompt=prompt,
            system_instruction="You are a visual merchandising constraint engine. Return valid JSON only.",
            temperature=0.5,
        )
        return json.loads(raw)

    except Exception:
        return _generate_fallback_constraints(intent, flexibility_level)


def _generate_fallback_constraints(intent: DesignIntent, flexibility_level: str) -> dict:
    tolerance_map = {"strict": 5, "moderate": 15, "flexible": 30}
    tolerance = tolerance_map.get(flexibility_level, 15)

    return {
        "color_continuity": {
            "rules": [
                f"Maintain color flow: {' → '.join(intent.color_flow or ['neutral'])}",
                "Adjacent products must share color family or be part of the defined progression",
                f"Maximum {tolerance}% deviation from original color placement",
            ],
            "tolerance": tolerance,
        },
        "focal_hierarchy": {
            "rules": [
                "Hero products must remain at eye level or primary focal point",
                "No more than one hero product per zone",
                "Supporting products must complement, not compete with hero pieces",
            ],
            "tolerance": tolerance,
        },
        "category_balance": {
            "rules": [
                f"Maintain category proportions within ±{tolerance}%",
                f"Category mix target: {json.dumps(intent.category_mix or {})}",
                "No single category may exceed 60% of total display",
            ],
            "tolerance": tolerance,
        },
        "placement": {
            "rules": [
                "Wall stories maintain left-to-right color progression",
                "Mannequin groupings must maintain style cohesion",
                "Focal displays limited to 1-2 hero products",
                f"Visual mood must remain: {intent.visual_mood}",
            ],
            "tolerance": tolerance,
        },
    }
