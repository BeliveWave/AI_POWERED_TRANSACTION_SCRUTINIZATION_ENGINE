"""
Retrain Autoencoder with Feature Distribution Matching the Simulator
=====================================================================

This trains the Autoencoder on features that match what the simulator
actually sends, ensuring the scaler and model are consistent.
"""

import numpy as np
import joblib
import os
from datetime import datetime
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
import warnings
warnings.filterwarnings('ignore')

import tensorflow as tf
from tensorflow.keras import Sequential
from tensorflow.keras.layers import Dense
from tensorflow.keras.optimizers import Adam
from tensorflow.keras.callbacks import EarlyStopping

print("\n" + "="*70)
print("[RETRAIN] Autoencoder with Simulator-Matched Features")
print("="*70)

# Generate synthetic features EXACTLY like the simulator does
print("\n[1] Generating synthetic training data (matching simulator)...")

np.random.seed(42)
training_features = []

# Generate 2000 normal transactions
for _ in range(2000):
    # Features 0-27: Random normalized features [-2, 2]
    features = [np.random.uniform(-2.0, 2.0) for _ in range(28)]
    
    # Feature 28: Time feature
    features.append(np.random.uniform(-2.0, 2.0))
    
    # Feature 29: Normalized amount (like simulator sends)
    # Typical: 500-15,000 LKR = 1.67-50 USD
    # Normalized: (amount_usd - 25) / 20 ≈ -1.17 to 1.25
    amount_lkr = np.random.uniform(500.0, 15000.0)
    amount_usd = amount_lkr / 300.0
    normalized_amount = (amount_usd - 25.0) / 20.0
    features.append(normalized_amount)
    
    training_features.append(features)

training_data = np.array(training_features, dtype=np.float32)

print(f"   Generated: {len(training_data)} transactions")
print(f"   Feature range: [{training_data.min():.2f}, {training_data.max():.2f}]")
print(f"   Feature mean: {training_data.mean():.4f}, std: {training_data.std():.4f}")

# Preprocess with StandardScaler
print("\n[2] Fitting StandardScaler...")
scaler = StandardScaler()
training_data_scaled = scaler.fit_transform(training_data)

print(f"   Scaled range: [{training_data_scaled.min():.2f}, {training_data_scaled.max():.2f}]")
print(f"   Scaled mean: {training_data_scaled.mean():.4f}, std: {training_data_scaled.std():.4f}")

# Split data
train_data, val_data = train_test_split(
    training_data_scaled,
    test_size=0.2,
    random_state=42
)

print(f"   Train: {len(train_data)}, Val: {len(val_data)}")

# Build Autoencoder
print("\n[3] Building Autoencoder (30 -> 20 -> 15 -> 10 -> 15 -> 20 -> 30)...")
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
print("\n[4] Training...")
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

print(f"   Training complete! (epochs: {len(history.history['loss'])})")
print(f"   Final train loss: {history.history['loss'][-1]:.6f}")
print(f"   Final val loss: {history.history['val_loss'][-1]:.6f}")

# Calculate reconstruction errors on validation data
print("\n[5] Calculating reconstruction error statistics...")
val_predictions = autoencoder.predict(val_data, verbose=0)
val_errors = np.mean(np.power(val_data - val_predictions, 2), axis=1)

train_predictions = autoencoder.predict(train_data, verbose=0)
train_errors = np.mean(np.power(train_data - train_predictions, 2), axis=1)

print(f"   Training errors - Mean: {train_errors.mean():.6f}, Std: {train_errors.std():.6f}")
print(f"   Validation errors - Mean: {val_errors.mean():.6f}, Std: {val_errors.std():.6f}")

# Calculate threshold (mean + 2*std = ~95th percentile)
reconstruction_threshold = val_errors.mean() + 2 * val_errors.std()
print(f"   Anomaly threshold (mean + 2*std): {reconstruction_threshold:.6f}")

# Save models
print("\n[6] Saving models...")
timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

model_path = f"autoencoder_model_simulator_v{timestamp}.keras"
autoencoder.save(model_path, save_format='keras')
print(f"   Model: {model_path}")

scaler_path = f"autoencoder_scaler_simulator_v{timestamp}.pkl"
joblib.dump(scaler, scaler_path)
print(f"   Scaler: {scaler_path}")

metadata = {
    'timestamp': timestamp,
    'reconstruction_threshold': float(reconstruction_threshold),
    'train_error_mean': float(train_errors.mean()),
    'train_error_std': float(train_errors.std()),
    'val_error_mean': float(val_errors.mean()),
    'val_error_std': float(val_errors.std()),
    'feature_description': '30 features: PCA 0-27, Time 28, Normalized Amount 29',
}

metadata_path = f"autoencoder_metadata_simulator_v{timestamp}.pkl"
joblib.dump(metadata, metadata_path)
print(f"   Metadata: {metadata_path}")

# Update symlinks
print("\n[7] Updating active model links...")

# Remove old symlinks
for filename in ['autoencoder_model.keras', 'autoencoder_model.h5']:
    if os.path.exists(filename):
        try:
            os.remove(filename)
        except:
            pass

# Create new symlinks
try:
    os.symlink(model_path, "autoencoder_model.keras")
    os.symlink(scaler_path, "autoencoder_scaler.pkl")
    os.symlink(metadata_path, "autoencoder_metadata.pkl")
    print("   Symlinks updated!")
except Exception as e:
    print(f"   Warning: Could not create symlinks: {e}")

print("\n" + "="*70)
print("[SUCCESS] Autoencoder Retrained!")
print("="*70)
print(f"\nKey Metrics:")
print(f"  Reconstruction Threshold: {reconstruction_threshold:.6f}")
print(f"  Validation Error Mean: {val_errors.mean():.6f}")
print(f"  Model Version: {timestamp}")
print(f"\nRestart backend to use new model:")
print(f"  uvicorn app.main:app --reload\n")
