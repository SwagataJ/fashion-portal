from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class CampaignGenerateInput(BaseModel):
    format: str = "hero_banner"
    headline: Optional[str] = None
    subheadline: Optional[str] = None
    cta: Optional[str] = None
    style: str = "premium"
    product_description: Optional[str] = None
    custom_prompt: Optional[str] = None


class CampaignSaveInput(BaseModel):
    name: str
    format: str
    config: dict
    result_image_url: Optional[str] = None


class CampaignResponse(BaseModel):
    id: int
    user_id: int
    name: str
    format: str
    config: dict
    result_image_url: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
