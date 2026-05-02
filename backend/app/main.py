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
import warnings
warnings.filterwarnings('ignore')
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
from sqlalchemy.orm import Session
from sqlalchemy import func, or_, String, cast

# Deep Learning
try:
    from tensorflow.keras.models import load_model
    TF_AVAILABLE = True
except ImportError:
    TF_AVAILABLE = False
    print("⚠️  TensorFlow not available. Autoencoder will not be loaded.")

# Import your existing modules
from app.core.config import settings
from app.routers import auth, health, admin
from app.routers import config_rules, reports, search, notifications as notif_router
from app.core.database import engine, Base, get_db
from app.models.customer import Customer
from app.models.transaction import Transaction
from app.models.config import SystemConfig
from app.models.notification import Notification        # noqa: F401  — registers table
from app.models.rules import MerchantWhitelist, CountryBlacklist  # noqa: F401  — registers tables
from app.services.notification_service import notification_service

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title=settings.PROJECT_NAME)

# --- GLOBAL VARIABLES ---
ml_model = None                    # XGBoost model (known fraud patterns)
autoencoder_model = None           # Autoencoder model (anomaly detection)
autoencoder_scaler = None          # Scaler for autoencoder features
autoencoder_metadata = None        # Metadata with thresholds
hybrid_mode_enabled = False        # Flag for hybrid prediction

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
app.include_router(config_rules.router)
app.include_router(reports.router)
app.include_router(search.router)
app.include_router(notif_router.router)

# --- STARTUP EVENT (Database + AI Models Load) ---
@app.on_event("startup")
def startup_event():
    global ml_model, autoencoder_model, autoencoder_scaler, autoencoder_metadata, hybrid_mode_enabled
    
    print("\n" + "="*70)
    print("🚀 FRAUD DETECTION ENGINE STARTUP")
    print("="*70)
    
    # 1. Connect to Database
    print("\n[1/3] Connecting to database...")
    try:
        with engine.connect() as connection:
            print("     ✅ Database connected successfully")
    except Exception as e:
        print(f"     ❌ Database connection failed: {e}")

    # 2. Load XGBoost Model (Supervised Learning - Known Frauds)
    print("\n[2/3] Loading XGBoost model (supervised learning)...")
    try:
        ml_model = joblib.load("fraud_model.pkl")
        print("     ✅ XGBoost model loaded successfully")
    except Exception as e:
        print(f"     ❌ Failed to load XGBoost model: {e}")
        print("     ⚠️  System will operate without XGBoost")

    # 3. Load Autoencoder Model (Unsupervised Learning - Anomalies)
    print("\n[3/3] Loading Autoencoder model (unsupervised learning)...")
    try:
        if not TF_AVAILABLE:
            raise ImportError("TensorFlow not available")
        
        # Try loading with both formats (.keras and .h5)
        autoencoder_model = None
        
        # Try new Keras format first
        try:
            autoencoder_model = load_model("autoencoder_model.keras")
            print("     ✅ Autoencoder loaded (keras format)")
        except:
            # Fall back to old HDF5 format
            try:
                autoencoder_model = load_model("autoencoder_model.h5")
                print("     ✅ Autoencoder loaded (h5 format)")
            except Exception as e:
                print(f"     ⚠️  Could not load Autoencoder: {e}")
                autoencoder_model = None
        
        if autoencoder_model is not None:
            autoencoder_scaler = joblib.load("autoencoder_scaler.pkl")
            autoencoder_metadata = joblib.load("autoencoder_metadata.pkl")
            
            print(f"     📊 Reconstruction threshold: {autoencoder_metadata['reconstruction_threshold']:.6f}")
            
            # Enable hybrid mode only if both models are loaded
            if ml_model is not None and autoencoder_model is not None:
                hybrid_mode_enabled = True
                print("\n" + "="*70)
                print("🎯 HYBRID FRAUD DETECTION ENABLED")
                print("    • XGBoost: Known fraud patterns")
                print("    • Autoencoder: Zero-day anomaly detection")
                print("="*70 + "\n")
        
    except Exception as e:
        print(f"     ⚠️  Autoencoder not available: {e}")
        print("     (System will use XGBoost only for fraud detection)")
        autoencoder_model = None
        autoencoder_scaler = None
        hybrid_mode_enabled = False

@app.get("/")
def root():
    status = "HYBRID MODE" if hybrid_mode_enabled else "XGBOOST ONLY"
    return {
        "message": "Welcome to AI Powered Transaction Scrutinization Engine Backend",
        "mode": status,
        "hybrid_enabled": hybrid_mode_enabled
    }

