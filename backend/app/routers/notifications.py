from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.notification import Notification

router = APIRouter(prefix="/api/notifications", tags=["Notifications"])


@router.get("")
def get_notifications(db: Session = Depends(get_db)):
    """Returns the 20 most recent notifications, newest first."""
    notifications = (
        db.query(Notification)
        .order_by(Notification.created_at.desc())
        .limit(20)
        .all()
    )
    return [
        {
            "id": n.id,
            "title": n.title,
            "message": n.message,
            "severity": n.severity,
            "is_read": n.is_read,
            "transaction_id": n.transaction_id,
            "created_at": n.created_at.isoformat() if n.created_at else "",
        }
        for n in notifications
    ]


@router.get("/unread-count")
def get_unread_count(db: Session = Depends(get_db)):
    """Returns the count of unread notifications — used to drive the red dot badge."""
    count = db.query(Notification).filter(Notification.is_read == False).count()
    return {"count": count}


@router.post("/mark-all-read")
def mark_all_read(db: Session = Depends(get_db)):
    """Marks all unread notifications as read. Called when the user opens the bell drawer."""
    db.query(Notification).filter(Notification.is_read == False).update({"is_read": True})
    db.commit()
    return {"message": "All notifications marked as read."}
