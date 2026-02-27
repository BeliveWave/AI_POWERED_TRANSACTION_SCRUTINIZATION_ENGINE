from sqlalchemy import create_engine, text
from app.core.config import settings

# Create engine
engine = create_engine(settings.DATABASE_URL)

def add_columns():
    with engine.connect() as conn:
        try:
            # Add card_type column
            conn.execute(text("ALTER TABLE customers ADD COLUMN IF NOT EXISTS card_type VARCHAR;"))
            print("Added card_type column.")
            
            # Add card_last_four column
            conn.execute(text("ALTER TABLE customers ADD COLUMN IF NOT EXISTS card_last_four VARCHAR;"))
            print("Added card_last_four column.")

            # Add is_frozen column
            conn.execute(text("ALTER TABLE customers ADD COLUMN IF NOT EXISTS is_frozen BOOLEAN DEFAULT FALSE;"))
            print("Added is_frozen column.")

            # Add is_active column
            conn.execute(text("ALTER TABLE customers ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;"))
            print("Added is_active column.")
            
            conn.commit()
            print("✅ Migration successful!")
            
        except Exception as e:
            print(f"❌ Migration failed: {e}")

if __name__ == "__main__":
    add_columns()
