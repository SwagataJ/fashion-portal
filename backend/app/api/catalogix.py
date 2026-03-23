import uuid
from pathlib import Path
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.core.config import settings
from app.models.user import User
from app.models.catalogix import CatalogixProject
from app.schemas.catalogix import CatalogixOutput
from app.services.catalogix_service import generate_product_catalog

router = APIRouter(tags=["catalogix"])


@router.post("/generate", response_model=CatalogixOutput)
async def generate_catalog(
    product_name: str = Form(...),
    department: str = Form(...),
    category: str = Form(...),
    attributes: str = Form(...),
    image: Optional[UploadFile] = File(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    image_path = None

    if image and image.filename:
        upload_dir = Path(settings.UPLOAD_DIR)
        upload_dir.mkdir(exist_ok=True)

        ext = Path(image.filename).suffix or ".jpg"
        filename = f"{uuid.uuid4()}{ext}"
        image_path = str(upload_dir / filename)

        with open(image_path, "wb") as f:
            content = await image.read()
            f.write(content)

    try:
        result = await generate_product_catalog(
            product_name,
            department,
            category,
            attributes,
            image_path,
        )

        input_data = {
            "product_name": product_name,
            "department": department,
            "category": category,
            "attributes": attributes,
        }

        project = CatalogixProject(
            user_id=current_user.id,
            input_data=input_data,
            output_data=result,
        )
        db.add(project)
        db.commit()

        return result
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Catalog generation failed: {str(e)}"
        )
