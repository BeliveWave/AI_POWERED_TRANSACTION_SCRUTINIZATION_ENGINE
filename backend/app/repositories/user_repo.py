from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.user import User

class UserRepository:
    def get_user_by_email(self, db: Session, email: str):
        """Fetches user by email (case-insensitive)."""
        if not email:
            return None
        return db.query(User).filter(func.lower(User.email) == email.strip().lower()).first()

    def get_user_by_username(self, db: Session, username: str):
        """Fetches user by username (case-insensitive)."""
        if not username:
            return None
        return db.query(User).filter(func.lower(User.username) == username.strip().lower()).first()

    def get_user_by_id(self, db: Session, user_id: str):
        """Fetches user by primary ID."""
        return db.query(User).filter(User.id == user_id).first()

    def create_user(self, db: Session, user: User):
        db.add(user)
        db.commit()
        db.refresh(user)
        return user

user_repo = UserRepository()