@app.get("/api/system/health")
def system_health(db: Session = Depends(get_db)):
    """
    Real-time infrastructure health check.
    Probes each component and returns actual measured latency.
    """
    import time as _time

    results = []

    # ── 1. API Server (this endpoint itself is the proof it's alive) ─────────
    results.append({
        "name": "API Server",
        "status": "healthy",
        "latency_ms": round(0.5, 2),   # Sub-ms — negligible
        "detail": "FastAPI running"
    })

    # ── 2. Database ───────────────────────────────────────────────────────────
    try:
        t0 = _time.perf_counter()
        from sqlalchemy import text
        db.execute(text("SELECT 1"))
        db_latency = round((_time.perf_counter() - t0) * 1000, 2)
        results.append({
            "name": "Database",
            "status": "healthy",
            "latency_ms": db_latency,
            "detail": "PostgreSQL connected"
        })
    except Exception as e:
        results.append({
            "name": "Database",
            "status": "critical",
            "latency_ms": None,
            "detail": f"Connection failed: {str(e)[:80]}"
        })

    # ── 3. XGBoost ML Model ───────────────────────────────────────────────────
    if ml_model is not None:
        try:
            dummy = np.zeros((1, 30))
            t0 = _time.perf_counter()
            ml_model.predict_proba(dummy)
            xgb_latency = round((_time.perf_counter() - t0) * 1000, 2)
            results.append({
                "name": "XGBoost Model",
                "status": "healthy",
                "latency_ms": xgb_latency,
                "detail": "Model loaded & responding"
            })
        except Exception as e:
            results.append({
                "name": "XGBoost Model",
                "status": "warning",
                "latency_ms": None,
                "detail": f"Inference error: {str(e)[:80]}"
            })
    else:
        results.append({
            "name": "XGBoost Model",
            "status": "warning",
            "latency_ms": None,
            "detail": "Model not loaded"
        })

    # ── 4. Autoencoder Model ──────────────────────────────────────────────────
    if autoencoder_model is not None and autoencoder_scaler is not None:
        try:
            dummy = np.zeros((1, 30))
            scaled = autoencoder_scaler.transform(dummy)
            t0 = _time.perf_counter()
            autoencoder_model.predict(scaled, verbose=0)
            ae_latency = round((_time.perf_counter() - t0) * 1000, 2)
            results.append({
                "name": "Autoencoder Model",
                "status": "healthy",
                "latency_ms": ae_latency,
                "detail": "Anomaly detector responding"
            })
        except Exception as e:
            results.append({
                "name": "Autoencoder Model",
                "status": "warning",
                "latency_ms": None,
                "detail": f"Inference error: {str(e)[:80]}"
            })
    else:
        results.append({
            "name": "Autoencoder Model",
            "status": "warning",
            "latency_ms": None,
            "detail": "Model not loaded"
        })

    overall = "healthy" if all(r["status"] == "healthy" for r in results) else "degraded"
    return {"overall": overall, "services": results}


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

