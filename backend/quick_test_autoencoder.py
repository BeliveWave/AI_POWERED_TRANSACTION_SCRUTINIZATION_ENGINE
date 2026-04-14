#!/usr/bin/env python3
"""
Quick test: Generate 10 transactions and see Autoencoder scores
"""

import requests
import random
import json
import time

API_URL = "http://localhost:8000/api/predict"

print("\n[*] Quick Autoencoder Test")
print("="*60)

# Generate 5 normal and 2 fraud transactions
for i in range(7):
    features = [random.uniform(-2.0, 2.0) for _ in range(30)]
    
    # Normalize amount like simulator does
    if i >= 5:  # Fraud
        print(f"\n[FRAUD] Transaction {i+1}")
        amount_lkr = 30000.0
        amount_usd = 30000.0 / 300.0
        features[0] = 50.0
        features[4] = -50.0
    else:
        amount_lkr = random.uniform(500.0, 15000.0)
        amount_usd = amount_lkr / 300.0
    
    normalized_amount = (amount_usd - 25.0) / 20.0
    features[29] = normalized_amount
    
    payload = {
        "features": features,
        "metadata": {
            "customer_id": 1,
            "merchant": "TestMerchant",
            "amount": amount_lkr
        }
    }
    
    try:
        response = requests.post(API_URL, json=payload, timeout=5)
        if response.status_code == 200:
            result = response.json()
            print(f"  Amount: ${amount_usd:.2f} (LKR {amount_lkr:.2f})")
            print(f"  Score: {result.get('fraud_score', 'N/A'):.4f}")
            print(f"  Status: {result.get('status', 'N/A')}")
        else:
            print(f"  Error: {response.status_code}")
    except Exception as e:
        print(f"  Exception: {e}")
    
    time.sleep(1)

print("\n" + "="*60)
print("[*] Test complete!\n")
