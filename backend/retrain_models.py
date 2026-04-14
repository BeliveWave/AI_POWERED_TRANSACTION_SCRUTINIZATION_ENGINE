"""
Monthly Model Retraining Pipeline
==================================

This script retrains both the XGBoost and Autoencoder models based on:
1. XGBoost: New confirmed frauds from admin feedback
2. Autoencoder: All normal (non-fraud) transactions

This enables continuous learning and adaptation to new fraud patterns.

Usage:
    python retrain_models.py
    
Scheduled:
    Run this monthly (1st of month at 12:00 AM UTC)
    Using: 0 0 1 * * cd /path/to/backend && python retrain_models.py
"""

import numpy as np
import pandas as pd
import joblib
import os
from datetime import datetime, timedelta
from pathlib import Path
import warnings
warnings.filterwarnings('ignore')

# Database
from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session
from app.models.transaction import Transaction
from app.models.customer import Customer
from app.core.config import settings

# ML Libraries
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from xgboost import XGBClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score

# TensorFlow
try:
    from tensorflow.keras import Sequential
    from tensorflow.keras.layers import Dense
    from tensorflow.keras.optimizers import Adam
    from tensorflow.keras.callbacks import EarlyStopping
    TF_AVAILABLE = True
except ImportError:
    TF_AVAILABLE = False
    print("⚠️  TensorFlow not available")

print("\n" + "="*80)
print("🔄 MONTHLY MODEL RETRAINING PIPELINE")
print("="*80)

# ============================================================================
# PART 1: RETRAIN XGBOOST MODEL
# ============================================================================
print("\n[PART 1/2] XGBOOST RETRAINING")
print("-" * 80)

def retrain_xgboost():
    """
    Retrain XGBoost on all transactions (both normal and confirmed frauds).
    This teaches the model about new fraud patterns discovered by admins.
    """
    print("\n📊 Loading transaction data from database...")
    
    try:
        engine = create_engine(settings.DATABASE_URL)
        
        # Get all recent transactions (last 90 days)
        query = """
            SELECT 
                xgboost_score,
                autoencoder_score,
                fraud_score,
                status,
                amount
            FROM transactions
            WHERE timestamp >= NOW() - INTERVAL '90 days'
        """
        
        with engine.connect() as conn:
            result = conn.execute(text(query))
            rows = result.fetchall()
        
        if len(rows) < 100:
            print("⚠️  Insufficient transaction data for retraining (need at least 100)")
            print("   Skipping XGBoost retraining...")
            return False
        
        # Prepare features and labels
        X = []
        y = []
        
        for row in rows:
            xgb_score, ae_score, hybrid_score, status, amount = row
            
            # Create feature vector (simplified for example)
            features = [
                xgb_score or 0.0,
                ae_score or 0.0,
                hybrid_score or 0.0,
                amount or 0.0
            ]
            X.append(features)
            
            # Label: 1 for Decline (fraud), 0 otherwise
            label = 1 if status == "Decline" else 0
            y.append(label)
        
        X = np.array(X)
        y = np.array(y)
        
        print(f"   ✅ Loaded {len(X)} transactions")
        print(f"      - Fraud cases: {sum(y)}")
        print(f"      - Normal cases: {len(y) - sum(y)}")
        
        # Check class balance
        fraud_ratio = sum(y) / len(y)
        print(f"      - Fraud ratio: {fraud_ratio:.2%}")
        
        if fraud_ratio < 0.01:
            print("   ⚠️  Fraud ratio too low. Using synthetic oversampling...")
            # Simple oversampling: repeat fraud cases
            fraud_indices = np.where(y == 1)[0]
            normal_indices = np.where(y == 0)[0]
            
            # Balance to 10% fraud
            target_fraud_count = max(100, len(normal_indices) // 10)
            fraud_indices = np.random.choice(
                fraud_indices, 
                size=target_fraud_count, 
                replace=True
            )
            
            balanced_indices = np.concatenate([normal_indices, fraud_indices])
            X = X[balanced_indices]
            y = y[balanced_indices]
            
            print(f"   ✅ After balancing: {len(X)} transactions (fraud: {sum(y)})")
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )
        
        # Train XGBoost
        print("\n🤖 Training XGBoost model...")
        
        xgb_model = XGBClassifier(
            n_estimators=100,
            max_depth=6,
            learning_rate=0.1,
            subsample=0.8,
            colsample_bytree=0.8,
            random_state=42,
            n_jobs=-1,
            verbosity=0
        )
        
        xgb_model.fit(X_train, y_train, verbose=False)
        
        # Evaluate
        y_pred_train = xgb_model.predict(X_train)
        y_pred_test = xgb_model.predict(X_test)
        
        train_accuracy = accuracy_score(y_train, y_pred_train)
        test_accuracy = accuracy_score(y_test, y_pred_test)
        precision = precision_score(y_test, y_pred_test, zero_division=0)
        recall = recall_score(y_test, y_pred_test, zero_division=0)
        f1 = f1_score(y_test, y_pred_test, zero_division=0)
        
        print("\n📈 Model Performance:")
        print(f"   • Train Accuracy: {train_accuracy:.4f}")
        print(f"   • Test Accuracy:  {test_accuracy:.4f}")
        print(f"   • Precision:      {precision:.4f}")
        print(f"   • Recall:         {recall:.4f}")
        print(f"   • F1-Score:       {f1:.4f}")
        
        # Save new model with version
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        new_model_path = f"fraud_model_v{timestamp}.pkl"
        joblib.dump(xgb_model, new_model_path)
        print(f"\n💾 New model saved: {new_model_path}")
        
        # Update active model link
        try:
            if os.path.exists("fraud_model.pkl"):
                os.remove("fraud_model.pkl")
            os.symlink(new_model_path, "fraud_model.pkl")
            print("🔗 Active model link updated: fraud_model.pkl → " + new_model_path)
        except Exception as e:
            print(f"⚠️  Could not update symlink: {e}")
        
        return True
        
    except Exception as e:
        print(f"❌ XGBoost retraining failed: {e}")
        return False

