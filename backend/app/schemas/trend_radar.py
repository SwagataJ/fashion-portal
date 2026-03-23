from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class TrendAnalyzeInput(BaseModel):
    category: str = "womenswear"
    season: str = "SS26"
    market: Optional[str] = "global"


class TrendScoutInput(BaseModel):
    query: str
    category: Optional[str] = None
    market: Optional[str] = None


class BrandCompareInput(BaseModel):
    brands: list[str]
    category: Optional[str] = "womenswear"


class TrendItem(BaseModel):
    name: str
    category: str
    score: float
    growth: str
    description: str
    color_hex: Optional[str] = None


class TrendRadarOutput(BaseModel):
    trends: list[TrendItem]
    summary: str
    season: str
