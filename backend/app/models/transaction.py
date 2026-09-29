from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base

class Transaction(Base):
    __tablename__ = "transactions"
    
    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"))
    
    # ISO 8583 Related Fields
    merchant = Column(String) # Name of merchant
    merchant_id = Column(String, nullable=True) # DE42
    merchant_category_code = Column(String, nullable=True) # DE18
    merchant_country_code = Column(String, nullable=True) # DE43 sub-field — NOTE: DE42 is Merchant ID (see merchant_id above)
    
    amount = Column(Float) # DE4
    billing_amount = Column(Float, nullable=True) # DE6
    currency = Column(String, default="USD") # DE49
    
    transaction_type = Column(String, nullable=True) # DE3 (Processing Code) — NOTE: DE49 is Currency (see line above)
    pos_entry_mode = Column(String, nullable=True) # DE22
    terminal_id = Column(String, nullable=True) # DE41
    
    moto_eci_indicator = Column(String, nullable=True) # MOTO/ECI
    three_d_secure = Column(String, nullable=True) # 3-D Secure Indicator
    
    timestamp = Column(DateTime, default=datetime.now)
    fraud_score = Column(Float)  # Hybrid score (weighted combination)
    status = Column(String) # Approve/Decline/Escalate
    processing_time_ms = Column(Float, nullable=True) # Time taken for fraud analysis
    
    # NEW: Track both model scores separately for explainability
    xgboost_score = Column(Float, nullable=True)      # Known fraud pattern probability
    autoencoder_score = Column(Float, nullable=True)  # Anomaly detection score
    reconstruction_error = Column(Float, nullable=True)  # Raw reconstruction error
    shap_explanation = Column(String, nullable=True) # JSON string of top feature contributors
    shadow_score = Column(Float, nullable=True)      # Score from the shadow model (testing phase)

    # NEW: Graph-Based Fraud Detection Phase 5
    ip_address = Column(String, nullable=True)
    device_fingerprint = Column(String, nullable=True)
    shipping_address = Column(String, nullable=True)
    gnn_score = Column(Float, nullable=True)      # Graph Neural Network score

    # Optional: Relationship to Customer if needed
    customer = relationship("Customer", back_populates="transactions")
