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
    fraud_score = Column(Float)  # Hybrid score (weighted combination)
    status = Column(String) # Approve/Decline/Escalate
    processing_time_ms = Column(Float, nullable=True) # Time taken for fraud analysis
    
    # NEW: Track both model scores separately for explainability
    xgboost_score = Column(Float, nullable=True)      # Known fraud pattern probability
    autoencoder_score = Column(Float, nullable=True)  # Anomaly detection score
    reconstruction_error = Column(Float, nullable=True)  # Raw reconstruction error

    # Optional: Relationship to Customer if needed
    customer = relationship("Customer", back_populates="transactions")
