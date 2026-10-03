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

import os
import joblib
import numpy as np
from datetime import datetime, timedelta, date
import random
import warnings
warnings.filterwarnings('ignore')
from fastapi import FastAPI, HTTPException, Depends, BackgroundTasks, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
from sqlalchemy.orm import Session
from sqlalchemy import func, or_, String, cast
import json
import uuid
# Kafka (optional — only needed for async pipeline; sync /api/score endpoint does not use it)
try:
    from kafka import KafkaProducer
    KAFKA_AVAILABLE = True
except ImportError:
    KafkaProducer = None
    KAFKA_AVAILABLE = False
    print("ℹ️  kafka-python not installed. Async /api/predict endpoint disabled. Use /api/score instead.")

# Deep Learning
try:
    from tensorflow.keras.models import load_model
    TF_AVAILABLE = True
except ImportError:
    TF_AVAILABLE = False
    print("⚠️  TensorFlow not available. Autoencoder will not be loaded.")

# Numpy autoencoder (no TF dependency for cloud deployment)
from app.services.autoencoder_numpy import load_numpy_autoencoder as _load_numpy_ae
numpy_autoencoder = None
numpy_ae_scaler = None
numpy_ae_metadata = None

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
feature_encoders = None            # Feature encoders for categorical data
hybrid_mode_enabled = False        # Flag for hybrid prediction
kafka_producer = None              # Kafka Producer instance

# --- PYDANTIC MODELS ---
class Metadata(BaseModel):
    customer_id: int
    merchant: str
    merchant_category_code: str = "0000"
    merchant_country_code: str = "US"
    amount: float
    currency: str = "USD"
    transaction_type: str = "PURCHASE"
    pos_entry_mode: str = "05"
    terminal_id: str = "000000"
    moto_eci_indicator: str = "00"
    three_d_secure: str = "N"
    
    # Graph-Based Fraud Fields
    ip_address: str = None
    device_fingerprint: str = None
    shipping_address: str = None

class TransactionRequest(BaseModel):
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
    "https://sentinalengine.vercel.app",
    "https://sentinel-one-blond.vercel.app",
]

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https?://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- INCLUDE ROUTERS ---
app.include_router(auth.router)
app.include_router(auth.router, prefix="/api")
app.include_router(health.router)
app.include_router(admin.router)
app.include_router(config_rules.router)
app.include_router(reports.router)
app.include_router(search.router)
app.include_router(notif_router.router)