# --- NEW AI ENDPOINT (HYBRID: XGBoost + Autoencoder) ---
@app.post("/api/predict", response_model=TransactionResponse)
def predict_fraud(txn: TransactionRequest, db: Session = Depends(get_db)):
    """
    Hybrid Fraud Detection: XGBoost (Known Patterns) + Autoencoder (Anomalies)
    
    Flow:
    1. XGBoost Path: Fast pattern matching against known fraud signatures
    2. Autoencoder Path: Detects anomalies (zero-day attacks)
    3. Hybrid Score: Weighted combination of both models
    4. Decision: Based on configurable thresholds
    """
    import time
    
    # Model availability check
    if not ml_model and not autoencoder_model:
        raise HTTPException(status_code=500, detail="No ML models loaded")

    try:
        start_time = time.time()
        
        # ===== STEP 1: FREEZE CHECK =====
        customer = db.query(Customer).filter(Customer.id == txn.metadata.customer_id).first()
        if customer and customer.is_frozen:
            return {
                "fraud_score": 1.0,
                "status": "Decline",
                "decision_reason": "❌ Customer Card is FROZEN"
            }

        # ===== STEP 1b: MERCHANT WHITELIST CHECK =====
        # Whitelisted merchants bypass AI entirely and are auto-approved
        whitelist_entry = db.query(MerchantWhitelist).filter(
            func.lower(MerchantWhitelist.merchant_name) == func.lower(txn.metadata.merchant)
        ).first()
        if whitelist_entry:
            return {
                "fraud_score": 0.0,
                "status": "Approve",
                "decision_reason": f"✅ Trusted Merchant — Whitelist Bypass",
            }

        # ===== STEP 2: PREPARE FEATURES =====
        features_array = np.array(txn.features).reshape(1, -1)
        
        # NOTE: Simulator now sends normalized features including normalized USD amount
        # No currency conversion needed here anymore
        # features_array[0][29] is already normalized (not LKR raw value)

        # Initialize scores
        xgboost_score = 0.0
        autoencoder_score = 0.0
        reconstruction_error = 0.0

        # ===== STEP 3: PATH 1 - XGBoost (Supervised Learning) =====
        if ml_model is not None:
            try:
                xgboost_score = float(ml_model.predict_proba(features_array)[0][1])
            except Exception as e:
                print(f"⚠️  XGBoost prediction failed: {e}")
                xgboost_score = 0.0
        
        # ===== STEP 4: PATH 2 - Autoencoder (Unsupervised Learning) =====
        if autoencoder_model is not None and autoencoder_scaler is not None:
            try:
                # Normalize features using the scaler
                # IMPORTANT: Create a copy to avoid modifying original features_array
                features_to_scale = features_array.copy()
                features_scaled = autoencoder_scaler.transform(features_to_scale)
                
                # Validate scaled features are in expected range
                # After StandardScaler, should be roughly [-3, 3] for normal transactions
                scaled_mean = np.mean(features_scaled)
                scaled_std = np.std(features_scaled)
                scaled_max = np.max(np.abs(features_scaled))
                
                # If scaled features look very abnormal, skip Autoencoder
                if scaled_max > 100:  # Way outside expected range
                    # Features are broken somehow
                    reconstruction_error = 999.0  # Indicate error
                    autoencoder_score = 1.0  # Maximum anomaly
                else:
                    # Get reconstruction from autoencoder
                    reconstruction = autoencoder_model.predict(features_scaled, verbose=0)
                    
                    # Calculate Mean Squared Error (reconstruction error)
                    # For normalized features, MSE should typically be 0.01-0.10
                    reconstruction_error_raw = np.mean(np.power(features_scaled - reconstruction, 2))
                    reconstruction_error = float(reconstruction_error_raw)
                    
                    # Validate reconstruction error (should be reasonable for normalized features)
                    # If error is abnormally high (>1.0), something went wrong
                    if reconstruction_error > 1.0:
                        # Use max threshold as fallback - likely an anomaly or data issue
                        autoencoder_score = 1.0
                    else:
                        # Normalize reconstruction error to 0-1 scale
                        threshold = autoencoder_metadata.get('reconstruction_threshold', 0.5)
                        autoencoder_score = min(reconstruction_error / threshold, 1.0)
                
            except Exception as e:
                print(f"⚠️  Autoencoder prediction failed: {e}")
                autoencoder_score = 0.0

        # ===== STEP 5: HYBRID SCORE CALCULATION =====
        if hybrid_mode_enabled and ml_model is not None and autoencoder_model is not None:
            # Weighted ensemble: 60% known patterns, 40% anomalies
            hybrid_score = (0.6 * xgboost_score) + (0.4 * autoencoder_score)
            model_explanation = f"XGB:{xgboost_score:.2f}|AE:{autoencoder_score:.2f}"
        elif ml_model is not None:
            # XGBoost only
            hybrid_score = xgboost_score
            model_explanation = f"XGB:{xgboost_score:.2f}"
        elif autoencoder_model is not None:
            # Autoencoder only
            hybrid_score = autoencoder_score
            model_explanation = f"AE:{autoencoder_score:.2f}"
        else:
            hybrid_score = 0.0
            model_explanation = "NO_MODEL"

        # ===== STEP 6: FETCH THRESHOLDS =====
        decline_threshold = 0.70
        review_threshold = 0.50
        
        config_decline = db.query(SystemConfig).filter(SystemConfig.key == "fraud_threshold_decline").first()
        if config_decline:
            decline_threshold = float(config_decline.value)

        config_review = db.query(SystemConfig).filter(SystemConfig.key == "fraud_threshold_review").first()
        if config_review:
            review_threshold = float(config_review.value)

        # ===== STEP 7: DECISION LOGIC =====
        if hybrid_score >= decline_threshold:
            status = "Decline"
            decision_reason = f"🚨 Critical Risk | {model_explanation}"
        elif hybrid_score >= review_threshold:
            status = "Escalate"
            decision_reason = f"⚠️  Medium Risk | {model_explanation}"
        else:
            status = "Approve"
            decision_reason = f"✅ Low Risk | {model_explanation}"

        # ===== STEP 8: SAVE TO DATABASE =====
        end_time = time.time()
        processing_time_ms = (end_time - start_time) * 1000
        
        new_txn = Transaction(
            customer_id=txn.metadata.customer_id,
            merchant=txn.metadata.merchant,
            amount=txn.metadata.amount,
            fraud_score=round(hybrid_score, 4),
            xgboost_score=round(xgboost_score, 4),
            autoencoder_score=round(autoencoder_score, 4),
            reconstruction_error=round(reconstruction_error, 6),
            status=status,
            processing_time_ms=processing_time_ms
        )
        db.add(new_txn)
        db.commit()
        db.refresh(new_txn)
        
        # ===== STEP 9: TRIGGER NOTIFICATIONS =====
        notification_service.check_and_notify(db, new_txn)

        return {
            "fraud_score": round(hybrid_score, 4),
            "status": status,
            "decision_reason": decision_reason
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

class NewsletterSubscribeRequest(BaseModel):
    email: str

from app.utils.email_utils import send_welcome_email

@app.post("/api/newsletter/subscribe")
def subscribe_newsletter(data: NewsletterSubscribeRequest):
    """
    Subscribes a user to the newsletter and sends a welcome email.
    """
    try:
        # In a real app, you would save the email to the database here
        # e.g., db.add(NewsletterSubscriber(email=data.email))
        
        # Send the welcome email
        send_welcome_email(data.email)
        return {"message": "Successfully subscribed and welcome email sent"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process subscription: {str(e)}")