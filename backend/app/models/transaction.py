from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base

class Transaction(Base):
    __tablename__ = "transactions"
    
    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"))
    merchant = Column(String)
    amount = Column(Float)
    timestamp = Column(DateTime, default=datetime.now)
    fraud_score = Column(Float)
    status = Column(String) # Approve/Decline/Escalate
    processing_time_ms = Column(Float, nullable=True) # Time taken for fraud analysis

    # Optional: Relationship to Customer if needed
    customer = relationship("Customer", back_populates="transactions")
