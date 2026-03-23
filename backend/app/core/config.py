from pathlib import Path
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # JWT Auth
    JWT_SECRET: str = "fashion-ai-platform-secret-key-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours

    # Database
    DATABASE_URL: str = "sqlite:///./fashion_platform.db"

    # Storage
    UPLOAD_DIR: str = "uploads"
    GENERATED_DIR: str = "generated"

    # Nano Banana / Vertex AI (image generation)
    SERVICE_ACCOUNT_PATH: Path = (
        Path(__file__).resolve().parent.parent.parent / "credentials" / "service-account.json"
    )
    GCP_PROJECT_ID: str = "nano-banana-api-test-484205"
    GCP_LOCATION: str = "global"
    GENAI_MODEL_ID: str = "gemini-3.1-flash-image-preview"

    # Gemini Text (for all text AI tasks)
    GEMINI_TEXT_MODEL: str = "gemini-2.0-flash"

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
