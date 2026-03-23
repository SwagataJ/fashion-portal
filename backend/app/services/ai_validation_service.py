from sqlalchemy.orm import Session
from app.core.gemini_client import gemini_json
from app.models.vm_tower import (
    DesignIntent, ConceptLock, VMLayout, BuyerEdit, WorkflowStatus
)
from app.schemas.vm_tower import ValidationResult
import json


def validate_buyer_edit(
    db: Session,
    layout_id: int,
    user_id: int,
    edit_type: str,
    edit_data: dict,
) -> tuple[BuyerEdit, ValidationResult]:
    layout = db.query(VMLayout).filter(VMLayout.id == layout_id).first()
    if not layout:
        return None, ValidationResult(status="violation", message="Layout not found")

    intent = db.query(DesignIntent).filter(DesignIntent.id == layout.intent_id).first()
    lock = db.query(ConceptLock).filter(
        ConceptLock.intent_id == layout.intent_id,
        ConceptLock.is_active == 1
    ).first()

    if not lock:
        validation = ValidationResult(
            status="valid",
            message="No concept lock active — edit allowed without restrictions.",
        )
    else:
        validation = _evaluate_edit_against_lock(intent, lock, layout, edit_type, edit_data)

    # Update intent status to buyer_editing
    if intent and intent.status == WorkflowStatus.CONCEPT_LOCKED:
        intent.status = WorkflowStatus.BUYER_EDITING

    buyer_edit = BuyerEdit(
        layout_id=layout_id,
        user_id=user_id,
        edit_type=edit_type,
        edit_data=edit_data,
        validation_result=validation.status,
        validation_message=validation.message,
        applied=1 if validation.status in ("valid", "warning") else 0,
    )
    db.add(buyer_edit)
    db.commit()
    db.refresh(buyer_edit)

    return buyer_edit, validation


def get_edit_history(db: Session, layout_id: int) -> list[BuyerEdit]:
    return db.query(BuyerEdit).filter(
        BuyerEdit.layout_id == layout_id
    ).order_by(BuyerEdit.created_at.desc()).all()


def _evaluate_edit_against_lock(
    intent: DesignIntent,
    lock: ConceptLock,
    layout: VMLayout,
    edit_type: str,
    edit_data: dict,
) -> ValidationResult:
    try:
        prompt = f"""You are a visual merchandising AI validation engine. Evaluate a buyer's proposed edit against concept lock constraints.

Design Intent:
- Theme: {intent.theme}
- Color Flow: {json.dumps(intent.color_flow)}
- Visual Mood: {intent.visual_mood}
- AI Context: {intent.ai_context_summary}

Concept Lock Constraints:
- Color Continuity: {json.dumps(lock.color_continuity_rules)}
- Focal Hierarchy: {json.dumps(lock.focal_hierarchy_rules)}
- Category Balance: {json.dumps(lock.category_balance_rules)}
- Placement: {json.dumps(lock.placement_rules)}
- Flexibility: {lock.flexibility_level}

Current Layout:
- Type: {layout.layout_type}
- Placement Plan: {json.dumps(layout.placement_plan)}
- Product Grouping: {json.dumps(layout.product_grouping)}

Proposed Edit:
- Type: {edit_type}
- Details: {json.dumps(edit_data)}

Evaluate the edit and respond with JSON:
{{
    "status": "valid" or "warning" or "violation",
    "message": "Clear explanation of the evaluation",
    "details": {{
        "affected_rules": ["list of rules affected"],
        "severity": 1-10,
        "suggestion": "alternative approach if violation"
    }}
}}"""

        raw = gemini_json(
            prompt=prompt,
            system_instruction="You are a VM validation engine. Return valid JSON only.",
            temperature=0.3,
        )

        result = json.loads(raw)
        return ValidationResult(
            status=result.get("status", "warning"),
            message=result.get("message", "Edit evaluated"),
            details=result.get("details"),
        )

    except Exception:
        return _fallback_validation(lock, edit_type, edit_data)


def _fallback_validation(lock: ConceptLock, edit_type: str, edit_data: dict) -> ValidationResult:
    if edit_type == "swap_product":
        if lock.flexibility_level == "strict":
            return ValidationResult(
                status="warning",
                message="Product swap detected under strict concept lock. Verify the replacement maintains color flow and category balance.",
                details={"affected_rules": ["color_continuity", "category_balance"]},
            )
        return ValidationResult(
            status="valid",
            message="Product swap allowed within flexibility tolerance.",
        )

    if edit_type == "adjust_assortment":
        return ValidationResult(
            status="warning",
            message="Assortment adjustment may affect category balance. Review against concept lock proportions.",
            details={"affected_rules": ["category_balance"]},
        )

    if edit_type == "move_placement":
        return ValidationResult(
            status="warning",
            message="Placement change may affect visual hierarchy and color flow. Verify against concept lock rules.",
            details={"affected_rules": ["focal_hierarchy", "placement"]},
        )

    return ValidationResult(
        status="warning",
        message=f"Edit type '{edit_type}' requires manual review against concept lock.",
    )
