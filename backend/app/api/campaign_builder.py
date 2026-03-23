import uuid
import logging
from pathlib import Path
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from google.genai import types

from app.core.gemini_client import get_gemini_client
from app.core.config import settings
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.campaign import CampaignProject
from app.schemas.campaign_builder import (
    CampaignGenerateInput,
    CampaignSaveInput,
    CampaignResponse,
)

logger = logging.getLogger(__name__)

router = APIRouter(tags=["campaign-builder"])


@router.post("/generate")
def generate_campaign(
    body: CampaignGenerateInput,
    current_user: User = Depends(get_current_user),
):
    if body.custom_prompt:
        prompt = body.custom_prompt + " Do not include any logos, brand marks, watermarks, emblems, email addresses, or contact information of any kind."
    else:
        parts = [
            f"Create a professional fashion campaign visual. Format: {body.format}.",
            f"Style: {body.style}.",
        ]
        if body.headline:
            parts.append(f'Headline text: "{body.headline}".')
        if body.subheadline:
            parts.append(f'Subheadline: "{body.subheadline}".')
        if body.cta:
            parts.append(f'Call-to-action button: "{body.cta}".')
        if body.product_description:
            parts.append(f"Product: {body.product_description}.")
        parts.append(
            "High-end fashion advertising, clean typography, "
            "magazine-quality composition, 4K resolution. "
            "Do not include any logos, brand marks, watermarks, emblems, email addresses, or contact information of any kind."
        )
        prompt = " ".join(parts)

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
                filename = f"campaign_{uuid.uuid4().hex}.{ext}"
                save_dir = Path(settings.GENERATED_DIR) / "campaigns"
                save_dir.mkdir(parents=True, exist_ok=True)
                (save_dir / filename).write_bytes(part.inline_data.data)
                image_url = f"/generated/campaigns/{filename}"
                return {"image_url": image_url, "prompt_used": prompt}

        raise HTTPException(
            status_code=500,
            detail="AI model did not return an image. Please try again.",
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Campaign generation failed")
        raise HTTPException(
            status_code=500,
            detail=f"Campaign generation failed: {str(e)}",
        )


@router.get("/list", response_model=List[CampaignResponse])
def list_campaigns(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    campaigns = (
        db.query(CampaignProject)
        .filter(CampaignProject.user_id == current_user.id)
        .order_by(CampaignProject.created_at.desc())
        .all()
    )
    return campaigns


@router.post("/save", response_model=CampaignResponse)
def save_campaign(
    body: CampaignSaveInput,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    campaign = CampaignProject(
        user_id=current_user.id,
        name=body.name,
        format=body.format,
        config=body.config,
        result_image_url=body.result_image_url,
    )
    db.add(campaign)
    db.commit()
    db.refresh(campaign)
    return campaign
