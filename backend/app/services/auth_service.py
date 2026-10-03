from datetime import datetime, timezone
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.repositories.user_repo import user_repo
from app.utils.password import verify_password
from app.utils.tokens import create_access_token
from app.schemas.user import UserLogin

class AuthService:
    def authenticate_user(self, db: Session, login_data: UserLogin):
        identifier = login_data.username_or_email.strip()
        
        # Look up by email or username
        if "@" in identifier:
            user = user_repo.get_user_by_email(db, email=identifier)
        else:
            user = user_repo.get_user_by_username(db, username=identifier)

        invalid_auth_exception = HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

        if not user:
            raise invalid_auth_exception

        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User account is deactivated. Please contact an administrator.",
            )

        if not verify_password(login_data.password, user.password_hash):
            raise invalid_auth_exception

        # 2FA Enforcement
        if user.is_2fa_enabled:
            from app.utils.security_2fa import verify_totp

            if not login_data.otp_code:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="2FA Required",
                )

            if not verify_totp(user.otp_secret, login_data.otp_code.strip()):
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid two-factor authentication code",
                )

        # Update last login timestamp
        user.last_login = datetime.now(timezone.utc)
        db.commit()

        access_token = create_access_token(data={"sub": user.username})
        return {"access_token": access_token, "token_type": "bearer"}


auth_service = AuthService()
