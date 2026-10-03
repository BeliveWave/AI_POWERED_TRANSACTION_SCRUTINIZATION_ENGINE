from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional
from datetime import datetime
import re

def validate_password_strength(v: str) -> str:
    """Enforces banking-grade password policy: >= 12 chars, upper, lower, digit, symbol."""
    if len(v) < 12:
        raise ValueError('Password must be at least 12 characters')
    if not re.search(r"[A-Z]", v):
        raise ValueError('Password must contain at least one uppercase letter')
    if not re.search(r"[a-z]", v):
        raise ValueError('Password must contain at least one lowercase letter')
    if not re.search(r"\d", v):
        raise ValueError('Password must contain at least one number')
    if not re.search(r"[!@#$%^&*(),.?\":{}|<>\-_=+\\\/\[\]]", v):
        raise ValueError('Password must contain at least one special character')
    return v


class UserBase(BaseModel):
    email: EmailStr
    username: str


class UserCreate(UserBase):
    full_name: str
    password: str

    @field_validator('password')
    @classmethod
    def validate_password(cls, v: str) -> str:
        return validate_password_strength(v)


class UserLogin(BaseModel):
    username_or_email: str
    password: str
    otp_code: Optional[str] = None  # For 2FA


class UserResponse(UserBase):
    id: str
    full_name: str
    is_active: bool
    is_2fa_enabled: bool
    created_at: datetime
    last_login: Optional[datetime] = None
    notification_preferences: Optional[str] = "{}"

    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    phone_number: Optional[str] = None
    notification_preferences: Optional[str] = None


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class VerifyResetTokenRequest(BaseModel):
    email: EmailStr
    token: str


class VerifyResetTokenResponse(BaseModel):
    valid: bool
    email: str


class UserResetPassword(BaseModel):
    email: EmailStr
    token: Optional[str] = None
    otp: Optional[str] = None  # Accepts either 'token' or 'otp'
    new_password: str
    confirm_password: str

    @field_validator('new_password')
    @classmethod
    def validate_new_password(cls, v: str) -> str:
        return validate_password_strength(v)

    def get_token_value(self) -> str:
        """Returns whichever token field was provided."""
        val = (self.token or self.otp or "").strip()
        if not val:
            raise ValueError("Reset token or verification code is required")
        return val


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str
    confirm_password: str

    @field_validator('new_password')
    @classmethod
    def validate_new_password(cls, v: str) -> str:
        return validate_password_strength(v)
