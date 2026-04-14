import csv
import io
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy import func, case
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.transaction import Transaction
from app.models.customer import Customer
from app.utils.deps import get_current_user
from app.models.user import User

router = APIRouter(prefix="/api/reports", tags=["Reports"])


def _csv_response(rows: list[dict], fieldnames: list[str], filename: str) -> StreamingResponse:
    """Helper: converts a list of dicts to a downloadable CSV StreamingResponse."""
    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=fieldnames, extrasaction="ignore")
    writer.writeheader()
    writer.writerows(rows)
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


# ─────────────────────────────────────────────
# RPT-001: Daily Fraud Summary
# ─────────────────────────────────────────────
@router.get("/daily-fraud-summary")
def daily_fraud_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """CSV of all Declined (fraud) transactions from today."""
    today_start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    results = (
        db.query(Transaction, Customer)
        .join(Customer, Transaction.customer_id == Customer.id)
        .filter(Transaction.timestamp >= today_start)
        .filter(Transaction.status == "Decline")
        .order_by(Transaction.timestamp.desc())
        .all()
    )

    rows = [
        {
            "id": txn.id,
            "customer_name": cust.full_name,
            "card_last_four": cust.card_last_four,
            "merchant": txn.merchant,
            "amount_usd": round(txn.amount, 2),
            "fraud_score": round(txn.fraud_score, 4),
            "xgboost_score": round(txn.xgboost_score or 0, 4),
            "autoencoder_score": round(txn.autoencoder_score or 0, 4),
            "status": txn.status,
            "timestamp": txn.timestamp.isoformat() if txn.timestamp else "",
        }
        for txn, cust in results
    ]

    filename = f"daily-fraud-summary-{datetime.now().strftime('%Y-%m-%d')}.csv"
    fieldnames = ["id", "customer_name", "card_last_four", "merchant", "amount_usd",
                  "fraud_score", "xgboost_score", "autoencoder_score", "status", "timestamp"]
    return _csv_response(rows, fieldnames, filename)


# ─────────────────────────────────────────────
# RPT-002: False Positives Analysis (Escalated — last 7 days)
# ─────────────────────────────────────────────
@router.get("/false-positives")
def false_positives_report(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """CSV of Escalated (under-review) transactions in the last 7 days."""
    seven_days_ago = datetime.now() - timedelta(days=7)
    results = (
        db.query(Transaction, Customer)
        .join(Customer, Transaction.customer_id == Customer.id)
        .filter(Transaction.timestamp >= seven_days_ago)
        .filter(Transaction.status == "Escalate")
        .order_by(Transaction.timestamp.desc())
        .all()
    )

    rows = [
        {
            "id": txn.id,
            "customer_name": cust.full_name,
            "merchant": txn.merchant,
            "amount_usd": round(txn.amount, 2),
            "fraud_score": round(txn.fraud_score, 4),
            "status": txn.status,
            "timestamp": txn.timestamp.isoformat() if txn.timestamp else "",
        }
        for txn, cust in results
    ]

    filename = f"false-positives-{datetime.now().strftime('%Y-%m-%d')}.csv"
    fieldnames = ["id", "customer_name", "merchant", "amount_usd", "fraud_score", "status", "timestamp"]
    return _csv_response(rows, fieldnames, filename)


# ─────────────────────────────────────────────
# RPT-003: Model Performance
# ─────────────────────────────────────────────
@router.get("/model-performance")
def model_performance_report(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """CSV of all transactions with individual model scores for performance analysis."""
    results = (
        db.query(Transaction)
        .order_by(Transaction.timestamp.desc())
        .limit(5000)  # Cap at 5000 for safety
        .all()
    )

    rows = [
        {
            "id": txn.id,
            "merchant": txn.merchant,
            "amount_usd": round(txn.amount, 2),
            "fraud_score": round(txn.fraud_score, 4),
            "xgboost_score": round(txn.xgboost_score or 0, 4),
            "autoencoder_score": round(txn.autoencoder_score or 0, 4),
            "reconstruction_error": round(txn.reconstruction_error or 0, 6),
            "status": txn.status,
            "processing_time_ms": round(txn.processing_time_ms or 0, 2),
            "timestamp": txn.timestamp.isoformat() if txn.timestamp else "",
        }
        for txn in results
    ]

    filename = f"model-performance-{datetime.now().strftime('%Y-%m-%d')}.csv"
    fieldnames = ["id", "merchant", "amount_usd", "fraud_score", "xgboost_score",
                  "autoencoder_score", "reconstruction_error", "status", "processing_time_ms", "timestamp"]
    return _csv_response(rows, fieldnames, filename)


# ─────────────────────────────────────────────
# RPT-004: Geographic / Merchant Heatmap
# ─────────────────────────────────────────────
@router.get("/geographic")
def geographic_heatmap_report(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """CSV of fraud rates grouped by merchant (proxy for geographic risk)."""
    results = (
        db.query(
            Transaction.merchant,
            func.count(Transaction.id).label("total_transactions"),
            func.sum(case((Transaction.status == "Decline", 1), else_=0)).label("fraud_count"),
            func.sum(case((Transaction.status == "Escalate", 1), else_=0)).label("escalate_count"),
            func.avg(Transaction.fraud_score).label("avg_fraud_score"),
        )
        .group_by(Transaction.merchant)
        .order_by(func.count(Transaction.id).desc())
        .all()
    )

    rows = []
    for merchant, total, fraud_c, escalate_c, avg_score in results:
        fraud_c = fraud_c or 0
        escalate_c = escalate_c or 0
        fraud_rate = (fraud_c / total * 100) if total > 0 else 0
        rows.append({
            "merchant": merchant,
            "total_transactions": total,
            "fraud_count": fraud_c,
            "escalate_count": escalate_c,
            "safe_count": total - fraud_c - escalate_c,
            "fraud_rate_pct": round(fraud_rate, 2),
            "avg_fraud_score": round(avg_score or 0, 4),
        })

    filename = f"geographic-heatmap-{datetime.now().strftime('%Y-%m-%d')}.csv"
    fieldnames = ["merchant", "total_transactions", "fraud_count", "escalate_count",
                  "safe_count", "fraud_rate_pct", "avg_fraud_score"]
    return _csv_response(rows, fieldnames, filename)