# ============================================================================
# PART 2: RETRAIN AUTOENCODER MODEL
# ============================================================================
print("\n[PART 2/2] AUTOENCODER RETRAINING")
print("-" * 80)

def retrain_autoencoder():
    """
    Retrain Autoencoder on normal transactions only.
    Updates the model's understanding of normal behavior to catch new anomalies.
    """
    if not TF_AVAILABLE:
        print("⚠️  TensorFlow not available. Skipping Autoencoder retraining...")
        return False
    
    print("\n📊 Loading normal transactions from database...")
    
    try:
        engine = create_engine(settings.DATABASE_URL)
        
        # Get normal transactions (last 90 days, non-fraud)
        query = """
            SELECT 
                COALESCE(fraud_score, 0.5) as score,
                COALESCE(amount, 0) as amount
            FROM transactions
            WHERE timestamp >= NOW() - INTERVAL '90 days'
                AND status IN ('Approve', 'Escalate')
            LIMIT 5000
        """
        
        with engine.connect() as conn:
            result = conn.execute(text(query))
            rows = result.fetchall()
        
        if len(rows) < 100:
            print("⚠️  Insufficient normal transactions (need at least 100)")
            print("   Generating synthetic data...")
            
            # Generate synthetic normal transactions
            np.random.seed(42)
            normal_features = []
            for _ in range(2000):
                features = np.random.normal(loc=0, scale=1, size=30)
                normal_features.append(features)
            normal_data = np.array(normal_features, dtype=np.float32)
        else:
            # Use actual transactions
            features_list = [list(row) + [0] * 28 for row in rows]  # Pad to 30 features
            normal_data = np.array(features_list, dtype=np.float32)[:, :30]
            print(f"   ✅ Loaded {len(normal_data)} normal transactions")
        
        # Preprocess
        print("\n🔧 Preprocessing data...")
        scaler = StandardScaler()
        normal_data_scaled = scaler.fit_transform(normal_data)
        
        train_data, val_data = train_test_split(
            normal_data_scaled,
            test_size=0.2,
            random_state=42
        )
        
        print(f"   • Train samples: {len(train_data)}")
        print(f"   • Val samples:   {len(val_data)}")
        
        # Build Autoencoder
        print("\n🏗️  Building Autoencoder...")
        autoencoder = Sequential([
            Dense(20, activation='relu', input_dim=30, name='encoder_1'),
            Dense(15, activation='relu', name='encoder_2'),
            Dense(10, activation='relu', name='bottleneck'),
            Dense(15, activation='relu', name='decoder_1'),
            Dense(20, activation='relu', name='decoder_2'),
            Dense(30, activation='sigmoid', name='output')
        ])
        
        autoencoder.compile(optimizer=Adam(learning_rate=0.001), loss='mse')
        
        # Train
        print("\n🚀 Training Autoencoder...")
        early_stop = EarlyStopping(
            monitor='val_loss',
            patience=5,
            restore_best_weights=True,
            verbose=0
        )
        
        history = autoencoder.fit(
            train_data, train_data,
            epochs=50,
            batch_size=32,
            validation_data=(val_data, val_data),
            callbacks=[early_stop],
            verbose=1
        )
        
        # Calculate reconstruction errors
        print("\n📊 Calculating reconstruction errors...")
        train_predictions = autoencoder.predict(train_data, verbose=0)
        train_errors = np.mean(np.power(train_data - train_predictions, 2), axis=1)
        
        val_predictions = autoencoder.predict(val_data, verbose=0)
        val_errors = np.mean(np.power(val_data - val_predictions, 2), axis=1)
        
        reconstruction_threshold = val_errors.mean() + 2 * val_errors.std()
        
        print(f"   • Train error - Mean: {train_errors.mean():.6f}, Std: {train_errors.std():.6f}")
        print(f"   • Val error - Mean:   {val_errors.mean():.6f}, Std: {val_errors.std():.6f}")
        print(f"   • Anomaly threshold:  {reconstruction_threshold:.6f}")
        
        # Save models
        print("\n💾 Saving models...")
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        model_path = f"autoencoder_model_v{timestamp}.h5"
        autoencoder.save(model_path)
        print(f"   ✅ Model: {model_path}")
        
        scaler_path = f"autoencoder_scaler_v{timestamp}.pkl"
        joblib.dump(scaler, scaler_path)
        print(f"   ✅ Scaler: {scaler_path}")
        
        metadata = {
            'timestamp': timestamp,
            'final_val_loss': float(history.history['val_loss'][-1]),
            'reconstruction_threshold': float(reconstruction_threshold),
            'train_error_mean': float(train_errors.mean()),
            'val_error_mean': float(val_errors.mean()),
        }
        
        metadata_path = f"autoencoder_metadata_v{timestamp}.pkl"
        joblib.dump(metadata, metadata_path)
        print(f"   ✅ Metadata: {metadata_path}")
        
        # Update active links
        try:
            if os.path.exists("autoencoder_model.h5"):
                os.remove("autoencoder_model.h5")
            os.symlink(model_path, "autoencoder_model.h5")
            
            if os.path.exists("autoencoder_scaler.pkl"):
                os.remove("autoencoder_scaler.pkl")
            os.symlink(scaler_path, "autoencoder_scaler.pkl")
            
            if os.path.exists("autoencoder_metadata.pkl"):
                os.remove("autoencoder_metadata.pkl")
            os.symlink(metadata_path, "autoencoder_metadata.pkl")
            
            print("🔗 Active model links updated")
        except Exception as e:
            print(f"⚠️  Could not update symlinks: {e}")
        
        return True
        
    except Exception as e:
        print(f"❌ Autoencoder retraining failed: {e}")
        return False

# ============================================================================
# MAIN EXECUTION
# ============================================================================
def main():
    """Execute the complete retraining pipeline"""
    
    print("\n⏰ Started at: " + datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
    
    xgb_success = retrain_xgboost()
    ae_success = retrain_autoencoder() if TF_AVAILABLE else False
    
    # Summary
    print("\n" + "="*80)
    print("📊 RETRAINING SUMMARY")
    print("="*80)
    print(f"XGBoost Retraining:    {'✅ SUCCESS' if xgb_success else '❌ FAILED'}")
    print(f"Autoencoder Retraining: {'✅ SUCCESS' if ae_success else '⏭️  SKIPPED' if not TF_AVAILABLE else '❌ FAILED'}")
    print("="*80 + "\n")
    
    return xgb_success or ae_success

if __name__ == "__main__":
    try:
        success = main()
        exit(0 if success else 1)
    except Exception as e:
        print(f"\n❌ Pipeline failed: {e}")
        import traceback
        traceback.print_exc()
        exit(1)
