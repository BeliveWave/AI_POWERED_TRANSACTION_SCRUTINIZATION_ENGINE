from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.repositories.user_repo import user_repo
from app.utils.password import verify_password
from app.utils.tokens import create_access_token
from app.schemas.user import UserLogin

class AuthService:
    def authenticate_user(self, db: Session, login_data: UserLogin):
        # Determine if login is by email or username (simple check: if '@' in string)
        if "@" in login_data.username_or_email:
            user = user_repo.get_user_by_email(db, email=login_data.username_or_email)
        else:
            user = user_repo.get_user_by_username(db, username=login_data.username_or_email)
            
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
            
        if not verify_password(login_data.password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
            
        access_token = create_access_token(data={"sub": user.username})
        return {"access_token": access_token, "token_type": "bearer"}

auth_service = AuthService()
