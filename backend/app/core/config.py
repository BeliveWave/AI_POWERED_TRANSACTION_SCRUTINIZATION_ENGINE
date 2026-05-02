import os
from typing import Optional
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "AI_POWERED_TRANSACTION_SCRUTINIZATION_ENGINE"
    DATABASE_URL: str
    SECRET_KEY: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    ALGORITHM: str = "HS256"
    
    # Email Settings
    SMTP_SERVER: Optional[str] = "smtp.gmail.com"
    SMTP_PORT: Optional[str] = "587"
    SMTP_USERNAME: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None

    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()
