import uuid
from pathlib import Path
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.core.config import settings
from app.models.user import User
from app.models.artifax import ArtifaxProject
from app.schemas.artifax import (
    TrendResearchInput,
    CompetitorInput,
    RunwayInput,
    ConceptGenerateInput,
    ColorGenerateInput,
    MoodboardGenerateInput,
    VisualizationInput,
    ArtifaxProjectCreate,
    ArtifaxProjectUpdate,
)
from app.services.artifax_research_service import (
    generate_trend_analysis,
    generate_competitor_analysis,
    generate_runway_analysis,
)
from app.services.artifax_concept_service import (
    generate_concept_images,
    generate_moodboard_images,
    generate_color_palette,
    extract_colors_from_image,
)
from app.services.artifax_visualization_service import generate_product_visualization

router = APIRouter(tags=["artifax"])


# ─────────────────────────── Project CRUD ───────────────────────────────────

@router.get("/projects")
async def list_projects(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    projects = (
        db.query(ArtifaxProject)
        .filter(ArtifaxProject.user_id == current_user.id)
        .order_by(ArtifaxProject.created_at.desc())
        .all()
    )
    return {
        "projects": [
            {"id": p.id, "name": p.name, "created_at": str(p.created_at)}
            for p in projects
        ]
    }


@router.post("/projects")
async def create_project(
    data: ArtifaxProjectCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    project = ArtifaxProject(user_id=current_user.id, name=data.name)
    db.add(project)
    db.commit()
    db.refresh(project)
    return {"id": project.id, "name": project.name, "created_at": str(project.created_at)}


@router.get("/projects/{project_id}")
async def get_project(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    project = (
        db.query(ArtifaxProject)
        .filter(
            ArtifaxProject.id == project_id,
            ArtifaxProject.user_id == current_user.id,
        )
        .first()
    )
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return {
        "id": project.id,
        "name": project.name,
        "research_data": project.research_data,
        "moodboard_data": project.moodboard_data,
        "palette_data": project.palette_data,
        "visualization_data": project.visualization_data,
        "created_at": str(project.created_at),
    }


@router.put("/projects/{project_id}")
async def update_project(
    project_id: int,
    data: ArtifaxProjectUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    project = (
        db.query(ArtifaxProject)
        .filter(
            ArtifaxProject.id == project_id,
            ArtifaxProject.user_id == current_user.id,
        )
        .first()
    )
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    if data.name is not None:
        project.name = data.name
    if data.research_data is not None:
        project.research_data = data.research_data
    if data.moodboard_data is not None:
        project.moodboard_data = data.moodboard_data
    if data.palette_data is not None:
        project.palette_data = data.palette_data
    if data.visualization_data is not None:
        project.visualization_data = data.visualization_data
    db.commit()
    return {"status": "updated", "id": project.id}


# ─────────────────────────── Research ───────────────────────────────────────

@router.post("/research/trends")
async def research_trends(
    data: TrendResearchInput,
    current_user: User = Depends(get_current_user),
):
    try:
        return await generate_trend_analysis(
            data.category, data.season, data.region, data.style_keywords
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Trend analysis failed: {str(e)}")


@router.post("/research/competitor")
async def research_competitor(
    data: CompetitorInput,
    current_user: User = Depends(get_current_user),
):
    try:
        return await generate_competitor_analysis(data.brand_name, data.category)
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Competitor analysis failed: {str(e)}"
        )


@router.post("/research/runway")
async def research_runway(
    data: RunwayInput,
    current_user: User = Depends(get_current_user),
):
    try:
        return await generate_runway_analysis(data.season, data.region)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Runway analysis failed: {str(e)}")


@router.post("/research/upload-inspiration")
async def upload_inspiration(
    image: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    """Upload an inspiration image to the research library."""
    upload_dir = Path(settings.UPLOAD_DIR) / "inspiration"
    upload_dir.mkdir(parents=True, exist_ok=True)

    ext = Path(image.filename).suffix if image.filename else ".jpg"
    filename = f"inspiration_{uuid.uuid4()}{ext}"
    image_path = upload_dir / filename

    with open(image_path, "wb") as f:
        content = await image.read()
        f.write(content)

    return {
        "url": f"http://localhost:8000/uploads/inspiration/{filename}",
        "filename": filename,
    }


# ─────────────────────────── Concept ────────────────────────────────────────

@router.post("/concept/generate")
async def generate_concept(
    data: ConceptGenerateInput,
    current_user: User = Depends(get_current_user),
):
    try:
        images = await generate_concept_images(
            data.concept_description, data.category, data.style, data.colors, data.count
        )
        return {"images": images}
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Concept generation failed: {str(e)}"
        )


@router.post("/concept/color")
async def generate_color(
    data: ColorGenerateInput,
    current_user: User = Depends(get_current_user),
):
    try:
        return await generate_color_palette(data.concept, data.mood, data.season, data.count)
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Color palette generation failed: {str(e)}"
        )


@router.post("/concept/extract-colors")
async def extract_colors(
    image: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    upload_dir = Path(settings.UPLOAD_DIR)
    upload_dir.mkdir(exist_ok=True)

    ext = Path(image.filename).suffix if image.filename else ".jpg"
    filename = f"color_extract_{uuid.uuid4()}{ext}"
    image_path = str(upload_dir / filename)

    with open(image_path, "wb") as f:
        content = await image.read()
        f.write(content)

    try:
        return await extract_colors_from_image(image_path)
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Color extraction failed: {str(e)}"
        )


# ─────────────────────────── Moodboard ──────────────────────────────────────

@router.post("/moodboard/generate")
async def generate_moodboard(
    data: MoodboardGenerateInput,
    current_user: User = Depends(get_current_user),
):
    try:
        images = await generate_moodboard_images(
            data.theme, data.mood, data.color_story, data.count, data.image_urls
        )
        return {"images": images}
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Moodboard generation failed: {str(e)}"
        )


# ─────────────────────────── Visualization ──────────────────────────────────

@router.post("/visualization/generate")
async def generate_visualization(
    data: VisualizationInput,
    current_user: User = Depends(get_current_user),
):
    try:
        return await generate_product_visualization(
            data.attributes.model_dump(), data.angle
        )
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Visualization generation failed: {str(e)}"
        )


