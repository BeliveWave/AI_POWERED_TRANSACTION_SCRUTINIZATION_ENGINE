import os
from sqlalchemy import create_engine, text
from app.core.config import settings

def add_shadow_column():
    engine = create_engine(settings.DATABASE_URL)
    with engine.connect() as connection:
        try:
            print("Adding shadow_score column to transactions table...")
            connection.execute(text("ALTER TABLE transactions ADD COLUMN IF NOT EXISTS shadow_score FLOAT"))
            connection.commit()
            print("shadow_score column added successfully.")
        except Exception as e:
            print(f"Error adding shadow_score column: {e}")

if __name__ == "__main__":
    add_shadow_column()
