from pydantic import BaseModel
from typing import Optional


class PhotogenixOutput(BaseModel):
    generated_image_url: str
    original_image_url: str
    image_id: str


class OnModelOutput(BaseModel):
    generated_image_url: str
    original_image_url: str
    image_id: str
