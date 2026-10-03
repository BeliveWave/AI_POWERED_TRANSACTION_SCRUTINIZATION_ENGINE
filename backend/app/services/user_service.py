import hashlib
import hmac
import logging
from datetime import datetime, timedelta, timezone
from typing import Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.repositories.user_repo import user_repo
from app.schemas.user import (
    UserCreate, UserUpdate, UserResetPassword,
    ChangePasswordRequest
)
from app.models.user import User
from app.utils.password import get_password_hash, verify_password
from app.utils.security_2fa import generate_totp_secret, get_totp_uri, verify_totp
from app.utils.email_utils import generate_otp, generate_reset_token, send_password_reset_email
from app.core.config import settings

logger = logging.getLogger(__name__)

def _is_expired(expires_at: Optional[datetime]) -> bool:
    """Robust timezone-safe expiration comparison."""
    if not expires_at:
        return True
    now = datetime.now(timezone.utc)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    return expires_at < now


def _verify_token_hash(stored_hash_record: Optional[str], candidate_token: str) -> bool:
    """
    Verifies candidate token against stored hash record.
    Supports composite 'token_hash:otp_hash', single hash, and legacy plain OTP.
    Uses constant-time comparison to prevent timing attacks.
    """
    if not stored_hash_record or not candidate_token:
        return False
        
    candidate_token = candidate_token.strip()
    candidate_hash = hashlib.sha256(candidate_token.encode('utf-8')).hexdigest()

    # Split stored hash composite (token_hash:otp_hash)
    parts = stored_hash_record.split(":")
    for stored in parts:
        if hmac.compare_digest(candidate_hash, stored):
            return True
        # Backwards-compatibility check for raw 6-digit legacy codes
        if hmac.compare_digest(candidate_token, stored):
            return True
            
    return False


class UserService:
    def register_new_user(self, db: Session, user_in: UserCreate):
        """Registers a new user after verifying unique email and username."""
        # Check if email exists (case-insensitive)
        if user_repo.get_user_by_email(db, email=user_in.email):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="An account with this email address already exists",
            )

        # Check if username exists (case-insensitive)
        if user_repo.get_user_by_username(db, username=user_in.username):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This username is already taken",
            )

        # Create user
        hashed_password = get_password_hash(user_in.password)
        db_user = User(
            email=user_in.email.strip().lower(),
            username=user_in.username.strip(),
            full_name=user_in.full_name.strip(),
            password_hash=hashed_password,
            is_active=True
        )
        return user_repo.create_user(db, db_user)

    def forgot_password(self, db: Session, email: str):
        """
        Initiates password reset workflow.
        Returns a generic response to prevent account enumeration.
        """
        generic_message = "If an account exists with this email address, password reset instructions have been sent."
        
        if not email:
            return {"message": generic_message}
            
        user = user_repo.get_user_by_email(db, email=email)
        if not user:
            # Prevent timing attack / user enumeration
            return {"message": generic_message}

        # Generate secure random token & 6-digit OTP
        raw_token = generate_reset_token(32)
        otp_code = generate_otp(6)

        # Hash both with SHA-256 for secure DB storage
        token_hash = hashlib.sha256(raw_token.encode('utf-8')).hexdigest()
        otp_hash = hashlib.sha256(otp_code.encode('utf-8')).hexdigest()

        # Store hashes and expiration in user record
        user.reset_otp = f"{token_hash}:{otp_hash}"
        user.reset_otp_expires_at = datetime.now(timezone.utc) + timedelta(minutes=15)
        db.commit()

        # Construct reset URL using configured FRONTEND_URL
        frontend_base = (settings.FRONTEND_URL or "http://localhost:5173").rstrip("/")
        reset_url = f"{frontend_base}/reset-password?token={raw_token}&email={user.email}"

        # Dispatch email
        send_password_reset_email(user.email, raw_token, otp_code, reset_url)

        return {"message": generic_message}

    def verify_reset_token(self, db: Session, email: str, token: str):
        """
        Validates a reset token or OTP code without consuming it.
        Used by the frontend to verify links upon page load.
        """
        user = user_repo.get_user_by_email(db, email=email)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired password reset link."
            )

        if not user.reset_otp or not user.reset_otp_expires_at:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or already used password reset link."
            )

        if _is_expired(user.reset_otp_expires_at):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password reset link has expired. Please request a new one."
            )

        if not _verify_token_hash(user.reset_otp, token):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired password reset token."
            )

        return {"valid": True, "email": user.email}

    def reset_password(self, db: Session, data: UserResetPassword):
        """
        Consumes the reset token and securely updates the user's password.
        The token is invalidated immediately upon successful reset.
        """
        if data.new_password != data.confirm_password:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Passwords do not match."
            )

        user = user_repo.get_user_by_email(db, email=data.email)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid request or expired token."
            )

        if not user.reset_otp or not user.reset_otp_expires_at:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or already used password reset token."
            )

        if _is_expired(user.reset_otp_expires_at):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password reset token has expired. Please request a new one."
            )

        token_to_verify = data.get_token_value()
        if not _verify_token_hash(user.reset_otp, token_to_verify):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid verification code or reset token."
            )

        # Update password & invalidate token (single-use enforcement)
        user.password_hash = get_password_hash(data.new_password)
        user.reset_otp = None
        user.reset_otp_expires_at = None
        db.commit()

        logger.info(f"Password successfully reset for user: {user.username}")
        return {"message": "Password has been successfully reset. Please sign in with your new password."}

    def change_password(self, db: Session, user: User, data: ChangePasswordRequest):
        """Allows authenticated users to change their password."""
        if not verify_password(data.current_password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Current password is incorrect."
            )

        if data.new_password != data.confirm_password:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="New passwords do not match."
            )

        user.password_hash = get_password_hash(data.new_password)
        db.commit()
        return {"message": "Password updated successfully."}

    def generate_2fa_secret(self, db: Session, user: User):
        """Generates a secret and returns the secret + provisioning URI"""
        if user.is_2fa_enabled:
            raise HTTPException(status_code=400, detail="2FA is already enabled")

        secret = generate_totp_secret()
        user.otp_secret = secret
        db.commit()
        db.refresh(user)

        uri = get_totp_uri(secret, user.username)
        return {"secret": secret, "uri": uri}

    def enable_2fa(self, db: Session, user: User, code: str):
        """Verifies the code and enables 2FA"""
        if not user.otp_secret:
            raise HTTPException(status_code=400, detail="No 2FA setup started")

        if not verify_totp(user.otp_secret, code):
            raise HTTPException(status_code=400, detail="Invalid 2FA verification code")

        user.is_2fa_enabled = True
        db.commit()
        return {"message": "Two-Factor Authentication enabled successfully"}

    def disable_2fa(self, db: Session, user: User):
        user.is_2fa_enabled = False
        user.otp_secret = None
        db.commit()
        return {"message": "Two-Factor Authentication disabled"}

    def update_profile(self, db: Session, user: User, data: UserUpdate):
        if data.full_name:
            user.full_name = data.full_name.strip()
        if data.phone_number:
            user.phone_number = data.phone_number.strip()
        if data.notification_preferences:
            user.notification_preferences = data.notification_preferences

        db.commit()
        db.refresh(user)
        return user


user_service = UserService()
