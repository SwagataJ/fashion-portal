from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.core.database import Base


class PhotogenixProject(Base):
    __tablename__ = "photogenix_projects"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    original_image = Column(String)
    generated_image = Column(String)
    background_type = Column(String)
    shooting_style = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
