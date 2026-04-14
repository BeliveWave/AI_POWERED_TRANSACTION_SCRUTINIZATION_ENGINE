from fastapi import APIRouter, Depends
from sqlalchemy import cast, String, or_
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.transaction import Transaction
from app.models.customer import Customer

router = APIRouter(prefix="/api/search", tags=["Global Search"])


@router.get("")
def unified_search(q: str = "", db: Session = Depends(get_db)):
    """
    Unified search across Transactions and Customers.
    Returns up to 5 of each type.
    Minimum query length: 2 characters (enforced on frontend too).
    """
    if not q or len(q.strip()) < 2:
        return {"transactions": [], "customers": []}

    term = f"%{q.strip()}%"

    # Search transactions — by ID, merchant, or customer name
    txn_results = (
        db.query(Transaction, Customer)
        .outerjoin(Customer, Transaction.customer_id == Customer.id)
        .filter(
            or_(
                cast(Transaction.id, String).ilike(term),
                Transaction.merchant.ilike(term),
                Customer.full_name.ilike(term),
            )
        )
        .order_by(Transaction.timestamp.desc())
        .limit(5)
        .all()
    )

    transactions = [
        {
            "id": txn.id,
            "merchant": txn.merchant,
            "amount": round(txn.amount, 2),
            "status": txn.status,
            "fraud_score": round(txn.fraud_score, 4),
            "customer_name": cust.full_name if cust else "Unknown",
            "timestamp": txn.timestamp.isoformat() if txn.timestamp else "",
        }
        for txn, cust in txn_results
    ]

    # Search customers — by name, email, or ID
    cust_results = (
        db.query(Customer)
        .filter(
            or_(
                Customer.full_name.ilike(term),
                Customer.email.ilike(term),
                cast(Customer.id, String).ilike(term),
            )
        )
        .limit(5)
        .all()
    )

    customers = [
        {
            "id": cust.id,
            "full_name": cust.full_name,
            "email": cust.email,
            "card_type": cust.card_type,
            "card_last_four": cust.card_last_four,
            "is_frozen": cust.is_frozen,
        }
        for cust in cust_results
    ]

    return {"transactions": transactions, "customers": customers}
