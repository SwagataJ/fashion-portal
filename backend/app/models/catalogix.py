from sqlalchemy import Column, Integer, JSON, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.core.database import Base


class CatalogixProject(Base):
    __tablename__ = "catalogix_projects"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    input_data = Column(JSON)
    output_data = Column(JSON)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
