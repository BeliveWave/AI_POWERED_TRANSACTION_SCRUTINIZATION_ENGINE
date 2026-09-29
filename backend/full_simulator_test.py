#!/usr/bin/env python3
"""
Full Simulator - Graph Fraud Ring Testing
"""

import os
import requests
import random
import time

API_URL = "http://localhost:8000/api/predict"

print("\n[*] FULL SIMULATOR - Graph Fraud Ring Testing")
print("="*60 + "\n")

# Fraud Ring setup
# 3 customers colluding, sharing 1 IP address and 1 Device
FRAUD_RING_CUSTOMERS = [1, 2, 3]
FRAUD_RING_IP = "192.168.100.99"
FRAUD_RING_DEVICE = "dev_iphone_12_jailbroken_xyz"

for i in range(20):
    amount_lkr = round(random.uniform(500.0, 15000.0), 2)
    customer_id = random.randint(1, 6)
    
    # Inject fraud ring logic (20% chance)
    is_fraud_ring = random.random() < 0.20
    
    if is_fraud_ring:
        customer_id = random.choice(FRAUD_RING_CUSTOMERS)
        ip_address = FRAUD_RING_IP
        device_fingerprint = FRAUD_RING_DEVICE
        shipping_address = "123 Fraud Lane, Colombo"
        amount_lkr = 45000.0 # High value
        fraud_label = "[RING]"
    else:
        ip_address = f"10.0.{random.randint(1, 255)}.{random.randint(1, 255)}"
        device_fingerprint = f"dev_{random.randint(1000, 9999)}"
        shipping_address = f"{random.randint(1, 999)} Normal St"
        fraud_label = ""
    
    payload = {
        "metadata": {
            "customer_id": customer_id,
            "merchant": random.choice(["Amazon", "Netflix", "Uber", "Daraz", "Target"]),
            "amount": amount_lkr,
            "merchant_category_code": "0000",
            "merchant_country_code": "US" if not is_fraud_ring else "NG",
            "currency": "LKR",
            "transaction_type": "PURCHASE",
            "pos_entry_mode": "05",
            "terminal_id": f"TERM_{random.randint(100, 200)}",
            "ip_address": ip_address,
            "device_fingerprint": device_fingerprint,
            "shipping_address": shipping_address
        }
    }
    
    try:
        response = requests.post(API_URL, json=payload, timeout=5)
        if response.status_code == 202:
            result = response.json()
            status = result.get('status', 'N/A')
            print(f"Txn {i+1:02d} {fraud_label:<7} | Cust {customer_id} | LKR {amount_lkr:>8.2f} | {status}")
        else:
            print(f"Txn {i+1:02d}        [ERROR] {response.status_code} {response.text}")
    except Exception as e:
        print(f"Txn {i+1:02d}        [FAIL] {e}")
    
    time.sleep(0.5)

print("\n" + "="*60)
print("[*] Simulation complete!\n")

