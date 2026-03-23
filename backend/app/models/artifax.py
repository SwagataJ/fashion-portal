from sqlalchemy import Column, Integer, String, JSON, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.core.database import Base


class ArtifaxProject(Base):
    __tablename__ = "artifax_projects"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String, default="Untitled Project")

    # Full creative OS sections stored as JSON blobs
    research_data = Column(JSON, nullable=True)
    moodboard_data = Column(JSON, nullable=True)
    palette_data = Column(JSON, nullable=True)
    visualization_data = Column(JSON, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