# --- STARTUP EVENT (Database + AI Models Load) ---
@app.on_event("startup")
def startup_event():
    global ml_model, autoencoder_model, autoencoder_scaler, autoencoder_metadata, feature_encoders, hybrid_mode_enabled
    global numpy_autoencoder, numpy_ae_scaler, numpy_ae_metadata
    
    print("\n" + "="*70)
    print(" FRAUD DETECTION ENGINE STARTUP")
    print("="*70)
    
    # 1. Connect to Database
    print("\n[1/3] Connecting to database...")
    try:
        with engine.connect() as connection:
            print("     Database connected successfully")
    except Exception as e:
        print(f"     Database connection failed: {e}")


    # 1.5 Connect to Kafka (optional — only needed for async /api/predict pipeline)
    print("\n[1.5/3] Connecting to Kafka Producer...")
    global kafka_producer
    if not KAFKA_AVAILABLE:
        print("     Kafka skipped (kafka-python not installed). Use /api/score for sync scoring.")
    elif settings.KAFKA_BROKER_URL in ("disabled", "", None):
        print("     Kafka skipped (KAFKA_BROKER_URL=disabled). Use /api/score for sync scoring.")
    else:
        try:
            kafka_producer = KafkaProducer(
                bootstrap_servers=settings.KAFKA_BROKER_URL,
                value_serializer=lambda v: json.dumps(v).encode('utf-8')
            )
            print("     Kafka Producer connected successfully")
        except Exception as e:
            print(f"     Kafka connection failed (non-fatal): {e}")
            print("     Use /api/score for synchronous scoring instead.")


    # 2. Load XGBoost Model (Supervised Learning - Known Frauds)
    print("\n[2/3] Loading XGBoost model (supervised learning) and encoders...")
    def _resolve_model_path(fname):
        for cand in [
            fname,
            os.path.join(os.path.dirname(os.path.abspath(__file__)), fname),
            os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), fname),
            os.path.join(os.getcwd(), fname),
            os.path.join(os.getcwd(), "backend", fname),
            os.path.join(os.getcwd(), "backend", "app", fname),
        ]:
            if os.path.exists(cand):
                return cand
        return fname

    try:
        xgb_path = _resolve_model_path("fraud_model.pkl")
        enc_path = _resolve_model_path("feature_encoders.pkl")
        ml_model = joblib.load(xgb_path)
        feature_encoders = joblib.load(enc_path)
        print(f"     XGBoost model and encoders loaded successfully from {xgb_path}")
    except Exception as e:
        print(f"     Failed to load XGBoost model: {e}")
        print("     System will operate without XGBoost")

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
            print("     Autoencoder loaded (keras format)")
        except:
            # Fall back to old HDF5 format
            try:
                autoencoder_model = load_model("autoencoder_model.h5")
                print("     Autoencoder loaded (h5 format)")
            except Exception as e:
                print(f"     Could not load Autoencoder: {e}")
                autoencoder_model = None
        
        if autoencoder_model is not None:
            autoencoder_scaler = joblib.load("autoencoder_scaler.pkl")
            autoencoder_metadata = joblib.load("autoencoder_metadata.pkl")
            
            print(f"     📊 Reconstruction threshold: {autoencoder_metadata['reconstruction_threshold']:.6f}")
            
            # Enable hybrid mode only if both models are loaded
            if ml_model is not None and autoencoder_model is not None:
                hybrid_mode_enabled = True
                print("\n" + "="*70)
                print(" HYBRID FRAUD DETECTION ENABLED")
                print("    • XGBoost: Known fraud patterns")
                print("    • Autoencoder: Zero-day anomaly detection")
                print("="*70 + "\n")
        
    except Exception as e:
        print(f"     Autoencoder not available: {e}")
        print("     (System will use XGBoost only for fraud detection)")
        autoencoder_model = None
        autoencoder_scaler = None
        hybrid_mode_enabled = False

    # Load numpy autoencoder (TF-free, cloud-compatible)
    # Weights live in backend/ (parent of the app/ package directory)
    print("\n[4/3] Loading NumPy autoencoder (cloud-compatible)...")
    try:
        _backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        numpy_autoencoder, numpy_ae_scaler, numpy_ae_metadata = _load_numpy_ae(_backend_dir)
        if numpy_autoencoder:
            print(f"     NumPy autoencoder loaded successfully (backend dir: {_backend_dir})")
        else:
            print("     NumPy autoencoder not available (weights not extracted yet)")
    except Exception as e:
        print(f"     NumPy autoencoder load failed: {e}")


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
            n_feat = getattr(ml_model, "n_features_in_", 9)
            dummy = np.zeros((1, n_feat))
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
    ae_tested = False
    if numpy_autoencoder is not None and numpy_ae_scaler is not None:
        try:
            n_feat = getattr(numpy_ae_scaler, "n_features_in_", 9)
            dummy = np.zeros((1, n_feat))
            t0 = _time.perf_counter()
            scaled = numpy_ae_scaler.transform(dummy)
            numpy_autoencoder.reconstruction_error(scaled)
            ae_latency = round((_time.perf_counter() - t0) * 1000, 2)
            results.append({
                "name": "Autoencoder Model",
                "status": "healthy",
                "latency_ms": ae_latency,
                "detail": "NumPy Anomaly Detector active"
            })
            ae_tested = True
        except Exception as e:
            pass

    if not ae_tested and autoencoder_model is not None and autoencoder_scaler is not None:
        try:
            n_feat = getattr(autoencoder_scaler, "n_features_in_", 9)
            dummy = np.zeros((1, n_feat))
            t0 = _time.perf_counter()
            scaled = autoencoder_scaler.transform(dummy)
            autoencoder_model.predict(scaled, verbose=0)
            ae_latency = round((_time.perf_counter() - t0) * 1000, 2)
            results.append({
                "name": "Autoencoder Model",
                "status": "healthy",
                "latency_ms": ae_latency,
                "detail": "Keras Anomaly Detector active"
            })
            ae_tested = True
        except Exception as e:
            results.append({
                "name": "Autoencoder Model",
                "status": "warning",
                "latency_ms": None,
                "detail": f"Inference error: {str(e)[:80]}"
            })
            ae_tested = True

    if not ae_tested:
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

