from pydantic import BaseModel
from typing import Optional


class SceneGenerateInput(BaseModel):
    background_type: str = "studio"
    lighting: str = "softbox"
    camera_angle: str = "full_body"
    mood: str = "premium"
    custom_prompt: Optional[str] = None
    warmth: float = 0.5
    intensity: float = 0.7


class SceneGenerateOutput(BaseModel):
    scene_image_url: str
    prompt_used: str
