from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from app.core.database import get_db
from app.models.config import SystemConfig
from app.models.rules import MerchantWhitelist, CountryBlacklist
from app.utils.deps import get_current_user
from app.models.user import User

router = APIRouter(prefix="/api/config", tags=["Configuration"])


# ─────────────────────────────────────────────
# SCHEMAS
# ─────────────────────────────────────────────
class ThresholdUpdate(BaseModel):
    decline_threshold: float   # 0.0 – 1.0
    review_threshold: float    # 0.0 – 1.0


class MerchantIn(BaseModel):
    merchant_name: str


class CountryIn(BaseModel):
    country_code: str
    country_name: str


# ─────────────────────────────────────────────
# THRESHOLDS
# ─────────────────────────────────────────────
@router.get("/thresholds")
def get_thresholds(db: Session = Depends(get_db)):
    """Returns the current fraud decision thresholds."""
    decline = db.query(SystemConfig).filter(SystemConfig.key == "fraud_threshold_decline").first()
    review = db.query(SystemConfig).filter(SystemConfig.key == "fraud_threshold_review").first()
    return {
        "decline_threshold": float(decline.value) if decline else 0.70,
        "review_threshold": float(review.value) if review else 0.50,
    }


@router.post("/thresholds")
def update_thresholds(
    payload: ThresholdUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Saves both thresholds to the database — updates the live AI engine immediately."""
    if payload.review_threshold >= payload.decline_threshold:
        raise HTTPException(
            status_code=400,
            detail="Review threshold must be lower than Decline threshold.",
        )

    for key, value in [
        ("fraud_threshold_decline", str(payload.decline_threshold)),
        ("fraud_threshold_review", str(payload.review_threshold)),
    ]:
        config = db.query(SystemConfig).filter(SystemConfig.key == key).first()
        if config:
            config.value = value
        else:
            db.add(SystemConfig(key=key, value=value))
    db.commit()
    return {"message": "Thresholds updated", "decline": payload.decline_threshold, "review": payload.review_threshold}


# ─────────────────────────────────────────────
# MERCHANT WHITELIST
# ─────────────────────────────────────────────
@router.get("/merchant-whitelist")
def get_merchant_whitelist(db: Session = Depends(get_db)):
    items = db.query(MerchantWhitelist).order_by(MerchantWhitelist.added_at.desc()).all()
    return [{"id": m.id, "merchant_name": m.merchant_name, "added_at": m.added_at} for m in items]


@router.post("/merchant-whitelist")
def add_merchant(
    payload: MerchantIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    name = payload.merchant_name.strip()
    if not name:
        raise HTTPException(status_code=400, detail="Merchant name cannot be empty.")
    existing = db.query(MerchantWhitelist).filter(
        MerchantWhitelist.merchant_name.ilike(name)
    ).first()
    if existing:
        raise HTTPException(status_code=409, detail="Merchant already whitelisted.")
    item = MerchantWhitelist(merchant_name=name)
    db.add(item)
    db.commit()
    db.refresh(item)
    return {"id": item.id, "merchant_name": item.merchant_name}


@router.delete("/merchant-whitelist/{item_id}")
def remove_merchant(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    item = db.query(MerchantWhitelist).filter(MerchantWhitelist.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Merchant not found.")
    db.delete(item)
    db.commit()
    return {"message": f"'{item.merchant_name}' removed from whitelist."}


# ─────────────────────────────────────────────
# COUNTRY BLACKLIST
# ─────────────────────────────────────────────
@router.get("/country-blacklist")
def get_country_blacklist(db: Session = Depends(get_db)):
    items = db.query(CountryBlacklist).order_by(CountryBlacklist.added_at.desc()).all()
    return [
        {"id": c.id, "country_code": c.country_code, "country_name": c.country_name, "added_at": c.added_at}
        for c in items
    ]


@router.post("/country-blacklist")
def add_country(
    payload: CountryIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    code = payload.country_code.strip().upper()
    name = payload.country_name.strip()
    if not code or not name:
        raise HTTPException(status_code=400, detail="Country code and name are required.")
    existing = db.query(CountryBlacklist).filter(CountryBlacklist.country_code == code).first()
    if existing:
        raise HTTPException(status_code=409, detail="Country already blacklisted.")
    item = CountryBlacklist(country_code=code, country_name=name)
    db.add(item)
    db.commit()
    db.refresh(item)
    return {"id": item.id, "country_code": item.country_code, "country_name": item.country_name}


@router.delete("/country-blacklist/{item_id}")
def remove_country(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    item = db.query(CountryBlacklist).filter(CountryBlacklist.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Country not found.")
    db.delete(item)
    db.commit()
    return {"message": f"'{item.country_name}' removed from blacklist."}
