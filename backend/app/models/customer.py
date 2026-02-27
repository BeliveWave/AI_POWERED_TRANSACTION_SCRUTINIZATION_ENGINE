from sqlalchemy import Column, Integer, String, Float, Boolean
from sqlalchemy.orm import relationship
from app.core.database import Base

class Customer(Base):
    __tablename__ = "customers"
    
    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String)
    email = Column(String, unique=True, index=True)
    card_type = Column(String) # Visa, Mastercard
    card_last_four = Column(String) # 1234
    risk_score = Column(Float, default=0.0)
    is_frozen = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)

    transactions = relationship("Transaction", back_populates="customer")
