"""
Retraining Runbook — AI-Powered Transaction Scrutinization Engine
==================================================================
Step-by-step procedure for retraining the fraud detection models
on newly labeled data.

WHEN TO RETRAIN:
  - New labeled fraud cases accumulated (recommend: 500+ new positives)
  - Model performance degrading (PR-AUC dropping, FPR rising)
  - New fraud patterns discovered that the current model doesn't capture
  - Monthly scheduled retraining (suggested cadence for active production)

NOTE: Automated scheduling is deferred. This is a manual runbook.
      Wrap in a cron job or GitHub Actions workflow when ready.
"""

# ─────────────────────────────────────────────────────────────────────────────
# STEP-BY-STEP RETRAINING PROCEDURE
# ─────────────────────────────────────────────────────────────────────────────

RETRAINING_RUNBOOK = """
AI-Powered TSE — Model Retraining Runbook
==========================================

ENVIRONMENT SETUP
-----------------
1. Activate the virtual environment:
   Windows: backend\\.venv\\Scripts\\Activate.ps1
   Linux/Mac: source backend/.venv/bin/activate

2. Ensure you are in the backend/ directory:
   cd backend

STEP 1: PREPARE NEW TRAINING DATA
----------------------------------
Required: A CSV file with labeled transactions.
Expected schema (same as historical_transactions.csv):
  - customer_id       (integer)
  - timestamp         (datetime: YYYY-MM-DD HH:MM:SS)
  - merchant_name     (string)
  - merchant_category_code  (string, e.g. "5411")
  - merchant_country_code   (string, ISO 3166-1 alpha-2)
  - amount            (float)
  - currency          (string, ISO 4217)
  - transaction_type  (string, e.g. "PURCHASE")
  - pos_entry_mode    (string, e.g. "05")
  - terminal_id       (string)
  - moto_eci_indicator (string)
  - three_d_secure    (string: "Y" or "N")
  - is_fraud          (integer: 0 = legitimate, 1 = fraud)

If appending to historical data:
  python -c "
  import pandas as pd
  old = pd.read_csv('historical_transactions.csv')
  new = pd.read_csv('path/to/new_labeled_data.csv')
  combined = pd.concat([old, new]).sort_values('timestamp')
  combined.to_csv('historical_transactions.csv', index=False)
  print(f'Combined: {len(combined)} rows, {combined.is_fraud.sum()} fraud')
  "

⚠️  IMPORTANT: Ensure new data uses the same schema. Validate:
  - No null values in is_fraud column
  - timestamp is parseable
  - No duplicate transaction IDs if tracked externally

STEP 2: RUN THE TRAINING SCRIPT
---------------------------------
python scripts/train_realistic_models.py

This script:
  - Loads historical_transactions.csv
  - Engineers velocity, geo, and categorical features
  - Trains XGBoost (supervised) with class-weight balancing
  - Trains Autoencoder (unsupervised) on normal transactions only
  - Saves models to backend/ root:
      fraud_model_shadow.pkl      ← new trained model (shadow mode)
      feature_encoders.pkl        ← updated encoders
      autoencoder_model.keras     ← updated autoencoder
      autoencoder_scaler.pkl      ← updated scaler
      autoencoder_metadata.pkl    ← updated threshold
  - Logs metrics to MLflow

STEP 3: EVALUATE THE SHADOW MODEL
-----------------------------------
python scripts/evaluate_model.py

Review the output carefully. Key thresholds for promotion:
  - PR-AUC >= 0.85  (on held-out test set, temporal split)
  - Recall (fraud) >= 0.80
  - FPR <= 0.05  (no more than 5% of legitimate transactions flagged)

If metrics are worse than the current production model, investigate:
  - Data quality issues (mislabeled transactions)
  - Distribution shift (new fraud patterns differ too much)
  - Feature leakage (check temporal split is honored)

STEP 4: EXTRACT NUMPY AUTOENCODER WEIGHTS (for cloud deployment)
------------------------------------------------------------------
python extract_weights_script.py

This creates autoencoder_weights.pkl for cloud inference without TensorFlow.
Verify: python -c "
from app.services.autoencoder_numpy import load_numpy_autoencoder
import numpy as np
ae, scaler, meta = load_numpy_autoencoder('.')
X = np.zeros((1,9))
err = ae.reconstruction_error(scaler.transform(X))
print('Numpy AE OK, threshold:', meta['reconstruction_threshold'])
"

STEP 5: PROMOTE SHADOW → PRODUCTION
--------------------------------------
After validating shadow model performance:

# Backup current production model
cp fraud_model.pkl fraud_model_backup_$(date +%Y%m%d).pkl

# Promote shadow to production
cp fraud_model_shadow.pkl fraud_model.pkl

# Restart the backend service
# Local:  Ctrl+C then: uvicorn app.main:app --reload --port 8000
# Cloud:  Trigger a Render redeploy (commit + push model files)

STEP 6: VERIFY THE LIVE MODEL
-------------------------------
curl -X POST http://localhost:8000/api/score \\
  -H "Content-Type: application/json" \\
  -d '{
    "metadata": {
      "customer_id": 1,
      "merchant": "Test_Merchant",
      "merchant_category_code": "5411",
      "merchant_country_code": "LK",
      "amount": 50.00,
      "currency": "LKR",
      "transaction_type": "PURCHASE",
      "pos_entry_mode": "05",
      "terminal_id": "TERM_00001",
      "moto_eci_indicator": "00",
      "three_d_secure": "Y"
    }
  }'

Expected: fraud_score < 0.20, status = "Approve"

STEP 7: MONITOR POST-DEPLOYMENT
---------------------------------
For 24-48h after promotion:
  - Watch /api/dashboard/stats for anomalous decline/escalate spikes
  - Compare fraud_score distribution to pre-promotion baseline
  - Check /api/system/health for model inference latency

ROLLBACK PROCEDURE
------------------
If the new model behaves incorrectly:
  cp fraud_model_backup_<date>.pkl fraud_model.pkl
  # Restart backend

MLFLOW TRACKING
---------------
All training runs are logged to MLflow.
View experiments:
  mlflow ui --backend-store-uri sqlite:///mlflow.db
  Open: http://localhost:5000

SCHEDULING (FUTURE)
--------------------
To automate monthly retraining, wrap this runbook in:
  - A GitHub Actions workflow (.github/workflows/retrain.yml)
  - A cron job: 0 2 1 * * cd /app/backend && python scripts/train_realistic_models.py
  - A Celery beat task
Currently deferred — manual runbook is sufficient for the demo phase.
"""

if __name__ == "__main__":
    print(RETRAINING_RUNBOOK)
