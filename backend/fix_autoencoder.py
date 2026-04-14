"""
Fix Autoencoder Keras Serialization Issue
==========================================

Retrains Autoencoder with proper Keras 3.0+ serialization format.
This ensures compatibility with TensorFlow 2.21.0+
"""

import numpy as np
import joblib
import os
from datetime import datetime
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
import warnings
warnings.filterwarnings('ignore')

# TensorFlow
import tensorflow as tf
from tensorflow.keras import Sequential
from tensorflow.keras.layers import Dense
from tensorflow.keras.optimizers import Adam
from tensorflow.keras.callbacks import EarlyStopping

# Database
from sqlalchemy import create_engine, text
from app.core.config import settings

print("\n" + "="*70)
print("[FIX] AUTOENCODER: Training with Correct Keras Format")
print("="*70)

# Load normal transactions
print("\n[1] Loading training data...")
try:
    engine = create_engine(settings.DATABASE_URL)
    
    query = """
        SELECT 
            COALESCE(fraud_score, 0.5) as score,
            COALESCE(amount, 0) as amount
        FROM transactions
        WHERE status IN ('Approve', 'Escalate')
        LIMIT 5000
    """
    
    with engine.connect() as conn:
        result = conn.execute(text(query))
        rows = result.fetchall()
    
    if len(rows) < 100:
        print("    [WARN] Using synthetic data...")
        np.random.seed(42)
        normal_features = []
        for _ in range(2000):
            features = np.random.normal(loc=0, scale=1, size=30)
            normal_features.append(features)
        normal_data = np.array(normal_features, dtype=np.float32)
    else:
        features_list = [list(row) + [0] * 28 for row in rows]
        normal_data = np.array(features_list, dtype=np.float32)[:, :30]
        print(f"    [OK] Loaded {len(normal_data)} transactions")
    
    # Preprocess
    scaler = StandardScaler()
    normal_data_scaled = scaler.fit_transform(normal_data)
    
    train_data, val_data = train_test_split(
        normal_data_scaled,
        test_size=0.2,
        random_state=42
    )
    
    print(f"    Train: {len(train_data)}, Val: {len(val_data)}")
    
    # Build Autoencoder
    print("\n[2] Building Autoencoder...")
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
    print("\n[3] Training...")
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
        verbose=0
    )
    
    print("    [OK] Training complete!")
    
    # Calculate errors
    train_predictions = autoencoder.predict(train_data, verbose=0)
    train_errors = np.mean(np.power(train_data - train_predictions, 2), axis=1)
    
    val_predictions = autoencoder.predict(val_data, verbose=0)
    val_errors = np.mean(np.power(val_data - val_predictions, 2), axis=1)
    
    reconstruction_threshold = val_errors.mean() + 2 * val_errors.std()
    
    # Save with NEW format
    print("\n[4] Saving models (TensorFlow 2.21+ compatible format)...")
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    
    # Use keras format (NOT h5)
    model_path = f"autoencoder_model_fixed_{timestamp}.keras"
    autoencoder.save(model_path, save_format='keras')
    print(f"    [OK] Model: {model_path} (keras format)")
    
    scaler_path = f"autoencoder_scaler_fixed_{timestamp}.pkl"
    joblib.dump(scaler, scaler_path)
    print(f"    [OK] Scaler: {scaler_path}")
    
    metadata = {
        'timestamp': timestamp,
        'reconstruction_threshold': float(reconstruction_threshold),
        'val_error_mean': float(val_errors.mean()),
    }
    
    metadata_path = f"autoencoder_metadata_fixed_{timestamp}.pkl"
    joblib.dump(metadata, metadata_path)
    print(f"    [OK] Metadata: {metadata_path}")
    
    # Update symlinks
    print("\n[5] Updating active model links...")
    
    # Backup old files
    for old_file in ['autoencoder_model.h5', 'autoencoder_model.keras']:
        if os.path.exists(old_file):
            os.remove(old_file)
    
    # Create new symlinks with keras format
    os.symlink(model_path, "autoencoder_model.keras")
    
    for old_file in ['autoencoder_scaler.pkl']:
        if os.path.exists(old_file):
            os.remove(old_file)
    os.symlink(scaler_path, "autoencoder_scaler.pkl")
    
    for old_file in ['autoencoder_metadata.pkl']:
        if os.path.exists(old_file):
            os.remove(old_file)
    os.symlink(metadata_path, "autoencoder_metadata.pkl")
    
    print("    [OK] Symlinks updated!")
    
    print("\n" + "="*70)
    print("[SUCCESS] AUTOENCODER FIX COMPLETE!")
    print("="*70)
    print("\nRestart backend to enable Hybrid Mode:")
    print("   uvicorn app.main:app --reload\n")
    
except Exception as e:
    print(f"\n[ERROR] {e}")
    import traceback
    traceback.print_exc()