# --- NEW ASYNC AI ENDPOINT (Producer) ---
@app.post("/api/predict", status_code=status.HTTP_202_ACCEPTED)
def predict_fraud(txn: TransactionRequest, db: Session = Depends(get_db)):
    """
    Asynchronous Fraud Ingestion Endpoint.
    Pushes transaction to Kafka for background processing by consumer workers.
    """
    import time
    from app.core.cache import check_and_update_velocity, update_geolocation, check_if_foreign
    
    if not kafka_producer:
        # Graceful fallback to real-time synchronous scoring when Kafka is not active
        return score_transaction_sync(txn, BackgroundTasks(), db)

    try:
        start_time = time.time()
        customer_id = txn.metadata.customer_id
        
        # Fast DB/Cache checks
        customer = db.query(Customer).filter(Customer.id == customer_id).first()
        is_frozen = customer.is_frozen if customer else False
        
        # Fast Redis Caching Layer for Velocity and Geolocation
        velocity_1h = check_and_update_velocity(customer_id)
        is_foreign = check_if_foreign(customer_id, txn.metadata.merchant_country_code)
        update_geolocation(customer_id, txn.metadata.merchant_country_code)
        
        # Construct message
        transaction_id = str(uuid.uuid4())
        message = {
            "transaction_id": transaction_id,
            "metadata": txn.metadata.dict(),
            "features": {
                "velocity_1h": velocity_1h,
                "is_foreign": is_foreign,
                "is_frozen": is_frozen
            },
            "ingestion_time": start_time
        }
        
        # Push to Kafka (Fire & Forget)
        kafka_producer.send("transactions_inbound", message)
        
        # Return HTTP 202 Accepted immediately
        return {
            "fraud_score": 0.0, # Dummy for backwards compatibility with simulator
            "status": "Processing",
            "decision_reason": f"⏳ Transaction queued for ML inference"
        }

    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Ingestion Error: {str(e)}")

@app.get("/api/transactions/recent")
def get_recent_transactions(limit: int = 10, db: Session = Depends(get_db)):
    # Outer-join Transaction with Customer to get name and card details (preserves direct checkouts)
    results = db.query(Transaction, Customer).outerjoin(Customer, Transaction.customer_id == Customer.id).order_by(Transaction.id.desc()).limit(limit).all()
    
    # Format the response
    formatted_transactions = []
    for txn, cust in results:
        formatted_transactions.append({
            "id": txn.id,
            "customer_id": txn.customer_id,
            "merchant": txn.merchant or "Online Checkout",
            "amount": float(txn.amount or 0.0),
            "timestamp": txn.timestamp,
            "fraud_score": txn.fraud_score or 0.0,
            "status": txn.status or "Approve",
            "customer_name": cust.full_name if cust else "Guest Customer",
            "card_type": cust.card_type if cust else "Visa",
            "card_last_four": cust.card_last_four if cust else "4242"
        })
    return formatted_transactions

@app.get("/api/investigations")
def get_investigations(db: Session = Depends(get_db)):
    # Get all transactions that were declined or escalated, ordered by most recent
    results = db.query(Transaction, Customer)\
        .join(Customer, Transaction.customer_id == Customer.id)\
        .filter(Transaction.status.in_(['Decline', 'Escalate']))\
        .order_by(Transaction.timestamp.desc())\
        .limit(50).all()
    
    formatted_investigations = []
    import json
    for txn, cust in results:
        shap_explanation = None
        if txn.shap_explanation:
            try:
                shap_explanation = json.loads(txn.shap_explanation)
            except:
                pass
                
        formatted_investigations.append({
            "id": txn.id,
            "customer_id": txn.customer_id,
            "merchant": txn.merchant,
            "amount": txn.amount,
            "timestamp": txn.timestamp,
            "fraud_score": txn.fraud_score,
            "xgboost_score": txn.xgboost_score,
            "autoencoder_score": txn.autoencoder_score,
            "status": txn.status,
            "customer_name": cust.full_name,
            "card_type": cust.card_type,
            "card_last_four": cust.card_last_four,
            "shap_explanation": shap_explanation
        })
    return formatted_investigations

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

