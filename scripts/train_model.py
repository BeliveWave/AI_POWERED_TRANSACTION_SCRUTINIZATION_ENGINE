import pandas as pd
import xgboost as xgb
import joblib
from sklearn.model_selection import train_test_split
from sklearn.datasets import make_classification

# 1. Simulate "Historical Data" (Or load 'creditcard.csv' if you have it)
# This creates a dummy dataset that looks like the real Kaggle one (V1-V28 columns)
X, y = make_classification(n_samples=10000, n_features=30, n_classes=2, weights=[0.99, 0.01], random_state=42)

# 2. Train the XGBoost Model (The Standard Industry Model)
model = xgb.XGBClassifier(use_label_encoder=False, eval_metric='logloss')
model.fit(X, y)

# 3. Save the "Brain" to a file
joblib.dump(model, 'fraud_model.pkl')
print("✅ Model saved as 'fraud_model.pkl'. Move this file to your backend folder!")