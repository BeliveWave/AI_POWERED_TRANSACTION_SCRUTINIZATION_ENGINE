import os
import pandas as pd
import numpy as np
import joblib
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, LabelEncoder
from xgboost import XGBClassifier
import mlflow
import mlflow.xgboost
import tensorflow as tf
from tensorflow.keras.models import Model # type: ignore
from tensorflow.keras.layers import Input, Dense # type: ignore

def main():
    print("Starting Feature Engineering & Model Training...")
    
    # 1. Load Data
    data_path = os.path.join(os.path.dirname(__file__), "..", "historical_transactions.csv")
    if not os.path.exists(data_path):
        print(f"Error: {data_path} not found.")
        return
        
    df = pd.read_csv(data_path)
    df['timestamp'] = pd.to_datetime(df['timestamp'])
    df = df.sort_values(by=['customer_id', 'timestamp']).reset_index(drop=True)
    
    print(f"Loaded {len(df)} transactions.")
    
    # 2. Feature Engineering
    print("Performing Feature Engineering...")
    
    # Time-based features
    df['hour_of_day'] = df['timestamp'].dt.hour
    
    # Velocity (Transactions in last 1 hour)
    # We group by customer and use a rolling window of 1 hour on the timestamp
    print("   - Calculating Velocity (1h window)...")
    # Set timestamp as index for rolling
    df_time_indexed = df.set_index('timestamp')
    df['velocity_1h'] = df_time_indexed.groupby('customer_id')['amount'].transform(lambda x: x.rolling('1h').count()).values
    # Note: rolling includes the current transaction, so minimum velocity is 1. We'll subtract 1 so 0 means no previous txns.
    df['velocity_1h'] = df['velocity_1h'] - 1 

    # Geolocation shifts (simplification: is foreign country)
    # Estimate 'home_country' as the most frequent country for the customer
    print("   - Calculating Geolocation Shifts...")
    home_countries = df.groupby('customer_id')['merchant_country_code'].agg(lambda x: x.value_counts().index[0])
    df['home_country'] = df['customer_id'].map(home_countries)
    df['is_foreign'] = (df['merchant_country_code'] != df['home_country']).astype(int)
    
    # Merchant Category Frequency (simplification: encoding it)
    print("   - Encoding Categoricals...")
    encoders = {}
    cat_columns = ['merchant_category_code', 'pos_entry_mode', 'currency', 'moto_eci_indicator', 'three_d_secure']
    
    for col in cat_columns:
        # Convert all to strings and handle NaN
        df[col] = df[col].astype(str).fillna("UNKNOWN")
        le = LabelEncoder()
        df[col + '_encoded'] = le.fit_transform(df[col])
        encoders[col] = le
        
    # Define final feature list
    features = [
        'amount', 
        'hour_of_day', 
        'velocity_1h', 
        'is_foreign',
        'merchant_category_code_encoded',
        'pos_entry_mode_encoded',
        'currency_encoded',
        'moto_eci_indicator_encoded',
        'three_d_secure_encoded'
    ]
    
    X = df[features].values
    y = df['is_fraud'].values
    
    # 3. Train XGBoost
    print("\nTraining XGBoost Model (Supervised)...")
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
    
    # Configure MLflow
    mlflow.set_experiment("Fraud_Detection_XGBoost")
    
    with mlflow.start_run():
        xgb_params = {
            "n_estimators": 100,
            "max_depth": 6,
            "learning_rate": 0.1,
            "scale_pos_weight": (len(y_train) - sum(y_train)) / sum(y_train),
            "random_state": 42
        }
        
        xgb_model = XGBClassifier(**xgb_params)
        xgb_model.fit(X_train, y_train)
        
        train_acc = xgb_model.score(X_train, y_train)
        test_acc = xgb_model.score(X_test, y_test)
        print(f"   XGBoost Train Acc: {train_acc:.4f} | Test Acc: {test_acc:.4f}")
        
        # Log to MLflow
        mlflow.log_params(xgb_params)
        mlflow.log_metrics({"train_accuracy": train_acc, "test_accuracy": test_acc})
        mlflow.xgboost.log_model(xgb_model, "fraud_xgboost_model")
        
        # Save XGBoost as SHADOW model
        joblib.dump(xgb_model, os.path.join(os.path.dirname(__file__), "..", "fraud_model_shadow.pkl"))
        joblib.dump(encoders, os.path.join(os.path.dirname(__file__), "..", "feature_encoders.pkl"))
        print("   ✅ Shadow Model Saved!")
    
    # 4. Train Autoencoder
    print("\nTraining Autoencoder Model (Unsupervised Anomaly Detection)...")
    # Autoencoder is trained ONLY on NORMAL transactions
    normal_txns = df[df['is_fraud'] == 0][features].values
    X_ae_train, X_ae_val = train_test_split(normal_txns, test_size=0.2, random_state=42)
    
    scaler = StandardScaler()
    X_ae_train_scaled = scaler.fit_transform(X_ae_train)
    X_ae_val_scaled = scaler.transform(X_ae_val)
    
    input_dim = len(features)
    input_layer = Input(shape=(input_dim,))
    encoder = Dense(8, activation="relu")(input_layer)
    encoder = Dense(4, activation="relu")(encoder)
    decoder = Dense(8, activation="relu")(encoder)
    decoder = Dense(input_dim, activation="linear")(decoder)
    
    autoencoder = Model(inputs=input_layer, outputs=decoder)
    autoencoder.compile(optimizer='adam', loss='mse')
    
    history = autoencoder.fit(
        X_ae_train_scaled, X_ae_train_scaled,
        epochs=10, # Keep it small for quick training
        batch_size=256,
        shuffle=True,
        validation_data=(X_ae_val_scaled, X_ae_val_scaled),
        verbose=1
    )
    
    # Calculate Reconstruction Threshold (95th percentile of validation error)
    reconstructions = autoencoder.predict(X_ae_val_scaled)
    mse = np.mean(np.power(X_ae_val_scaled - reconstructions, 2), axis=1)
    threshold = float(np.percentile(mse, 95))
    
    print(f"   Autoencoder Threshold: {threshold:.6f}")
    
    # Save Autoencoder artifacts
    autoencoder.save(os.path.join(os.path.dirname(__file__), "..", "autoencoder_model.keras"))
    joblib.dump(scaler, os.path.join(os.path.dirname(__file__), "..", "autoencoder_scaler.pkl"))
    joblib.dump({"reconstruction_threshold": threshold}, os.path.join(os.path.dirname(__file__), "..", "autoencoder_metadata.pkl"))
    
    print("\nAll models trained and saved successfully!")

if __name__ == "__main__":
    main()
