import os
import sys

# Add backend directory to sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import create_engine, text
from app.core.config import settings

def main():
    engine = create_engine(settings.DATABASE_URL)
    
    commands = [
        "ALTER TABLE transactions ADD COLUMN IF NOT EXISTS ip_address VARCHAR;",
        "ALTER TABLE transactions ADD COLUMN IF NOT EXISTS device_fingerprint VARCHAR;",
        "ALTER TABLE transactions ADD COLUMN IF NOT EXISTS shipping_address VARCHAR;",
        "ALTER TABLE transactions ADD COLUMN IF NOT EXISTS gnn_score FLOAT;"
    ]
    
    try:
        with engine.begin() as connection:
            for cmd in commands:
                connection.execute(text(cmd))
                print(f"Executed: {cmd}")
        print("\n✅ Database schema updated successfully for Phase 5 (Graph fields).")
    except Exception as e:
        print(f"\n❌ Failed to update schema: {e}")

if __name__ == "__main__":
    main()
