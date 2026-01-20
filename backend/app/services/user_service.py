from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.repositories.user_repo import user_repo
from app.schemas.user import UserCreate
from app.models.user import User
from app.utils.password import get_password_hash

class UserService:
    def register_new_user(self, db: Session, user_in: UserCreate):
        # Check if email exists
        user = user_repo.get_user_by_email(db, email=user_in.email)
        if user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered",
            )
        
        # Check if username exists
        user = user_repo.get_user_by_username(db, username=user_in.username)
        if user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already taken",
            )
        
        # Create user
        hashed_password = get_password_hash(user_in.password)
        db_user = User(
            email=user_in.email,
            username=user_in.username,
            full_name=user_in.full_name,
            password_hash=hashed_password
        )
        return user_repo.create_user(db, db_user)

user_service = UserService()
