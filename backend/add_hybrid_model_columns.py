"""
Database Migration: Add Hybrid Model Columns to Transactions Table
===================================================================

This script adds columns to the transactions table to store:
- XGBoost fraud score (known fraud patterns)
- Autoencoder anomaly score (zero-day detection)
- Reconstruction error (raw anomaly metric)

These columns enable explainability and model monitoring.

Usage:
    python add_hybrid_model_columns.py
"""

from sqlalchemy import create_engine, text
from app.core.config import settings

print("\n" + "="*70)
print("🔧 DATABASE MIGRATION: HYBRID MODEL COLUMNS")
print("="*70)

engine = create_engine(settings.DATABASE_URL)

def add_hybrid_columns():
    """Add new columns to transactions table for hybrid model tracking"""
    
    columns_to_add = [
        ("xgboost_score", "FLOAT DEFAULT NULL", "XGBoost fraud probability"),
        ("autoencoder_score", "FLOAT DEFAULT NULL", "Autoencoder anomaly score"),
        ("reconstruction_error", "FLOAT DEFAULT NULL", "Raw reconstruction error from autoencoder"),
    ]
    
    with engine.connect() as conn:
        print("\n📝 Adding columns to transactions table...")
        
        success_count = 0
        
        for col_name, col_type, description in columns_to_add:
            try:
                query = f"ALTER TABLE transactions ADD COLUMN IF NOT EXISTS {col_name} {col_type};"
                conn.execute(text(query))
                print(f"   ✅ {col_name:25} | {description}")
                success_count += 1
                
            except Exception as e:
                print(f"   ⚠️  {col_name:25} | Error: {e}")
        
        conn.commit()
        
        print(f"\n✅ Migration complete! Added {success_count}/{len(columns_to_add)} columns")
        
        # Display table structure
        print("\n📊 Updated Transactions Table Structure:")
        try:
            result = conn.execute(text("""
                SELECT column_name, data_type
                FROM information_schema.columns
                WHERE table_name = 'transactions'
                ORDER BY ordinal_position
            """))
            
            for row in result:
                print(f"   • {row[0]:20} {row[1]}")
                
        except Exception as e:
            print(f"   (Could not display table structure: {e})")
        
        print("\n" + "="*70 + "\n")

if __name__ == "__main__":
    try:
        with engine.begin() as conn:
            # Add columns
            columns_to_add = [
                "ALTER TABLE transactions ADD COLUMN IF NOT EXISTS xgboost_score FLOAT;",
                "ALTER TABLE transactions ADD COLUMN IF NOT EXISTS autoencoder_score FLOAT;",
                "ALTER TABLE transactions ADD COLUMN IF NOT EXISTS reconstruction_error FLOAT;",
            ]
            
            for query in columns_to_add:
                try:
                    conn.execute(text(query))
                except:
                    pass
            
            conn.commit()
        
        print("\n✅ Migration successful!")
        add_hybrid_columns()
        
    except Exception as e:
        print(f"\n❌ Migration failed: {e}")
        import traceback
        traceback.print_exc()
