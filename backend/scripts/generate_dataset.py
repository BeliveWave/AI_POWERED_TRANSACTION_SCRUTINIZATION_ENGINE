import os
import random
import pandas as pd
import numpy as np
from datetime import datetime, timedelta

def generate_synthetic_data(num_customers=1000, transactions_per_customer_range=(5, 100), fraud_ratio=0.03):
    print("Generating synthetic dataset based on BRD (ISO 8583 fields)...")
    
    # 1. Define Categories (ISO 8583)
    merchant_categories = {
        "5411": "Grocery Stores",
        "5812": "Restaurants",
        "5541": "Gas Stations",
        "4511": "Airlines",
        "5999": "Misc Retail",
        "5732": "Electronics",
        "7999": "Entertainment",
        "4722": "Travel Agencies"
    }
    
    countries = ["US", "GB", "LK", "AU", "SG", "IN", "CA"]
    base_country = "LK" # Assuming primary country is LK
    
    pos_entry_modes = ["01", "05", "81", "90"] # Manual, Chip, E-commerce, Magstripe
    currencies = ["USD", "LKR", "EUR", "GBP"]
    
    transactions = []
    start_date = datetime.now() - timedelta(days=90) # Last 90 days
    
    for customer_id in range(1, num_customers + 1):
        num_txns = random.randint(transactions_per_customer_range[0], transactions_per_customer_range[1])
        
        # Customer Profile
        home_country = random.choice(["LK", "LK", "LK", "US", "GB"]) # 60% LK
        favorite_categories = random.sample(list(merchant_categories.keys()), 3)
        base_spending = random.uniform(10.0, 500.0)
        
        current_time = start_date + timedelta(days=random.uniform(0, 5))
        
        for _ in range(num_txns):
            # Time progression (usually spaced out, sometimes bursts)
            current_time += timedelta(minutes=random.expovariate(1/1440)) # Average 1 per day
            
            # Normal Transaction Logic
            is_fraud = 0
            amount = abs(np.random.normal(base_spending, base_spending/2))
            mcc = random.choices(
                list(merchant_categories.keys()), 
                weights=[0.8 if k in favorite_categories else 0.2 for k in merchant_categories.keys()]
            )[0]
            country = home_country
            pos_mode = random.choices(pos_entry_modes, weights=[0.05, 0.6, 0.3, 0.05])[0]
            
            # Inject Fraud
            if random.random() < fraud_ratio:
                is_fraud = 1
                fraud_type = random.choice(["high_amount", "foreign_country", "ecommerce_burst"])
                
                if fraud_type == "high_amount":
                    amount = amount * random.uniform(5, 20)
                elif fraud_type == "foreign_country":
                    country = random.choice([c for c in countries if c != home_country])
                    pos_mode = "05" # Chip in foreign country
                elif fraud_type == "ecommerce_burst":
                    pos_mode = "81" # E-commerce
                    mcc = "5732" # Electronics
                    amount = random.uniform(500, 3000)
            
            # Add Transaction
            transactions.append({
                "customer_id": customer_id,
                "timestamp": current_time.strftime("%Y-%m-%d %H:%M:%S"),
                "merchant_name": f"Merchant_{random.randint(1, 1000)}",
                "merchant_category_code": mcc,
                "merchant_country_code": country,
                "amount": round(amount, 2),
                "currency": random.choices(currencies, weights=[0.2, 0.7, 0.05, 0.05])[0],
                "transaction_type": "PURCHASE",
                "pos_entry_mode": pos_mode,
                "terminal_id": f"TERM_{random.randint(10000, 99999)}",
                "moto_eci_indicator": "02" if pos_mode == "81" else "00",
                "three_d_secure": "N" if (pos_mode == "81" and random.random() > 0.5) else "Y",
                "is_fraud": is_fraud
            })
            
    # Convert to DataFrame
    df = pd.DataFrame(transactions)
    
    # Sort chronologically globally
    df["timestamp"] = pd.to_datetime(df["timestamp"])
    df = df.sort_values(by="timestamp").reset_index(drop=True)
    
    print(f"Generated {len(df)} transactions.")
    print(f"Fraud count: {df['is_fraud'].sum()} ({df['is_fraud'].mean()*100:.2f}%)")
    
    output_path = os.path.join(os.path.dirname(__file__), "..", "historical_transactions.csv")
    df.to_csv(output_path, index=False)
    print(f"Dataset saved to {output_path}")

if __name__ == "__main__":
    generate_synthetic_data(num_customers=5000, transactions_per_customer_range=(10, 50), fraud_ratio=0.05)
