from sqlalchemy.orm import Session
from fastapi import HTTPException, status
import json
from app.repositories.user_repo import user_repo
from app.schemas.user import UserCreate, UserUpdate
from app.models.user import User
from app.utils.password import get_password_hash
from app.utils.security_2fa import generate_totp_secret, get_totp_uri, verify_totp

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

    def generate_2fa_secret(self, db: Session, user: User):
        """Generates a secret and returns the secret + provisioning URI"""
        if user.is_2fa_enabled:
             raise HTTPException(status_code=400, detail="2FA is already enabled")
             
        secret = generate_totp_secret()
        # Save secret temporarily or permanently? 
        # Usually checking against a temp secret is safer, but for simplicity we save it
        # The user must CONFIRM it to enable 'is_2fa_enabled'
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
             raise HTTPException(status_code=400, detail="Invalid Code")
             
        user.is_2fa_enabled = True
        db.commit()
        return {"message": "2FA Enabled Successfully"}

    def disable_2fa(self, db: Session, user: User):
        user.is_2fa_enabled = False
        user.otp_secret = None
        db.commit()
        return {"message": "2FA Disabled"}
        
    def update_profile(self, db: Session, user: User, data: UserUpdate):
        if data.full_name:
            user.full_name = data.full_name
        if data.phone_number:
            user.phone_number = data.phone_number
        if data.notification_preferences:
            # Validate JSON if needed
            user.notification_preferences = data.notification_preferences
            
        db.commit()
        db.refresh(user)
        db.commit()
        db.refresh(user)
        return user

    def forgot_password(self, db: Session, email: str):
        user = user_repo.get_user_by_email(db, email=email)
        if not user:
            # Security: Don't reveal if user exists. 
            # In dev/mock, we might want to know, but standard practice is "If email exists..."
            return {"message": "If the email exists, a reset code has been sent."}
            
        from app.utils.email_utils import generate_otp, send_reset_otp
        from datetime import datetime, timedelta, timezone
        
        otp = generate_otp()
        user.reset_otp = otp
        user.reset_otp_expires_at = datetime.now(timezone.utc) + timedelta(minutes=15)
        db.commit()
        
        send_reset_otp(email, otp)
        return {"message": "If the email exists, a reset code has been sent."}

    def reset_password(self, db: Session, data): # data: UserResetPassword
        user = user_repo.get_user_by_email(db, email=data.email)
        if not user:
             raise HTTPException(status_code=400, detail="Invalid Request")
             
        from datetime import datetime, timezone
        
        if not user.reset_otp or user.reset_otp != data.otp:
             raise HTTPException(status_code=400, detail="Invalid OTP")
             
        # Ensure UTC comparison
        if user.reset_otp_expires_at < datetime.now(timezone.utc):
             raise HTTPException(status_code=400, detail="OTP Expired")
        
        # Update Password
        user.password_hash = get_password_hash(data.new_password)
        # Clear OTP
        user.reset_otp = None
        user.reset_otp_expires_at = None
        db.commit()
        
        return {"message": "Password reset successfully"}

user_service = UserService()
