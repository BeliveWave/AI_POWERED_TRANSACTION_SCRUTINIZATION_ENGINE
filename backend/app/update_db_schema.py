import os
from sqlalchemy import create_engine, text
from app.core.config import settings

def update_schema():
    engine = create_engine(settings.DATABASE_URL)
    
    with engine.connect() as connection:
        # 1. Add columns to users table
        try:
            print("Adding columns to users table...")
            connection.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS otp_secret VARCHAR"))
            connection.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_number VARCHAR"))
            connection.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS notification_preferences VARCHAR DEFAULT '{}'"))
            connection.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS is_2fa_enabled BOOLEAN DEFAULT FALSE"))
            connection.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_otp VARCHAR"))
            connection.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_otp_expires_at TIMESTAMP WITH TIME ZONE"))
            print("Columns added successfully.")
        except Exception as e:
            print(f"Error adding users columns: {e}")

        # 3. Add columns to transactions table
        try:
            print("Adding columns to transactions table...")
            connection.execute(text("ALTER TABLE transactions ADD COLUMN IF NOT EXISTS processing_time_ms FLOAT"))
            print("Transactions columns added successfully.")
        except Exception as e:
            print(f"Error adding transactions columns: {e}")

        # 2. Create system_config table
        try:
            print("Creating system_config table...")
            connection.execute(text("""
                CREATE TABLE IF NOT EXISTS system_config (
                    key VARCHAR PRIMARY KEY,
                    value VARCHAR,
                    description VARCHAR
                )
            """))
            print("system_config table created successfully.")
        except Exception as e:
            print(f"Error creating system_config table: {e}")
            
        connection.commit()

if __name__ == "__main__":
    update_schema()
