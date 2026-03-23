import logging
from datetime import date

from fastapi import APIRouter, Depends, HTTPException

from app.core.gemini_client import gemini_text
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.copilot import CopilotChatInput, CopilotChatOutput

logger = logging.getLogger(__name__)

router = APIRouter(tags=["copilot"])

def _build_system_instruction() -> str:
    today = date.today()
    return (
        f"Today's date is {today.strftime('%B %d, %Y')}. The current active fashion season is SS26 "
        f"(Spring/Summer 2026). When the user refers to 'current', 'upcoming', or any season without "
        f"specifying a year, assume they mean SS26 unless stated otherwise. Do not reference SS24 or "
        f"SS25 as current — those are past seasons.\n\n"
        "You are a premium fashion AI copilot. You help creative directors, "
        "merchandisers, and designers with visual direction, trend insights, "
        "styling advice, campaign ideation, and design feedback. Be concise, "
        "inspiring, and fashion-forward. Use industry terminology naturally.\n\n"
        "At the end of every response, include a section marked '---SUGGESTIONS---' "
        "followed by exactly 3 short suggested follow-up questions or actions, "
        "each on its own line."
    )


@router.post("/chat", response_model=CopilotChatOutput)
def chat(
    body: CopilotChatInput,
    current_user: User = Depends(get_current_user),
):
    # Build conversation into a single prompt
    conversation_parts = []
    if body.context:
        conversation_parts.append(f"Context: {body.context}\n")

    for msg in body.messages:
        role_label = "User" if msg.role == "user" else "Assistant"
        conversation_parts.append(f"{role_label}: {msg.content}")

    prompt = "\n".join(conversation_parts)

    try:
        raw = gemini_text(prompt, system_instruction=_build_system_instruction())

        # Parse suggestions from the response
        response_text = raw
        suggestions = []

        if "---SUGGESTIONS---" in raw:
            parts = raw.split("---SUGGESTIONS---", 1)
            response_text = parts[0].strip()
            suggestion_lines = parts[1].strip().split("\n")
            suggestions = [
                line.strip().lstrip("0123456789.-) ").strip()
                for line in suggestion_lines
                if line.strip()
            ][:3]

        if not suggestions:
            suggestions = [
                "Tell me more about current color trends",
                "Suggest a mood board direction",
                "How can I improve this concept?",
            ]

        return CopilotChatOutput(response=response_text, suggestions=suggestions)

    except Exception as e:
        logger.exception("Copilot chat failed")
        raise HTTPException(
            status_code=500,
            detail=f"Copilot chat failed: {str(e)}",
        )
