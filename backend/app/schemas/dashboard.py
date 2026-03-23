from pydantic import BaseModel
from typing import List, Any


class DashboardStats(BaseModel):
    total_designs: int
    total_images: int
    total_catalogs: int
    recent_activity: List[Any] = []
