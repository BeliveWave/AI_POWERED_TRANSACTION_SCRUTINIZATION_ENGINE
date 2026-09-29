import os
import time
import random
import requests
import json
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Configuration
BASE_URL = os.environ.get("BASE_URL", "http://localhost:8000")
API_URL = f"{BASE_URL}/api/score"
MAX_TRANSACTIONS = int(os.environ.get("MAX_TRANSACTIONS", "0"))

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
    if customers:
        selected_customer = random.choice(customers)
        cust_id = selected_customer['id']
    else:
        cust_id = 1 

    # Normal Transaction Logic
    amount = random.uniform(10.0, 200.0)
    mcc = random.choice(["5411", "5812", "5541", "4511", "5999", "5732", "7999", "4722"])
    merchant = f"Merchant_{random.randint(1, 1000)}"
    country = "LK"
    pos_mode = random.choices(["01", "05", "81", "90"], weights=[0.05, 0.6, 0.3, 0.05])[0]
    
    # Inject Fraud (10% chance)
    is_fraud = random.random() < 0.10
    if is_fraud: 
        logger.warning("GENERATING ATTACK TRANSACTION (Fraud Simulation)...")
        fraud_type = random.choice(["high_amount", "foreign_country", "ecommerce_burst"])
        
        if fraud_type == "high_amount":
            amount = amount * random.uniform(10, 50)
        elif fraud_type == "foreign_country":
            country = random.choice(["US", "GB", "AU", "SG"])
            pos_mode = "05" 
        elif fraud_type == "ecommerce_burst":
            pos_mode = "81" 
            mcc = "5732" 
            amount = random.uniform(1000, 5000)

    txn_payload = {
        "metadata": {
            "customer_id": cust_id,
            "merchant": merchant,
            "merchant_category_code": mcc,
            "merchant_country_code": country,
            "amount": round(amount, 2),
            "currency": "USD",
            "transaction_type": "PURCHASE",
            "pos_entry_mode": pos_mode,
            "terminal_id": f"TERM_{random.randint(10000, 99999)}",
            "moto_eci_indicator": "02" if pos_mode == "81" else "00",
            "three_d_secure": "N" if (pos_mode == "81" and random.random() > 0.5) else "Y"
        }
    }
    
    return txn_payload


def run_simulation():
    print("="*60)
    print("[*] STARTING BANK TRANSACTION SIMULATOR (LKR SUPPORT)")
    print(f"[*] Target: {API_URL}")
    print("="*60 + "\n")

    print("[*] Fetching Real Customers from Database...")
    customers = get_real_customers()
    if customers:
        print(f"[OK] Loaded {len(customers)} Customers.")
    else:
        print("[!] No customers found in DB. Using Guest ID 1.")
        customers = []

    transaction_count = 1

    while True:
        try:
            # 1. Create Data
            txn_data = generate_transaction(customers)

            # 2. Send to Backend
            response = requests.post(API_URL, json=txn_data)

            # 3. Parse Response
            meta = txn_data['metadata']
            if response.status_code == 200:
                result = response.json()
                status = result.get('status', 'Unknown')
                score = result.get('fraud_score', 0.0)
                proc_ms = result.get('processing_time_ms', 0.0)
                reason = result.get('decision_reason', '')
                
                reset = "\033[0m"
                if status == "Approve":
                    color = "\033[92m"  # Green
                    icon = "[+]"
                elif status == "Escalate":
                    color = "\033[93m"  # Yellow
                    icon = "[!]"
                else:
                    color = "\033[91m"  # Red
                    icon = "[X]"
                    
                print(f"Txn #{transaction_count:04d} | Cust {meta['customer_id']} | USD {meta['amount']:<7} | {color}{icon} {status.upper()} (Score: {score:.3f}, {proc_ms:.1f}ms){reset} | {reason}")
            elif response.status_code == 202:
                result = response.json()
                status = result.get('status', 'Queued')
                txn_id = result.get('decision_reason', '').split(': ')[-1].replace(')', '')
                
                color = "\033[96m" # Cyan
                icon = "[~]"
                reset = "\033[0m"

                print(f"Txn #{transaction_count:04d} | Cust {meta['customer_id']} | USD {meta['amount']:<7} | {color}{icon} ASYNC {status.upper()} (ID: {txn_id}){reset}")
            else:
                print(f"[X] Error {response.status_code}: {response.text}")

            if MAX_TRANSACTIONS > 0 and transaction_count >= MAX_TRANSACTIONS:
                print(f"\n[OK] Reached batch limit of {MAX_TRANSACTIONS} transactions. Simulation completed successfully.")
                break

            transaction_count += 1
            
            # Sleep for demo pacing (custom delay if set, else 2-5s)
            delay = float(os.environ.get("SIMULATOR_DELAY", "-1"))
            if delay >= 0:
                time.sleep(delay)
            else:
                time.sleep(random.uniform(2.0, 5.0))

        except KeyboardInterrupt:
            print("\n[*] Simulation Stopped.")
            break
        except Exception as e:
            print(f"[X] Connection Error: {e}")
            time.sleep(2)

if __name__ == "__main__":
    run_simulation()