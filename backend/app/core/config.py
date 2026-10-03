import os
from typing import Optional
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "AI_POWERED_TRANSACTION_SCRUTINIZATION_ENGINE"
    DATABASE_URL: str
    SECRET_KEY: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    ALGORITHM: str = "HS256"
    
    # Infrastructure
    REDIS_URL: str = "redis://localhost:6379/0"
    KAFKA_BROKER_URL: str = "localhost:9092"
    
    # Graph DB (Neo4j)
    NEO4J_URI: str = "bolt://localhost:7687"
    NEO4J_USER: str = "neo4j"
    NEO4J_PASSWORD: str = "password"
    
    # Frontend & CORS
    FRONTEND_URL: str = "http://localhost:5173"
    CORS_ORIGINS: str = "*"

    # Email Settings
    SMTP_SERVER: Optional[str] = "smtp.gmail.com"
    SMTP_PORT: Optional[str] = "587"
    SMTP_USERNAME: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    SMTP_FROM_EMAIL: Optional[str] = "security@sentinel.bank"
    SMTP_FROM_NAME: Optional[str] = "Sentinel Security"

    class Config:
        env_file = (
            os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), ".env"),
            ".env"
        )
        extra = "allow"

settings = Settings()
