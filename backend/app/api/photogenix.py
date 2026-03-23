import uuid
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.core.config import settings
from app.models.user import User
from app.models.photogenix import PhotogenixProject
from app.schemas.photogenix import PhotogenixOutput
from app.services.photogenix_service import generate_enhanced_product_image

router = APIRouter(tags=["photogenix"])

ALLOWED_TYPES = {"image/jpeg", "image/jpg", "image/png", "image/webp"}


@router.post("/generate", response_model=PhotogenixOutput)
async def generate_photo(
    image: UploadFile = File(...),
    background_type: str = Form(...),
    shooting_style: str = Form(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if image.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=400,
            detail="Invalid image type. Supported: JPEG, PNG, WebP.",
        )

    upload_dir = Path(settings.UPLOAD_DIR)
    upload_dir.mkdir(exist_ok=True)

    ext = Path(image.filename).suffix if image.filename else ".jpg"
    if not ext:
        ext = ".jpg"
    upload_filename = f"{uuid.uuid4()}{ext}"
    upload_path = upload_dir / upload_filename

    with open(upload_path, "wb") as f:
        content = await image.read()
        f.write(content)

    try:
        generated_filename = await generate_enhanced_product_image(
            str(upload_path),
            background_type,
            shooting_style,
        )

        project = PhotogenixProject(
            user_id=current_user.id,
            original_image=upload_filename,
            generated_image=generated_filename,
            background_type=background_type,
            shooting_style=shooting_style,
        )
        db.add(project)
        db.commit()
        db.refresh(project)

        return PhotogenixOutput(
            generated_image_url=f"http://localhost:8000/generated/{generated_filename}",
            original_image_url=f"http://localhost:8000/uploads/{upload_filename}",
            image_id=str(project.id),
        )
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Image generation failed: {str(e)}"
        )
