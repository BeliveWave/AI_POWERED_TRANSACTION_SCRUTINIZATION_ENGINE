# Base.metadata.create_all(bind=engine)

# app = FastAPI(title=settings.PROJECT_NAME)

# # CORS
# origins = [
#     "http://localhost:3000",
#     "http://localhost:8000",
#     "http://localhost:5173",
#     "http://localhost:5174",
#     "http://127.0.0.1:5173",
#     "http://127.0.0.1:5174",
# ]

# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"],
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# # Include Routers
# app.include_router(auth.router)
# app.include_router(health.router)

# @app.on_event("startup")
# def startup_event():
#     try:
#         # Test connection
#         with engine.connect() as connection:
#             print("\n" + "="*50)
#             print("✅  DATABASE CONNECTED SUCCESSFULLY!")
#             print("="*50 + "\n")
#     except Exception as e:
#         print("\n" + "="*50)
#         print(f"❌  DATABASE CONNECTION FAILED: {e}")
#         print("="*50 + "\n")

# @app.get("/")
# def root():
#     return {"message": "Welcome to AI Powered Transaction Scrutinization Engine Backend"}

import joblib
import numpy as np
from datetime import datetime, timedelta, date
import random
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
from sqlalchemy.orm import Session
from sqlalchemy import func, or_, String, cast

# Import your existing modules
from app.core.config import settings
from app.routers import auth, health, admin
from app.core.database import engine, Base, get_db
from app.models.customer import Customer
from app.models.transaction import Transaction
from app.models.config import SystemConfig
from app.services.notification_service import notification_service

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title=settings.PROJECT_NAME)

# --- GLOBAL VARIABLES ---
ml_model = None

# --- PYDANTIC MODELS ---
class Metadata(BaseModel):
    customer_id: int
    merchant: str
    amount: float

class TransactionRequest(BaseModel):
    # The model expects a list of 30 numerical features (V1-V28, Time, Amount)
    features: List[float]
    metadata: Metadata

class TransactionResponse(BaseModel):
    fraud_score: float
    status: str
    decision_reason: str