# ─── SYNCHRONOUS SCORE ENDPOINT (no Kafka required) ───────────────────────────
# Implements gap-free decision policy:
#   score >= DECLINE_THRESHOLD  →  Decline
#   score >= REVIEW_THRESHOLD   →  Escalate
#   score <  REVIEW_THRESHOLD   →  Approve
#
# BRD AMBIGUITY NOTE: The BRD specified thresholds with gaps (0.50 and 0.70-0.71
# were uncovered). This implementation uses a contiguous, gap-free policy:
#   Default decline threshold: 0.70 (BRD said 0.71; 0.70 chosen conservatively)
#   Default review threshold:  0.50 (BRD's gap at exactly 0.50 → Escalate is safer)
# Both thresholds are configurable via /api/config/thresholds.

import time as _time_module

DEFAULT_FEATURE_NAMES = [
    "amount", "hour_of_day", "velocity_1h", "is_foreign",
    "merchant_category_code", "pos_entry_mode", "currency",
    "moto_eci_indicator", "three_d_secure"
]

def _safe_encode_inline(col: str, val: str) -> float:
    """Encode a categorical value using the loaded feature encoders."""
    if feature_encoders and col in feature_encoders:
        le = feature_encoders[col]
        val_str = str(val)
        if val_str in le.classes_:
            return float(le.transform([val_str])[0])
    return 0.0  # Unknown category → safe default


