import os
import sys
import json
import time
import joblib
import numpy as np
from datetime import datetime

# Add the backend directory to python path so we can import 'app'
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from kafka import KafkaConsumer
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.config import settings
from app.core.database import SessionLocal
from app.models.customer import Customer
from app.models.transaction import Transaction
from app.models.config import SystemConfig
from app.services.notification_service import notification_service
from app.services.graph_service import graph_db
from app.models.gnn_fraud_model import get_gnn_fraud_score

import warnings
warnings.filterwarnings('ignore')

import shap

# Deep Learning
try:
    from tensorflow.keras.models import load_model
    TF_AVAILABLE = True
except ImportError:
    TF_AVAILABLE = False
    print("⚠️  TensorFlow not available. Autoencoder will not be loaded.")

print("\n" + "="*70)
print(" FRAUD DETECTION CONSUMER WORKER STARTUP")
print("="*70)

# 1. Load ML Models
print("\n[1/3] Loading Machine Learning Models...")

ml_model = None
feature_encoders = None
try:
    ml_model = joblib.load(os.path.join(os.path.dirname(os.path.dirname(__file__)), "fraud_model.pkl"))
    feature_encoders = joblib.load(os.path.join(os.path.dirname(os.path.dirname(__file__)), "feature_encoders.pkl"))
    
    # Initialize SHAP explainer
    shap_explainer = shap.TreeExplainer(ml_model)
    print("     ✅ XGBoost model and SHAP explainer loaded")
except Exception as e:
    print(f"     ❌ XGBoost model failed: {e}")

shadow_model = None
try:
    shadow_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "fraud_model_shadow.pkl")
    if os.path.exists(shadow_path):
        shadow_model = joblib.load(shadow_path)
        print("     ✅ Shadow model loaded successfully")
except Exception as e:
    print(f"     ❌ Shadow model failed to load: {e}")

autoencoder_model = None
autoencoder_scaler = None
autoencoder_metadata = None
try:
    if TF_AVAILABLE:
        base_dir = os.path.dirname(os.path.dirname(__file__))
        try:
            autoencoder_model = load_model(os.path.join(base_dir, "autoencoder_model.keras"))
            print("     ✅ Autoencoder loaded (keras format)")
        except:
            autoencoder_model = load_model(os.path.join(base_dir, "autoencoder_model.h5"))
            print("     ✅ Autoencoder loaded (h5 format)")
            
        autoencoder_scaler = joblib.load(os.path.join(base_dir, "autoencoder_scaler.pkl"))
        autoencoder_metadata = joblib.load(os.path.join(base_dir, "autoencoder_metadata.pkl"))
except Exception as e:
    print(f"     ❌ Autoencoder model failed: {e}")

hybrid_mode_enabled = (ml_model is not None and autoencoder_model is not None)
print(f"     Hybrid Mode: {'ENABLED' if hybrid_mode_enabled else 'DISABLED'}")

# 2. Connect to Database
print("\n[2/3] Connecting to Database...")
db = SessionLocal()
try:
    # Test query
    from sqlalchemy import text
    db.execute(text("SELECT 1"))
    print("     ✅ Database connected")
except Exception as e:
    print(f"     ❌ Database connection failed: {e}")
    sys.exit(1)

# 3. Connect to Kafka
print(f"\n[3/3] Connecting to Kafka broker at {settings.KAFKA_BROKER_URL}...")
try:
    consumer = KafkaConsumer(
        'transactions_inbound',
        bootstrap_servers=settings.KAFKA_BROKER_URL,
        auto_offset_reset='latest', # Don't re-process old messages on restart for this demo
        enable_auto_commit=True,
        group_id='fraud_workers',
        value_deserializer=lambda m: json.loads(m.decode('utf-8'))
    )
    print("     ✅ Kafka Consumer connected and listening for transactions...")
except Exception as e:
    print(f"     ❌ Kafka connection failed: {e}")
    sys.exit(1)

def safe_encode(col, val):
    if feature_encoders and col in feature_encoders:
        le = feature_encoders[col]
        val_str = str(val)
        if val_str in le.classes_:
            return float(le.transform([val_str])[0])
    return 0.0

print("\n" + "="*70)
print(" WORKER IS RUNNING - WAITING FOR MESSAGES")
print("="*70 + "\n")

