import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

DB_URL = os.getenv("DATABASE_URL")

# Extract connection parameters from URL
import urllib.parse
result = urllib.parse.urlparse(DB_URL)
username = result.username
password = result.password
database = result.path[1:]
hostname = result.hostname
port = result.port

print(f"Connecting to {database} at {hostname}:{port}...")

try:
    conn = psycopg2.connect(
        database=database,
        user=username,
        password=password,
        host=hostname,
        port=port
    )
    conn.autocommit = True
    cursor = conn.cursor()

    columns_to_add = [
        "merchant_id VARCHAR",
        "merchant_category_code VARCHAR",
        "merchant_country_code VARCHAR",
        "billing_amount DOUBLE PRECISION",
        "currency VARCHAR DEFAULT 'USD'",
        "transaction_type VARCHAR",
        "pos_entry_mode VARCHAR",
        "terminal_id VARCHAR",
        "moto_eci_indicator VARCHAR",
        "three_d_secure VARCHAR"
    ]

    for col in columns_to_add:
        col_name = col.split()[0]
        try:
            cursor.execute(f"ALTER TABLE transactions ADD COLUMN {col};")
            print(f"Added column: {col_name}")
        except psycopg2.errors.DuplicateColumn:
            print(f"Column already exists: {col_name}")
            
    print("Migration complete!")
    
except Exception as e:
    print(f"Migration failed: {e}")
finally:
    if 'conn' in locals():
        conn.close()