@app.post("/api/score", response_model=None)
def score_transaction_sync(
    txn: TransactionRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Synchronous fraud scoring endpoint.
    Performs inline ML inference — no Kafka required.
    Returns the fraud score, decision, and reasons immediately.

    Decision policy (gap-free, configurable):
      score >= decline_threshold  →  Decline
      score >= review_threshold   →  Escalate
      score <  review_threshold   →  Approve

    NOTE: This system uses synthetic demo data. Do not use for real payment authorization.
    """
    t_start = _time_module.perf_counter()

    meta = txn.metadata
    customer_id = meta.customer_id

    # ── 1. Load thresholds from DB (configurable) ─────────────────────────
    try:
        cfg_decline = db.query(SystemConfig).filter(SystemConfig.key == "fraud_threshold_decline").first()
        cfg_review  = db.query(SystemConfig).filter(SystemConfig.key == "fraud_threshold_review").first()
        decline_threshold = float(cfg_decline.value) if cfg_decline else 0.70
        review_threshold  = float(cfg_review.value)  if cfg_review  else 0.50
    except Exception:
        decline_threshold, review_threshold = 0.70, 0.50

    # ── 2. Check customer / first-time card safely ────────────────────────
    try:
        customer = db.query(Customer).filter(Customer.id == customer_id).first()
        if not customer:
            # First-time card/customer: safely initialize record to satisfy foreign key
            customer = Customer(
                id=customer_id,
                full_name=f"Customer #{customer_id}",
                email=f"customer_{customer_id}_{uuid.uuid4().hex[:6]}@demo.local",
                card_type="Visa",
                card_last_four="4242",
                risk_score=0.0,
                is_frozen=False,
                is_active=True
            )
            db.add(customer)
            db.commit()
            db.refresh(customer)
    except Exception:
        db.rollback()
        try:
            customer = db.query(Customer).filter(Customer.id == customer_id).first()
        except Exception:
            customer = None

    if customer and customer.is_frozen:
        proc_ms = (_time_module.perf_counter() - t_start) * 1000
        # Persist the frozen-card decline
        new_txn = Transaction(
            customer_id=customer.id if customer else None,
            merchant=meta.merchant,
            merchant_category_code=meta.merchant_category_code,
            merchant_country_code=meta.merchant_country_code,
            amount=meta.amount,
            currency=meta.currency,
            transaction_type=meta.transaction_type,
            pos_entry_mode=meta.pos_entry_mode,
            terminal_id=meta.terminal_id,
            moto_eci_indicator=meta.moto_eci_indicator,
            three_d_secure=meta.three_d_secure,
            fraud_score=1.0,
            xgboost_score=0.0,
            autoencoder_score=0.0,
            status="Decline",
            processing_time_ms=proc_ms,
            shap_explanation=None,
            ip_address=meta.ip_address,
            device_fingerprint=meta.device_fingerprint,
            shipping_address=meta.shipping_address,
        )
        try:
            db.add(new_txn); db.commit(); db.refresh(new_txn)
            background_tasks.add_task(notification_service.check_and_notify, db, new_txn)
        except Exception:
            db.rollback()
        return {
            "transaction_id": new_txn.id if new_txn.id else None,
            "fraud_score": 1.0,
            "xgboost_score": 0.0,
            "autoencoder_score": 0.0,
            "status": "Decline",
            "decision_reason": "Card is frozen — all transactions blocked",
            "reason_codes": ["FROZEN_CARD"],
            "model_version": "xgboost-v1",
            "processing_time_ms": round(proc_ms, 2),
            "thresholds": {"decline": decline_threshold, "review": review_threshold},
        }

    # ── 3. Velocity + Geo (Redis, degrades gracefully) ─────────────────────
    from app.core.cache import check_and_update_velocity, check_if_foreign, update_geolocation
    velocity_1h = check_and_update_velocity(customer_id)
    is_foreign  = check_if_foreign(customer_id, meta.merchant_country_code)
    update_geolocation(customer_id, meta.merchant_country_code)

    # ── 4. Build feature vector ────────────────────────────────────────────
    hour_of_day = datetime.now().hour
    features_list = [
        float(meta.amount),
        float(hour_of_day),
        float(velocity_1h),
        float(is_foreign),
        _safe_encode_inline('merchant_category_code', meta.merchant_category_code),
        _safe_encode_inline('pos_entry_mode',         meta.pos_entry_mode),
        _safe_encode_inline('currency',               meta.currency),
        _safe_encode_inline('moto_eci_indicator',     meta.moto_eci_indicator),
        _safe_encode_inline('three_d_secure',         meta.three_d_secure),
    ]
    X = np.array(features_list).reshape(1, -1)

    # ── 5. XGBoost inference ───────────────────────────────────────────────
    xgboost_score = 0.0
    shap_json = None
    if ml_model is not None:
        try:
            xgboost_score = float(ml_model.predict_proba(X)[0][1])
            # SHAP explanation
            try:
                import shap as _shap
                explainer = _shap.TreeExplainer(ml_model)
                shap_vals = explainer.shap_values(X)
                contribs = list(zip(DEFAULT_FEATURE_NAMES, shap_vals[0]))
                contribs.sort(key=lambda x: x[1], reverse=True)
                top3 = {f: round(float(v), 4) for f, v in contribs[:3] if v > 0}
                shap_json = json.dumps(top3) if top3 else None
            except Exception:
                pass  # SHAP failure is non-fatal
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Model inference error: {e}")
    else:
        raise HTTPException(status_code=503, detail="ML model not loaded. Run training first.")

    # ── 6. Numpy Autoencoder inference (TF-free) ───────────────────────────
    autoencoder_score = 0.0
    ae_source = "none"
    if numpy_autoencoder is not None and numpy_ae_scaler is not None:
        try:
            X_scaled = numpy_ae_scaler.transform(X)
            if np.max(np.abs(X_scaled)) > 100:
                autoencoder_score = 1.0
            else:
                recon_err = float(numpy_autoencoder.reconstruction_error(X_scaled)[0])
                threshold = numpy_ae_metadata.get('reconstruction_threshold', 0.5)
                autoencoder_score = min(recon_err / threshold, 1.0)
            ae_source = "numpy"
        except Exception:
            pass
    elif autoencoder_model is not None and autoencoder_scaler is not None:
        # Fallback: TF autoencoder if available
        try:
            X_scaled = autoencoder_scaler.transform(X)
            reconstruction = autoencoder_model.predict(X_scaled, verbose=0)
            recon_err = float(np.mean(np.power(X_scaled - reconstruction, 2)))
            threshold = autoencoder_metadata.get('reconstruction_threshold', 0.5)
            autoencoder_score = min(recon_err / threshold, 1.0)
            ae_source = "tensorflow"
        except Exception:
            pass

    # ── 7. Hybrid score: XGBoost dominant, AE secondary ───────────────────
    if ae_source != "none":
        fraud_score = round((0.65 * xgboost_score) + (0.35 * autoencoder_score), 4)
        model_used = f"hybrid-xgb+ae({ae_source})"
    else:
        fraud_score = round(xgboost_score, 4)
        model_used = "xgboost-only"

    # ── 8. Gap-free decision policy with active threat enforcement ─────────
    # A foreign VPN location jump or velocity burst triggers high risk
    if is_foreign:
        fraud_score = max(fraud_score, 0.78)  # Guarantees Decline
    if velocity_1h >= 3:
        fraud_score = max(fraud_score, 0.82)  # Guarantees Decline

    if fraud_score >= decline_threshold:
        status = "Decline"
        reason_codes = ["HIGH_FRAUD_SCORE"]
        if is_foreign:
            reason_codes.append("FOREIGN_TRANSACTION")
            reason_codes.append("SUSPICIOUS_GEOLOCATION")
        if velocity_1h >= 3:
            reason_codes.append("HIGH_VELOCITY")
    elif fraud_score >= review_threshold:
        status = "Escalate"
        reason_codes = ["MEDIUM_FRAUD_SCORE"]
        if is_foreign:
            reason_codes.append("FOREIGN_TRANSACTION")
    else:
        status = "Approve"
        reason_codes = ["LOW_RISK"]

    # ── 9. Persist to database ─────────────────────────────────────────────
    proc_ms = (_time_module.perf_counter() - t_start) * 1000
    new_txn = Transaction(
        customer_id=customer.id if customer else None,
        merchant=meta.merchant,
        merchant_category_code=meta.merchant_category_code,
        merchant_country_code=meta.merchant_country_code,
        amount=meta.amount,
        currency=meta.currency,
        transaction_type=meta.transaction_type,
        pos_entry_mode=meta.pos_entry_mode,
        terminal_id=meta.terminal_id,
        moto_eci_indicator=meta.moto_eci_indicator,
        three_d_secure=meta.three_d_secure,
        timestamp=datetime.now(),
        fraud_score=fraud_score,
        xgboost_score=round(xgboost_score, 4),
        autoencoder_score=round(autoencoder_score, 4),
        status=status,
        processing_time_ms=round(proc_ms, 2),
        shap_explanation=shap_json,
        ip_address=meta.ip_address,
        device_fingerprint=meta.device_fingerprint,
        shipping_address=meta.shipping_address,
    )
    try:
        db.add(new_txn)
        db.commit()
        db.refresh(new_txn)
        background_tasks.add_task(notification_service.check_and_notify, db, new_txn)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {e}")

    return {
        "transaction_id": new_txn.id,
        "fraud_score": fraud_score,
        "xgboost_score": round(xgboost_score, 4),
        "autoencoder_score": round(autoencoder_score, 4),
        "status": status,
        "decision_reason": f"{status} | XGB:{xgboost_score:.3f} AE:{autoencoder_score:.3f} | {'Foreign' if is_foreign else 'Domestic'} | Velocity:{velocity_1h}",
        "reason_codes": reason_codes,
        "shap_explanation": json.loads(shap_json) if shap_json else None,
        "model_version": model_used,
        "processing_time_ms": round(proc_ms, 2),
        "thresholds": {
            "decline": decline_threshold,
            "review": review_threshold,
            "policy_note": "Gap-free: score>=decline->Decline, score>=review->Escalate, else Approve"
        },
    }

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