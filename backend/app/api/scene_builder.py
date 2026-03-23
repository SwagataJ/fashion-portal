import uuid
import logging
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException
from google.genai import types

from app.core.gemini_client import get_gemini_client
from app.core.config import settings
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.scene_builder import SceneGenerateInput, SceneGenerateOutput

logger = logging.getLogger(__name__)

router = APIRouter(tags=["scene-builder"])


@router.post("/generate", response_model=SceneGenerateOutput)
def generate_scene(
    body: SceneGenerateInput,
    current_user: User = Depends(get_current_user),
):
    if body.custom_prompt:
        prompt = body.custom_prompt
    else:
        prompt = (
            f"Professional fashion photography background scene. "
            f"Background type: {body.background_type}. "
            f"Lighting setup: {body.lighting}, warmth level {body.warmth:.1f}, "
            f"intensity level {body.intensity:.1f}. "
            f"Camera angle: {body.camera_angle}. Mood: {body.mood}. "
            f"Empty scene with no people, ready for fashion product placement. "
            f"High-resolution, commercial quality, 4K."
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
                filename = f"scene_{uuid.uuid4().hex}.{ext}"
                save_dir = Path(settings.GENERATED_DIR) / "scenes"
                save_dir.mkdir(parents=True, exist_ok=True)
                (save_dir / filename).write_bytes(part.inline_data.data)
                scene_url = f"/generated/scenes/{filename}"
                return SceneGenerateOutput(
                    scene_image_url=scene_url, prompt_used=prompt
                )

        raise HTTPException(
            status_code=500,
            detail="AI model did not return an image. Please try again.",
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Scene builder generation failed")
        raise HTTPException(
            status_code=500,
            detail=f"Scene generation failed: {str(e)}",
        )


@router.get("/presets")
def get_presets(current_user: User = Depends(get_current_user)):
    return {
        "background_type": [
            "studio", "outdoor-urban", "outdoor-nature", "indoor-loft",
            "indoor-minimal", "runway", "rooftop", "beach",
            "cafe", "gallery", "warehouse", "garden",
        ],
        "lighting": [
            "softbox", "natural", "golden-hour", "dramatic",
            "ring-light", "neon", "backlit", "flat",
            "rembrandt", "butterfly", "split",
        ],
        "camera_angle": [
            "full_body", "three_quarter", "close_up", "bird_eye",
            "low_angle", "eye_level", "dutch_angle",
        ],
        "mood": [
            "premium", "edgy", "romantic", "minimalist",
            "vibrant", "moody", "playful", "sophisticated",
        ],
    }
