from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.artifax import ArtifaxProject
from app.models.photogenix import PhotogenixProject
from app.models.catalogix import CatalogixProject
from app.schemas.dashboard import DashboardStats

router = APIRouter(tags=["dashboard"])


@router.get("/stats", response_model=DashboardStats)
def get_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    total_designs = (
        db.query(ArtifaxProject)
        .filter(ArtifaxProject.user_id == current_user.id)
        .count()
    )
    total_images = (
        db.query(PhotogenixProject)
        .filter(PhotogenixProject.user_id == current_user.id)
        .count()
    )
    total_catalogs = (
        db.query(CatalogixProject)
        .filter(CatalogixProject.user_id == current_user.id)
        .count()
    )

    return DashboardStats(
        total_designs=total_designs,
        total_images=total_images,
        total_catalogs=total_catalogs,
        recent_activity=[],
    )
