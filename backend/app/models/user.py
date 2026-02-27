import uuid
from sqlalchemy import Column, String, Boolean, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    full_name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    last_login = Column(DateTime(timezone=True), nullable=True)
    
    # New Security & Notification Fields
    otp_secret = Column(String, nullable=True)
    phone_number = Column(String, nullable=True)
    notification_preferences = Column(String, default="{}") # Storing as JSON string
    is_2fa_enabled = Column(Boolean, default=False)
    
    # Password Reset
    reset_otp = Column(String, nullable=True) # 6 digit code
    reset_otp_expires_at = Column(DateTime(timezone=True), nullable=True)
