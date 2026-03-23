from sqlalchemy.orm import Session
from app.models.user import User
from app.core.security import verify_password, get_password_hash, create_access_token

ADMIN_EMAIL = "admin@fashion.ai"
ADMIN_PASSWORD = "admin123"


def authenticate_user(db: Session, email: str, password: str):
    user = db.query(User).filter(User.email == email).first()
    if not user:
        return None
    if not verify_password(password, user.password_hash):
        return None
    return user


def create_user(db: Session, email: str, password: str) -> User:
    hashed_password = get_password_hash(password)
    user = User(email=email, password_hash=hashed_password)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def get_or_create_admin(db: Session):
    admin = db.query(User).filter(User.email == ADMIN_EMAIL).first()
    if not admin:
        create_user(db, ADMIN_EMAIL, ADMIN_PASSWORD)


def get_token_for_user(user: User) -> str:
    return create_access_token({"sub": str(user.id)})
