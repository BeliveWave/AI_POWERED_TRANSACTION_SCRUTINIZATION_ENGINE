import os
from sqlalchemy import create_engine, text
from app.core.config import settings

def add_shap_column():
    engine = create_engine(settings.DATABASE_URL)
    with engine.connect() as connection:
        try:
            print("Adding shap_explanation column to transactions table...")
            connection.execute(text("ALTER TABLE transactions ADD COLUMN IF NOT EXISTS shap_explanation VARCHAR"))
            connection.commit()
            print("shap_explanation column added successfully.")
        except Exception as e:
            print(f"Error adding shap_explanation column: {e}")

if __name__ == "__main__":
    add_shap_column()
