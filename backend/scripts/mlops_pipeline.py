import os
import sys
import time
import pandas as pd
from sqlalchemy import create_engine
import subprocess

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app.core.config import settings

def check_data_drift():
    print("Checking for Data Drift...")
    engine = create_engine(settings.DATABASE_URL)
    
    # Query recent transactions
    query = "SELECT amount FROM transactions ORDER BY timestamp DESC LIMIT 1000"
    try:
        df_recent = pd.read_sql(query, engine)
        if len(df_recent) < 100:
            print("Not enough recent transactions to check drift.")
            return False
            
        recent_mean_amount = df_recent['amount'].mean()
        
        # Load baseline data
        data_path = os.path.join(os.path.dirname(__file__), "..", "historical_transactions.csv")
        df_baseline = pd.read_csv(data_path)
        baseline_mean_amount = df_baseline['amount'].mean()
        
        drift_percentage = abs((recent_mean_amount - baseline_mean_amount) / baseline_mean_amount) * 100
        print(f"Baseline Mean Amount: ${baseline_mean_amount:.2f}")
        print(f"Recent Mean Amount: ${recent_mean_amount:.2f}")
        print(f"Drift: {drift_percentage:.2f}%")
        
        if drift_percentage > 20.0:
            print("⚠️ DATA DRIFT DETECTED! Threshold of 20% exceeded.")
            return True
        else:
            print("✅ Data distribution is stable.")
            return False
            
    except Exception as e:
        print(f"Error checking drift: {e}")
        return False

def trigger_retraining():
    print("\n" + "="*50)
    print("🚀 INITIATING AUTOMATED RETRAINING PIPELINE")
    print("="*50)
    
    script_path = os.path.join(os.path.dirname(__file__), "train_realistic_models.py")
    
    try:
        subprocess.run(["python", script_path], check=True)
        print("✅ Retraining pipeline completed successfully.")
        print("Shadow model (fraud_model_shadow.pkl) deployed for testing.")
    except subprocess.CalledProcessError as e:
        print(f"❌ Retraining pipeline failed: {e}")

if __name__ == "__main__":
    force = "--force-retrain" in sys.argv
    if force:
        print("Force retrain flag detected.")
        trigger_retraining()
    else:
        while True:
            has_drift = check_data_drift()
            if has_drift:
                trigger_retraining()
                
            print("\nSleeping for 1 hour before next check...")
            time.sleep(3600)
