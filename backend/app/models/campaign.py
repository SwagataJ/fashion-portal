from sqlalchemy import Column, Integer, String, JSON, DateTime, ForeignKey, Text
from sqlalchemy.sql import func
from app.core.database import Base


class CampaignProject(Base):
    __tablename__ = "campaign_projects"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    format = Column(String, nullable=False)
    config = Column(JSON, nullable=True)
    result_image_url = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