# --- CORS ---
origins = [
    "http://localhost:3000",
    "http://localhost:8000",
    "http://localhost:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- INCLUDE ROUTERS ---
app.include_router(auth.router)
app.include_router(health.router)
app.include_router(admin.router)

# --- STARTUP EVENT (Database + AI Model Load) ---
@app.on_event("startup")
def startup_event():
    # 1. Connect to Database
    try:
        with engine.connect() as connection:
            print("\n" + "="*50)
            print("✅  DATABASE CONNECTED SUCCESSFULLY!")
    except Exception as e:
        print("\n" + "="*50)
        print(f"❌  DATABASE CONNECTION FAILED: {e}")
        print("="*50 + "\n")

    # 2. Load the AI Model (The "Brain")
    global ml_model
    try:
        # Ensure 'fraud_model.pkl' is in the same folder as main.py
        ml_model = joblib.load("fraud_model.pkl") 
        print("✅  AI FRAUD MODEL LOADED SUCCESSFULLY!")
        print("="*50 + "\n")
    except Exception as e:
        print("❌  FAILED TO LOAD AI MODEL. Check if 'fraud_model.pkl' exists.")
        print(f"Error: {e}")
        print("="*50 + "\n")

@app.get("/")
def root():
    return {"message": "Welcome to AI Powered Transaction Scrutinization Engine Backend"}

@app.post("/api/customers")
def create_customer(name: str, email: str, card_type: str = "Visa", card_last_four: str = "1234", db: Session = Depends(get_db)):
    new_customer = Customer(full_name=name, email=email, card_type=card_type, card_last_four=card_last_four)
    db.add(new_customer)
    db.commit()
    db.refresh(new_customer)
    return {"message": "Customer created", "id": new_customer.id}

@app.get("/api/customers")
def get_customers(search: str = None, risk_filter: str = None, db: Session = Depends(get_db)):
    # 1. Base Query
    query = db.query(Customer)
    
    # 2. Search Logic
    if search:
        query = query.filter(
            or_(
                Customer.full_name.ilike(f"%{search}%"),
                Customer.email.ilike(f"%{search}%")
            )
        )
    
    customers = query.all()
    
    results = []
    for cust in customers:
        # 3. Calculate Dynamic Stats
        # Count transactions
        txn_count = db.query(Transaction).filter(Transaction.customer_id == cust.id).count()
        
        # Last Activity
        last_txn = db.query(Transaction).filter(Transaction.customer_id == cust.id)\
                     .order_by(Transaction.timestamp.desc()).first()
        last_active = last_txn.timestamp if last_txn else None

        # Average Fraud Score
        avg_score = db.query(func.avg(Transaction.fraud_score))\
                      .filter(Transaction.customer_id == cust.id).scalar() or 0.0
        
        # 4. Filter Logic (Post-Calculation)
        # "High Risk" > 50%, "Safe" <= 10%
        if risk_filter == "high" and avg_score < 0.5:
            continue
        if risk_filter == "safe" and avg_score > 0.1:
            continue

        results.append({
            "id": cust.id,
            "full_name": cust.full_name,
            "email": cust.email,
            "card_type": cust.card_type,
            "card_last_four": cust.card_last_four,
            "risk_score": avg_score,
            "last_activity": last_active.isoformat() if last_active else "Never",
            "transaction_count": txn_count,
            "is_frozen": cust.is_frozen,
            "is_active": cust.is_active
        })
    
    return results

@app.post("/api/customers/{customer_id}/deactivate")
def deactivate_customer(customer_id: int, db: Session = Depends(get_db)):
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    # Deactivate (Soft Delete)
    customer.is_active = False
    db.commit()
    return {"message": "Customer deactivated", "is_active": False}

@app.post("/api/customers/{customer_id}/freeze")
def freeze_customer(customer_id: int, db: Session = Depends(get_db)):
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    # Toggle Freeze Status
    customer.is_frozen = not customer.is_frozen
    db.commit()
    return {"message": f"Customer {'frozen' if customer.is_frozen else 'unfrozen'}", "is_frozen": customer.is_frozen}

@app.get("/api/customers/ids")
def get_customer_ids(db: Session = Depends(get_db)):
    # Only fetch ACTIVE customers so the simulator doesn't use deactivated ones
    customers = db.query(Customer).filter(Customer.is_active == True).all()
    return [c.id for c in customers]

# --- NEW AI ENDPOINT ---
@app.post("/api/predict", response_model=TransactionResponse)
def predict_fraud(txn: TransactionRequest, db: Session = Depends(get_db)):
    """
    Receives transaction features, calculates fraud score, and returns decision.
    """
    if not ml_model:
        raise HTTPException(status_code=500, detail="Model not loaded")

    try:
        # --- FREEZE CHECK ---
        # Check if customer is frozen
        customer = db.query(Customer).filter(Customer.id == txn.metadata.customer_id).first()
        if customer and customer.is_frozen:
             # AUTO-DECLINE
             return {
                "fraud_score": 1.0,
                "status": "Decline",
                "decision_reason": "❌ Customer Card is FROZEN"
            }

        import time
        start_time = time.time()

        # 1. Convert list to numpy array (Required for XGBoost)
        # Reshape to (1, 30) because we are predicting 1 transaction
        features_array = np.array(txn.features).reshape(1, -1)
        
        # --- CURRENCY BRIDGE ---
        # Convert LKR Amount (at index 29) to USD for the AI Model
        # Assuming exchange rate 1 USD = 300 LKR
        features_array[0][29] = features_array[0][29] / 300.0

        # 2. Get Probability (0 to 1)
        # [0][1] gets the probability of class '1' (Fraud)
        probability = float(ml_model.predict_proba(features_array)[0][1])

        # 3. Apply Business Logic (Dynamic from SystemConfig)
        # Fetch thresholds (default to standard values if not set)
        decline_threshold = 0.70
        review_threshold = 0.50
        
        config_decline = db.query(SystemConfig).filter(SystemConfig.key == "fraud_threshold_decline").first()
        if config_decline:
             decline_threshold = float(config_decline.value)

        config_review = db.query(SystemConfig).filter(SystemConfig.key == "fraud_threshold_review").first()
        if config_review:
             review_threshold = float(config_review.value)

        if probability >= decline_threshold:
            status = "Decline"
            reason = "Critical Risk Score (Auto-Decline Threshold Met)"
        elif probability >= review_threshold:
            status = "Escalate"
            reason = "Medium Risk Score (Requires Manual Review)"
        else:
            status = "Approve"
            reason = "Low Risk Score"

        # 4. SAVE TO DATABASE (The "Bank" Part)
        # 4. SAVE TO DATABASE (The "Bank" Part)
        end_time = time.time()
        processing_time_ms = (end_time - start_time) * 1000
        
        new_txn = Transaction(
            customer_id=txn.metadata.customer_id,
            merchant=txn.metadata.merchant,
            amount=txn.metadata.amount,
            fraud_score=round(probability, 4),
            status=status,
            processing_time_ms=processing_time_ms
        )
        db.add(new_txn)
        db.commit()
        db.refresh(new_txn) # Get ID for notification
        
        # 5. TRIGGER NOTIFICATIONS (New)
        notification_service.check_and_notify(db, new_txn)

        return {
            "fraud_score": round(probability, 4),
            "status": status,
            "decision_reason": reason
        }

    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Prediction Error: {str(e)}")

@app.get("/api/transactions/recent")
def get_recent_transactions(limit: int = 10, db: Session = Depends(get_db)):
    # Join Transaction with Customer to get name and card details
    results = db.query(Transaction, Customer).join(Customer, Transaction.customer_id == Customer.id).order_by(Transaction.timestamp.desc()).limit(limit).all()
    
    # Format the response
    formatted_transactions = []
    for txn, cust in results:
        formatted_transactions.append({
            "id": txn.id,
            "customer_id": txn.customer_id,
            "merchant": txn.merchant,
            "amount": txn.amount,
            "timestamp": txn.timestamp,
            "fraud_score": txn.fraud_score,
            "status": txn.status,
            "customer_name": cust.full_name,
            "card_type": cust.card_type,
            "card_last_four": cust.card_last_four
        })
    return formatted_transactions

@app.get("/api/transactions")
def get_transactions(
    search: str = None, 
    min_amt: float = None,
    max_amt: float = None,
    decision: str = None, 
    date_filter: str = "all", # "today" or "all"
    db: Session = Depends(get_db)
):
    query = db.query(Transaction).outerjoin(Customer)

    # 1. Search Logic
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                cast(Transaction.id, String).ilike(search_term),
                Transaction.merchant.ilike(search_term),
                Customer.full_name.ilike(search_term)
            )
        )
    
    # 2. Date Filter Logic (Default view optimization)
    if date_filter == "today":
        today_start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        query = query.filter(Transaction.timestamp >= today_start)

    # 3. Filter Logic
    if min_amt is not None:
        query = query.filter(Transaction.amount >= min_amt)
    if max_amt is not None:
        query = query.filter(Transaction.amount <= max_amt)
    if decision and decision != "All":
        query = query.filter(Transaction.status == decision)
    
    # Order by timestamp desc
    results = query.order_by(Transaction.timestamp.desc()).all()

    # Format response
    formatted = []
    for txn in results:
        formatted.append({
            "id": txn.id,
            "customer_name": txn.customer.full_name if txn.customer else "Unknown",
            "card_last_four": txn.customer.card_last_four if txn.customer else "????",
            "card_type": txn.customer.card_type if txn.customer else "",
            "timestamp": txn.timestamp,
            "amount": txn.amount,
            "merchant": txn.merchant,
            "fraud_score": txn.fraud_score,
            "status": txn.status
        })
    return formatted

