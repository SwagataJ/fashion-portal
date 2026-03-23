from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime


# ─────────────────────────── Research ───────────────────────────

class TrendResearchInput(BaseModel):
    category: str
    season: str = "SS25"
    region: str = "Global"
    style_keywords: str = ""


class CompetitorInput(BaseModel):
    brand_name: str
    category: str


class RunwayInput(BaseModel):
    season: str
    region: str


# ─────────────────────────── Concept ────────────────────────────

class ConceptGenerateInput(BaseModel):
    concept_description: str
    category: str = ""
    style: str = ""
    colors: str = ""
    count: int = 2


class ColorGenerateInput(BaseModel):
    concept: str
    mood: str = ""
    season: str = ""
    count: int = 5


# ─────────────────────────── Visualization ──────────────────────

class ProductAttributes(BaseModel):
    garment_type: str
    sleeve_length: str = "Long"
    neck_type: str = "Round"
    fit: str = "Regular"
    fabric_texture: str = "Cotton"
    print_pattern: str = "Solid"
    color: str = "Navy Blue"
    length: str = "Regular"
    additional_details: str = ""


class VisualizationInput(BaseModel):
    attributes: ProductAttributes
    angle: str = "Front"


# ─────────────────────────── Moodboard ──────────────────────────

class MoodboardGenerateInput(BaseModel):
    theme: str = ""
    mood: str = ""
    color_story: str = ""
    count: int = 2
    image_urls: List[str] = []


# ─────────────────────────── Projects ───────────────────────────

class ArtifaxProjectCreate(BaseModel):
    name: str = "Untitled Project"


class ArtifaxProjectUpdate(BaseModel):
    name: Optional[str] = None
    research_data: Optional[Dict[str, Any]] = None
    moodboard_data: Optional[Dict[str, Any]] = None
    palette_data: Optional[Dict[str, Any]] = None
    visualization_data: Optional[Dict[str, Any]] = None


class ArtifaxProjectResponse(BaseModel):
    id: int
    name: str
    research_data: Optional[Dict[str, Any]] = None
    moodboard_data: Optional[Dict[str, Any]] = None
    palette_data: Optional[Dict[str, Any]] = None
    visualization_data: Optional[Dict[str, Any]] = None
    created_at: datetime

    model_config = {"from_attributes": True}
