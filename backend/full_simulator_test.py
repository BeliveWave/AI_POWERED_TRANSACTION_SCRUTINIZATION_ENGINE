#!/usr/bin/env python3
"""
Full Simulator - 30 transactions to test hybrid model
"""

import os
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'

import requests
import random
import time

API_URL = "http://localhost:8000/api/predict"

print("\n[*] FULL SIMULATOR - 30 Transactions")
print("="*60 + "\n")

for i in range(30):
    # Generate features
    features = [random.uniform(-2.0, 2.0) for _ in range(30)]
    
    # Generate amount
    amount_lkr = round(random.uniform(500.0, 15000.0), 2)
    amount_usd = amount_lkr / 300.0
    normalized_amount = (amount_usd - 25.0) / 20.0
    features[29] = normalized_amount
    
    # Inject fraud (10% chance)
    is_fraud = random.random() < 0.10
    if is_fraud:
        features[0] = 50.0
        features[4] = -50.0
        amount_lkr = 30000.0
        amount_usd = 100.0
        normalized_amount = (amount_usd - 25.0) / 20.0
        features[29] = normalized_amount
        fraud_label = "[FRAUD]"
    else:
        fraud_label = ""
    
    payload = {
        "features": features,
        "metadata": {
            "customer_id": random.randint(1, 6),
            "merchant": random.choice(["Amazon", "Netflix", "Uber", "Daraz", "Target"]),
            "amount": amount_lkr
        }
    }
    
    try:
        response = requests.post(API_URL, json=payload, timeout=5)
        if response.status_code == 200:
            result = response.json()
            status = result.get('status', 'N/A')
            score = result.get('fraud_score', 0.0)
            
            # Format output
            status_mark = "[X]" if status == "Decline" else "[!]" if status == "Escalate" else "[+]"
            print(f"Txn {i+1:02d} {fraud_label:<7} | LKR {amount_lkr:>8.2f} | Score {score:.4f} | {status_mark} {status}")
        else:
            print(f"Txn {i+1:02d}        [ERROR]")
    except Exception as e:
        print(f"Txn {i+1:02d}        [FAIL] {e}")
    
    time.sleep(0.5)

print("\n" + "="*60)
print("[*] Simulation complete!\n")
