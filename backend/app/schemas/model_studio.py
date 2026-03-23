from pydantic import BaseModel, Field
from typing import Optional, Union


class ModelGenerateInput(BaseModel):
    gender: str = "female"
    age_range: str = "25-30"
    ethnicity: Union[str, list[str]] = "diverse"
    pose: str = "standing"
    body_type: str = "slim"
    expression: str = "natural"
    hair_style: Optional[str] = Field(None, alias="hair_style")
    hair: Optional[str] = None  # frontend sends "hair" not "hair_style"
    shoot_mood: str = "editorial"

    @property
    def resolved_ethnicity(self) -> str:
        if isinstance(self.ethnicity, list):
            return ", ".join(self.ethnicity) if self.ethnicity else "diverse"
        return self.ethnicity

    @property
    def resolved_hair(self) -> str:
        return self.hair_style or self.hair or "natural"

    class Config:
        populate_by_name = True


class ModelGenerateOutput(BaseModel):
    image_url: str
    prompt_used: str
