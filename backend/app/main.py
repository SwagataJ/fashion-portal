from pathlib import Path
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.core.database import Base, engine, SessionLocal
from app.services.auth_service import get_or_create_admin
from app.api import auth, artifax, photogenix, catalogix, dashboard, vm_tower
from app.api import model_studio, scene_builder, trend_radar, campaign_builder, copilot


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure storage directories exist
    Path(settings.UPLOAD_DIR).mkdir(exist_ok=True)
    Path(settings.GENERATED_DIR).mkdir(exist_ok=True)
    Path(settings.UPLOAD_DIR, "inspiration").mkdir(exist_ok=True)
    Path(settings.GENERATED_DIR, "vm_mockups").mkdir(parents=True, exist_ok=True)
    Path(settings.GENERATED_DIR, "model_studio").mkdir(parents=True, exist_ok=True)
    Path(settings.GENERATED_DIR, "scenes").mkdir(parents=True, exist_ok=True)
    Path(settings.GENERATED_DIR, "campaigns").mkdir(parents=True, exist_ok=True)
    Path(settings.UPLOAD_DIR, "vm_products").mkdir(parents=True, exist_ok=True)
    Path(settings.UPLOAD_DIR, "vm_ranges").mkdir(parents=True, exist_ok=True)
    Path(settings.UPLOAD_DIR, "vm_fixtures").mkdir(parents=True, exist_ok=True)

    # Create all database tables
    Base.metadata.create_all(bind=engine)

    # Seed admin user
    db = SessionLocal()
    try:
        get_or_create_admin(db)
    finally:
        db.close()

    yield


app = FastAPI(
    title="Fashion AI Platform",
    description="AI-powered Concept-to-Commerce platform for fashion brands",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve uploaded and generated images as static files
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")
app.mount("/generated", StaticFiles(directory=settings.GENERATED_DIR), name="generated")

# Register API routes
app.include_router(auth.router, prefix="/api/auth")
app.include_router(artifax.router, prefix="/api/artifax")
app.include_router(photogenix.router, prefix="/api/photogenix")
app.include_router(catalogix.router, prefix="/api/catalogix")
app.include_router(dashboard.router, prefix="/api/dashboard")
app.include_router(vm_tower.router, prefix="/api/vm-tower")
app.include_router(model_studio.router, prefix="/api/model-studio")
app.include_router(scene_builder.router, prefix="/api/scene-builder")
app.include_router(trend_radar.router, prefix="/api/trend-radar")
app.include_router(campaign_builder.router, prefix="/api/campaign-builder")
app.include_router(copilot.router, prefix="/api/copilot")


@app.get("/")
def root():
    return {"message": "Fashion AI Platform API v1.0.0", "docs": "/docs"}


@app.get("/health")
def health():
    return {"status": "healthy"}
