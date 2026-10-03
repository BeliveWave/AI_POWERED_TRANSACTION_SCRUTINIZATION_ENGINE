from fastapi import APIRouter, Depends, status, HTTPException, Body
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.user import (
    UserCreate, UserResponse, UserLogin, UserUpdate,
    UserResetPassword, ForgotPasswordRequest,
    VerifyResetTokenRequest, VerifyResetTokenResponse,
    ChangePasswordRequest
)
from app.schemas.auth import Token
from app.models.user import User
from app.services.user_service import user_service
from app.services.auth_service import auth_service
from app.utils.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    """Creates a new institutional user account."""
    return user_service.register_new_user(db, user_in)

@router.post("/login", response_model=Token)
def login(login_data: UserLogin, db: Session = Depends(get_db)):
    """Authenticates analyst credentials and returns a JWT bearer token."""
    return auth_service.authenticate_user(db, login_data)

@router.get("/me", response_model=UserResponse)
def read_users_me(current_user: User = Depends(get_current_user)):
    """Returns profile information for the authenticated user."""
    return current_user

@router.put("/me", response_model=UserResponse)
def update_user_me(user_in: UserUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Updates profile attributes for the authenticated user."""
    return user_service.update_profile(db, current_user, user_in)

@router.post("/change-password")
def change_password(data: ChangePasswordRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Allows an authenticated user to update their password."""
    return user_service.change_password(db, current_user, data)

@router.post("/forgot-password")
def forgot_password(data: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """Sends password reset token and OTP to registered institutional email."""
    return user_service.forgot_password(db, data.email)

@router.post("/verify-reset-token", response_model=VerifyResetTokenResponse)
def verify_reset_token(data: VerifyResetTokenRequest, db: Session = Depends(get_db)):
    """Validates that a password reset token is active and unexpired before form submission."""
    return user_service.verify_reset_token(db, data.email, data.token)

@router.post("/reset-password")
def reset_password(data: UserResetPassword, db: Session = Depends(get_db)):
    """Consumes the reset token/OTP and sets a new password."""
    return user_service.reset_password(db, data)

@router.post("/logout")
def logout(current_user: User = Depends(get_current_user)):
    """Invalidates client session."""
    return {"message": "Successfully signed out"}

# --- 2FA Endpoints ---
@router.post("/2fa/generate")
def generate_2fa(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Generates a new TOTP secret and provisioning URI."""
    return user_service.generate_2fa_secret(db, current_user)

@router.post("/2fa/enable")
def enable_2fa(code: str = Body(..., embed=True), current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Enables TOTP two-factor authentication after verifying a confirmation code."""
    return user_service.enable_2fa(db, current_user, code)

@router.post("/2fa/disable")
def disable_2fa(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Disables two-factor authentication."""
    return user_service.disable_2fa(db, current_user)
