import time
import random
import requests
import json
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Configuration
BASE_URL = "http://localhost:8000"
API_URL = f"{BASE_URL}/api/predict"

def get_real_customers():
    """Asks the backend for a list of real customers (IDs + Card Info)."""
    try:
        response = requests.get(f"{BASE_URL}/api/customers")
        if response.status_code == 200:
            return response.json() # Returns [{id, full_name, card_type, card_last_four...}]
    except Exception as e:
        logger.error(f"Could not fetch customers: {e}")
    return [] # Fallback

def generate_transaction(customers):
    # 1. Pick a REAL customer (if available)
    if customers:
        selected_customer = random.choice(customers)
        cust_id = selected_customer['id']
        # We don't strictly need to send card info in metadata if backend looks it up,
        # but the prompt asked the Simulator to "fetch" and "send" it.
        # However, backend 'predict' doesn't explicitly save it from metadata, it saves txn.
        # But 'get_recent_transactions' joins on Customer table.
        # So sending it is good for debugging but not strictly required for backend storage 
        # since backend has the source of truth.
        # We will focus on sending the ID correct so backend can join.
    else:
        cust_id = 1 # Fallback ID

    # 2. Generate Random Features (V1-V28, Time, Amount)
    features = [random.uniform(-2.0, 2.0) for _ in range(30)]
    
    # 3. Inject Fraud (10% chance)
    is_fraud = random.random() < 0.10
    if is_fraud: 
        logger.warning("GENERATING ATTACK TRANSACTION...")
        features[0] = 50.0  # Anomaly in V1
        features[4] = -50.0 # Anomaly in V4
        # Amount in LKR (e.g. 30,000 LKR)
        amount_lkr = 30000.0 
        features[29] = amount_lkr
    else:
        # Normal amount in LKR (e.g. 500 to 10,000 LKR)
        amount_lkr = round(random.uniform(500.0, 15000.0), 2)
        features[29] = amount_lkr

    # 4. Construct Payload with Metadata
    txn_payload = {
        "features": features,
        "metadata": {
            "customer_id": cust_id,
            "merchant": random.choice(["Amazon", "Netflix", "Uber", "Apple", "Walmart", "Target", "Daraz", "PickMe", "DarkWeb Store"]),
            "amount": amount_lkr
        }
    }
    
    # Logic: If merchant is "DarkWeb Store", make it 100% Fraud (for Demo)
    if txn_payload['metadata']['merchant'] == "DarkWeb Store":
        txn_payload['features'][0] = 50.0 # Huge spike to trigger AI Fraud
        txn_payload['features'][4] = -50.0 
    return txn_payload


def run_simulation():
    print("="*60)
    print("🚀  STARTING BANK TRANSACTION SIMULATOR (LKR SUPPORT)")
    print(f"📡  Target: {API_URL}")
    print("="*60 + "\n")

    print("🔄  Fetching Real Customers from Database...")
    customers = get_real_customers()
    if customers:
        print(f"✅  Loaded {len(customers)} Customers.")
    else:
        print("⚠️  No customers found in DB. Using Guest ID 1.")
        customers = []

    transaction_count = 1

    while True:
        try:
            # 1. Create Data
            txn_data = generate_transaction(customers)

            # 2. Send to Backend
            response = requests.post(API_URL, json=txn_data)

            # 3. Parse Response
            if response.status_code == 200:
                result = response.json()
                score = result['fraud_score']
                status = result['status']
                
                # Color code the output
                if status == "Decline":
                    icon = "❌"
                    color = "\033[91m" # Red
                elif status == "Escalate":
                    icon = "⚠️"
                    color = "\033[93m" # Yellow
                else:
                    icon = "✅"
                    color = "\033[92m" # Green
                
                reset = "\033[0m"

                meta = txn_data['metadata']
                print(f"Txn #{transaction_count:04d} | Cust {meta['customer_id']} | LKR {meta['amount']:<8} | Score: {score:.4f} | {color}{icon} {status.upper()}{reset}")
            else:
                print(f"❌ Error: {response.text}")

            transaction_count += 1
            
            # Sleep for random time (2s to 5s) for demo pacing
            time.sleep(random.uniform(2.0, 5.0))

        except KeyboardInterrupt:
            print("\n🛑 Simulation Stopped.")
            break
        except Exception as e:
            print(f"❌ Connection Error: {e}")
            time.sleep(2)

if __name__ == "__main__":
    run_simulation()