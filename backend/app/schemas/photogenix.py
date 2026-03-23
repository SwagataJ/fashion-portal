from pydantic import BaseModel


class PhotogenixOutput(BaseModel):
    generated_image_url: str
    original_image_url: str
    image_id: str
