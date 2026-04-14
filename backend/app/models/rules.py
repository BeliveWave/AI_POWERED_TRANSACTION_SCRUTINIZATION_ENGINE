from sqlalchemy import Column, Integer, String, DateTime
from datetime import datetime
from app.core.database import Base


class MerchantWhitelist(Base):
    """Trusted merchants that bypass AI fraud scoring and are auto-approved."""
    __tablename__ = "merchant_whitelist"

    id = Column(Integer, primary_key=True, index=True)
    merchant_name = Column(String, unique=True, index=True, nullable=False)
    added_at = Column(DateTime, default=datetime.now)


class CountryBlacklist(Base):
    """Countries from which transactions are automatically declined."""
    __tablename__ = "country_blacklist"

    id = Column(Integer, primary_key=True, index=True)
    country_code = Column(String(3), unique=True, index=True, nullable=False)  # ISO 3166-1 alpha-2/3
    country_name = Column(String, nullable=False)
    added_at = Column(DateTime, default=datetime.now)
