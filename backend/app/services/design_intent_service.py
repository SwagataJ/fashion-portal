from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.gemini_client import gemini_text
from app.models.vm_tower import DesignIntent, WorkflowStatus
from app.schemas.vm_tower import DesignIntentCreate, DesignIntentUpdate
import json


def create_design_intent(db: Session, user_id: int, data: DesignIntentCreate) -> DesignIntent:
    intent = DesignIntent(
        user_id=user_id,
        theme=data.theme,
        season=data.season,
        color_flow=data.color_flow,
        key_piece_priority=data.key_piece_priority,
        styling_rules=data.styling_rules,
        category_mix=data.category_mix,
        target_store_type=data.target_store_type,
        visual_mood=data.visual_mood,
        status=WorkflowStatus.INTENT_DEFINED,
    )
    db.add(intent)
    db.commit()
    db.refresh(intent)

    # Generate AI context summary
    ai_summary = generate_ai_context_summary(intent)
    intent.ai_context_summary = ai_summary
    db.commit()
    db.refresh(intent)

    return intent


def update_design_intent(db: Session, intent_id: int, user_id: int, data: DesignIntentUpdate) -> DesignIntent:
    intent = db.query(DesignIntent).filter(
        DesignIntent.id == intent_id,
        DesignIntent.user_id == user_id
    ).first()
    if not intent:
        return None

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(intent, key, value)

    # Regenerate AI summary
    intent.ai_context_summary = generate_ai_context_summary(intent)
    db.commit()
    db.refresh(intent)
    return intent


def get_design_intent(db: Session, intent_id: int, user_id: int) -> DesignIntent:
    return db.query(DesignIntent).filter(
        DesignIntent.id == intent_id,
        DesignIntent.user_id == user_id
    ).first()


def list_design_intents(db: Session, user_id: int) -> list[DesignIntent]:
    return db.query(DesignIntent).filter(
        DesignIntent.user_id == user_id
    ).order_by(DesignIntent.created_at.desc()).all()


def update_intent_status(db: Session, intent_id: int, user_id: int, status: str) -> DesignIntent:
    intent = db.query(DesignIntent).filter(
        DesignIntent.id == intent_id,
        DesignIntent.user_id == user_id
    ).first()
    if not intent:
        return None
    intent.status = status
    db.commit()
    db.refresh(intent)
    return intent


def generate_ai_context_summary(intent: DesignIntent) -> str:
    try:
        color_flow_str = " → ".join(intent.color_flow) if intent.color_flow else "not specified"
        styling_rules_str = ", ".join(intent.styling_rules) if intent.styling_rules else "none"
        category_mix_str = ", ".join(
            [f"{k} {v}%" for k, v in intent.category_mix.items()]
        ) if intent.category_mix else "not specified"

        key_pieces_str = "none"
        if intent.key_piece_priority:
            key_pieces_str = ", ".join(
                [p.get("name", p.get("sku", "unknown")) for p in intent.key_piece_priority]
            )

        prompt = f"""You are a visual merchandising AI expert. Analyze this design intent and produce a structured reasoning summary, visual planning blueprint, and generation prompt context.

Design Intent:
- Theme: {intent.theme}
- Season: {intent.season}
- Color Flow: {color_flow_str}
- Key Pieces: {key_pieces_str}
- Styling Rules: {styling_rules_str}
- Category Mix: {category_mix_str}
- Store Type: {intent.target_store_type}
- Visual Mood: {intent.visual_mood}

Provide a concise 2-3 sentence summary that captures:
1. The core visual narrative
2. How products should be merchandised
3. The customer experience goal

Keep it professional and actionable for a VM team."""

        return gemini_text(
            prompt=prompt,
            system_instruction="You are a visual merchandising AI expert. Provide concise, actionable summaries.",
            temperature=0.7,
        )
    except Exception as e:
        # Fallback to template-based summary
        color_flow_str = " → ".join(intent.color_flow) if intent.color_flow else "neutral tones"
        return (
            f"This concept highlights {intent.theme} for {intent.season} using a "
            f"{color_flow_str} color progression with a {intent.visual_mood} mood. "
            f"Targeting {intent.target_store_type} stores, the layout should emphasize "
            f"hero products at eye level with clear category zoning."
        )
