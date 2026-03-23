import uuid
import logging
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException
from google.genai import types

from app.core.gemini_client import get_gemini_client
from app.core.config import settings
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.model_studio import ModelGenerateInput, ModelGenerateOutput

logger = logging.getLogger(__name__)

router = APIRouter(tags=["model-studio"])


@router.post("/generate", response_model=ModelGenerateOutput)
def generate_model(
    body: ModelGenerateInput,
    current_user: User = Depends(get_current_user),
):
    prompt = (
        f"Professional fashion model portrait for e-commerce catalog. "
        f"{body.gender}, age {body.age_range}, {body.resolved_ethnicity} ethnicity, "
        f"{body.body_type} build, {body.pose} pose, {body.expression} expression, "
        f"{body.resolved_hair} hair, {body.shoot_mood} mood. "
        f"High-end fashion photography, studio lighting, clean background, 4K quality."
    )

    try:
        client = get_gemini_client()
        response = client.models.generate_content(
            model=settings.GENAI_MODEL_ID,
            contents=prompt,
            config=types.GenerateContentConfig(
                response_modalities=["TEXT", "IMAGE"],
            ),
        )

        for part in response.candidates[0].content.parts:
            if part.inline_data and part.inline_data.mime_type.startswith("image/"):
                ext = part.inline_data.mime_type.split("/")[-1]
                filename = f"model_{uuid.uuid4().hex}.{ext}"
                save_dir = Path(settings.GENERATED_DIR) / "model_studio"
                save_dir.mkdir(parents=True, exist_ok=True)
                (save_dir / filename).write_bytes(part.inline_data.data)
                image_url = f"/generated/model_studio/{filename}"
                return ModelGenerateOutput(image_url=image_url, prompt_used=prompt)

        raise HTTPException(
            status_code=500,
            detail="AI model did not return an image. Please try again.",
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Model studio generation failed")
        raise HTTPException(
            status_code=500,
            detail=f"Image generation failed: {str(e)}",
        )


@router.get("/presets")
def get_presets(current_user: User = Depends(get_current_user)):
    return {
        "gender": ["female", "male", "non-binary"],
        "age_range": ["18-24", "25-30", "31-40", "41-50", "50+"],
        "ethnicity": [
            "diverse", "south-asian", "east-asian", "african",
            "caucasian", "latin", "middle-eastern",
        ],
        "pose": [
            "standing", "walking", "seated", "leaning",
            "profile", "three-quarter", "dynamic",
        ],
        "body_type": ["slim", "athletic", "curvy", "petite", "tall", "plus-size"],
        "expression": [
            "natural", "confident", "joyful", "serious",
            "mysterious", "approachable", "editorial",
        ],
        "hair_style": [
            "natural", "straight", "wavy", "curly", "updo",
            "braided", "short", "bald",
        ],
        "shoot_mood": [
            "editorial", "commercial", "streetwear", "luxury",
            "casual", "athletic", "bohemian", "minimalist",
        ],
    }
