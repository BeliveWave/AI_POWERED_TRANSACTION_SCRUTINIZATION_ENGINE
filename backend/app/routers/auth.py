from fastapi import APIRouter, Depends, status, HTTPException, Body
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.user import UserCreate, UserResponse, UserLogin, UserUpdate, UserResetPassword
from app.schemas.auth import Token
from app.models.user import User
from app.services.user_service import user_service
from app.services.auth_service import auth_service
from app.utils.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    return user_service.register_new_user(db, user_in)

@router.post("/login", response_model=Token)
def login(login_data: UserLogin, db: Session = Depends(get_db)):
    return auth_service.authenticate_user(db, login_data)

@router.get("/me", response_model=UserResponse)
def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.put("/me", response_model=UserResponse)
def update_user_me(user_in: UserUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return user_service.update_profile(db, current_user, user_in)

# --- 2FA Endpoints ---
@router.post("/2fa/generate")
def generate_2fa(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Generates a new 2FA secret and QR code URI."""
    return user_service.generate_2fa_secret(db, current_user)

@router.post("/2fa/enable")
def enable_2fa(code: str = Body(..., embed=True), current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Enables 2FA if the code is correct."""
    return user_service.enable_2fa(db, current_user, code)

@router.post("/2fa/disable")
def disable_2fa(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Disables 2FA."""
    return user_service.disable_2fa(db, current_user)

# --- Password Reset ---
@router.post("/forgot-password")
def forgot_password(email: str = Body(..., embed=True), db: Session = Depends(get_db)):
    return user_service.forgot_password(db, email)

@router.post("/reset-password")
def reset_password(data: UserResetPassword, db: Session = Depends(get_db)):
    return user_service.reset_password(db, data)