@app.post("/api/transactions/{id}/decide")
def decide_transaction(id: int, decision: str, db: Session = Depends(get_db)):
    # decision: "Approve" or "Decline"
    txn = db.query(Transaction).get(id)
    
    if txn:
        # Map "Decline" to specific status if needed, but usually just update status
        # If user says "Decline" -> "Decline" (Red)
        # If "Approve" -> "Approve" (Green)
        if decision == "Approve":
            txn.status = "Approve"
        elif decision == "Decline":
            txn.status = "Decline"
        # We could also use the raw string if flexible
        
        db.commit()
        return {"status": "success", "new_status": txn.status}
    raise HTTPException(status_code=404, detail="Transaction not found")

@app.get("/api/dashboard/stats")
def get_dashboard_stats(db: Session = Depends(get_db)):
    """Returns the 4 big numbers for 'Today'"""
    
    # 1. Define 'Today' (Start of the day)
    today_start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    
    # 2. Query Transactions from Today
    today_query = db.query(Transaction).filter(Transaction.timestamp >= today_start)
    
    # 3. Calculate Counts
    total_txns = today_query.count()
    fraud_count = today_query.filter(Transaction.status == "Decline").count() # Using "Decline" as "Fraud/Red" in our system
    review_count = today_query.filter(Transaction.status == "Escalate").count()
    
    # 4. Calculate Average Response Time 
    from sqlalchemy.sql import func
    avg_latency = db.query(func.avg(Transaction.processing_time_ms)).filter(Transaction.timestamp >= today_start).scalar()
    
    # Handle None if no transactions today
    avg_latency = int(avg_latency) if avg_latency is not None else 0
    
    return {
        "total_transactions": total_txns,
        "fraud_detected": fraud_count,
        "under_review": review_count,
        "avg_response_ms": avg_latency
    }

