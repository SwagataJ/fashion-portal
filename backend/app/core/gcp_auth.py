"""
Authentication service for Google Vertex AI (Nano Banana).
Uses google-auth service account credentials with Cloud Platform scope.
"""

from pathlib import Path
from google.oauth2 import service_account
from app.core.config import settings

SCOPES = ["https://www.googleapis.com/auth/cloud-platform"]

_credentials: service_account.Credentials | None = None


def get_credentials() -> service_account.Credentials:
    """Return Google service account credentials, loading once."""
    global _credentials
    if _credentials is None:
        path = Path(settings.SERVICE_ACCOUNT_PATH)
        if not path.exists():
            raise FileNotFoundError(
                f"Service account JSON not found at {path}. "
                "Place your Nano Banana credentials there."
            )
        _credentials = service_account.Credentials.from_service_account_file(
            str(path),
            scopes=SCOPES,
        )
    return _credentials


def credentials_available() -> bool:
    try:
        get_credentials()
        return True
    except FileNotFoundError:
        return False