# Consume Loop
for message in consumer:
    try:
        data = message.value
        transaction_id = data.get("transaction_id")
        metadata = data.get("metadata", {})
        features = data.get("features", {})
        ingestion_time = data.get("ingestion_time", time.time())
        
        # Calculate time taken from API to Worker
        queue_time_ms = (time.time() - ingestion_time) * 1000
        
        # 1. Check Freeze Status (Passed from API)
        if features.get("is_frozen"):
            status = "Decline"
            decision_reason = "❌ Customer Card is FROZEN"
            hybrid_score = 1.0
            xgboost_score = 0.0
            autoencoder_score = 0.0
            reconstruction_error = 0.0
            gnn_score = 0.0
        else:
            # Sync transaction to Graph Database
            graph_db.sync_transaction(data, metadata)
            # Fetch Graph/GNN Score
            gnn_score = get_gnn_fraud_score(transaction_id, graph_db)
            
            # 2. Extract Features
            hour_of_day = datetime.now().hour
            velocity_1h = features.get("velocity_1h", 0)
            is_foreign = features.get("is_foreign", 0)
            
            features_list = [
                float(metadata.get('amount', 0)),
                float(hour_of_day),
                float(velocity_1h),
                float(is_foreign),
                safe_encode('merchant_category_code', metadata.get('merchant_category_code')),
                safe_encode('pos_entry_mode', metadata.get('pos_entry_mode')),
                safe_encode('currency', metadata.get('currency')),
                safe_encode('moto_eci_indicator', metadata.get('moto_eci_indicator')),
                safe_encode('three_d_secure', metadata.get('three_d_secure'))
            ]
            feature_names = [
                "amount", "hour_of_day", "velocity_1h", "is_foreign",
                "merchant_category_code", "pos_entry_mode", "currency",
                "moto_eci_indicator", "three_d_secure"
            ]
            features_array = np.array(features_list).reshape(1, -1)

            xgboost_score = 0.0
            autoencoder_score = 0.0
            reconstruction_error = 0.0
            shadow_score = None

            shap_explanation_json = None
            
            # 3. XGBoost
            if ml_model is not None:
                xgboost_score = float(ml_model.predict_proba(features_array)[0][1])
                try:
                    shap_values = shap_explainer.shap_values(features_array)
                    # Get top 3 features contributing to fraud (positive SHAP values)
                    feature_contributions = list(zip(feature_names, shap_values[0]))
                    feature_contributions.sort(key=lambda x: x[1], reverse=True)
                    top_contributors = {feat: float(val) for feat, val in feature_contributions[:3] if val > 0}
                    shap_explanation_json = json.dumps(top_contributors)
                except Exception as e:
                    print(f"SHAP explanation failed: {e}")
            
            # 3.5 Shadow Model
            if shadow_model is not None:
                shadow_score = float(shadow_model.predict_proba(features_array)[0][1])
            
            # 4. Autoencoder
            if autoencoder_model is not None and autoencoder_scaler is not None:
                features_scaled = autoencoder_scaler.transform(features_array)
                if np.max(np.abs(features_scaled)) > 100:
                    reconstruction_error = 999.0
                    autoencoder_score = 1.0
                else:
                    reconstruction = autoencoder_model.predict(features_scaled, verbose=0)
                    reconstruction_error = float(np.mean(np.power(features_scaled - reconstruction, 2)))
                    threshold = autoencoder_metadata.get('reconstruction_threshold', 0.5)
                    autoencoder_score = min(reconstruction_error / threshold, 1.0)
            
            # 5. Hybrid Calculation
            if hybrid_mode_enabled:
                hybrid_score = (0.5 * xgboost_score) + (0.3 * autoencoder_score) + (0.2 * gnn_score)
                model_explanation = f"XGB:{xgboost_score:.2f}|AE:{autoencoder_score:.2f}|GNN:{gnn_score:.2f}"
            else:
                hybrid_score = (0.8 * xgboost_score) + (0.2 * gnn_score)
                model_explanation = f"XGB:{xgboost_score:.2f}|GNN:{gnn_score:.2f}"

            # 6. Thresholds & Decision
            decline_threshold = 0.70
            review_threshold = 0.50
            
            config_decline = db.query(SystemConfig).filter(SystemConfig.key == "fraud_threshold_decline").first()
            if config_decline: decline_threshold = float(config_decline.value)

            config_review = db.query(SystemConfig).filter(SystemConfig.key == "fraud_threshold_review").first()
            if config_review: review_threshold = float(config_review.value)

            if hybrid_score >= decline_threshold:
                status = "Decline"
                decision_reason = f"🚨 Critical Risk | {model_explanation}"
            elif hybrid_score >= review_threshold:
                status = "Escalate"
                decision_reason = f"⚠️  Medium Risk | {model_explanation}"
            else:
                status = "Approve"
                decision_reason = f"✅ Low Risk | {model_explanation}"

        # 7. Save to Database
        processing_time_ms = (time.time() - ingestion_time) * 1000
        
        new_txn = Transaction(
            customer_id=metadata.get('customer_id'),
            merchant=metadata.get('merchant'),
            merchant_category_code=metadata.get('merchant_category_code'),
            merchant_country_code=metadata.get('merchant_country_code'),
            amount=metadata.get('amount'),
            currency=metadata.get('currency'),
            transaction_type=metadata.get('transaction_type'),
            pos_entry_mode=metadata.get('pos_entry_mode'),
            terminal_id=metadata.get('terminal_id'),
            moto_eci_indicator=metadata.get('moto_eci_indicator'),
            three_d_secure=metadata.get('three_d_secure'),
            fraud_score=round(hybrid_score, 4),
            xgboost_score=round(xgboost_score, 4),
            autoencoder_score=round(autoencoder_score, 4),
            reconstruction_error=round(reconstruction_error, 6),
            status=status,
            processing_time_ms=processing_time_ms,
            shap_explanation=shap_explanation_json if 'shap_explanation_json' in locals() else None,
            shadow_score=round(shadow_score, 4) if shadow_score is not None else None,
            ip_address=metadata.get('ip_address'),
            device_fingerprint=metadata.get('device_fingerprint'),
            shipping_address=metadata.get('shipping_address'),
            gnn_score=round(gnn_score, 4)
        )
        db.add(new_txn)
        db.commit()
        db.refresh(new_txn)
        
        # 8. Notifications
        notification_service.check_and_notify(db, new_txn)
        
        print(f"[{status}] Txn {new_txn.id} | Score: {hybrid_score:.4f} | Processed in {processing_time_ms:.1f}ms (Queue: {queue_time_ms:.1f}ms)")

    except Exception as e:
        print(f"Error processing message: {e}")
        db.rollback()
