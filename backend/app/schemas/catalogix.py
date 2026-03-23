from pydantic import BaseModel
from typing import List


class CatalogixOutput(BaseModel):
    seo_title: str
    description: str
    bullet_features: List[str]
    keywords: List[str]
    tags: List[str]
    confidence_score: float