@app.get("/api/dashboard/risky-merchants")
def get_risky_merchants(db: Session = Depends(get_db)):
    """
    Returns top 5 merchants with the highest fraud rate.
    """
    from sqlalchemy import func, case
    
    # SQL Query Logic:
    # Group by Merchant, Count Total, Count Fraud (Decline)
    results = db.query(
        Transaction.merchant,
        func.count(Transaction.id).label("total_txns"),
        func.sum(case((Transaction.status == "Decline", 1), else_=0)).label("fraud_count")
    ).group_by(Transaction.merchant).all()

    # Process results in Python to calculate Percentage
    risky_list = []
    for merchant, total, fraud_count in results:
        if total < 3: continue # Skip merchants with very few transactions (noise)
        
        # Ensure fraud_count is not None
        fraud_c = fraud_count if fraud_count else 0
        fraud_percentage = (fraud_c / total) * 100
        
        if fraud_percentage > 0:
            risky_list.append({
                "name": merchant,
                "txns": total,
                "risk": round(fraud_percentage / 100, 2) # e.g., 0.92 for 92%
            })

    # Sort by Risk Score (Highest first) and take top 5
    risky_list.sort(key=lambda x: x["risk"], reverse=True)
    return risky_list[:5]

@app.get("/api/dashboard/trends")
def get_fraud_trends(db: Session = Depends(get_db)):
    """Returns data for the Last 7 Days Graph"""
    
    # 1. Calculate the last 7 days range
    end_date = date.today()
    start_date = end_date - timedelta(days=6)
    
    results = []
    
    # 2. Loop through each day (Mon, Tue, Wed...)
    current_date = start_date
    while current_date <= end_date:
        # Define the 24-hour window for this specific day
        day_start = datetime.combine(current_date, datetime.min.time())
        day_end = datetime.combine(current_date, datetime.max.time())
        
        # Get counts for this day
        daily_txns = db.query(Transaction).filter(
            Transaction.timestamp >= day_start,
            Transaction.timestamp <= day_end
        )
        
        fraud = daily_txns.filter(Transaction.status == "Decline").count()
        approved = daily_txns.filter(Transaction.status == "Approve").count()
        review = daily_txns.filter(Transaction.status == "Escalate").count()
        
        # Format day name (e.g., "Mon", "Tue")
        day_name = current_date.strftime("%a")
        
        results.append({
            "name": day_name,
            "fraud": fraud,
            "approved": approved,
            "review": review
        })
        
        current_date += timedelta(days=1)
        
    return results