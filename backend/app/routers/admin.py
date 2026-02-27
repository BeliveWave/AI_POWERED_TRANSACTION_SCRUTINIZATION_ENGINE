from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from app.core.database import get_db
from app.models.config import SystemConfig
from app.models.user import User
from app.utils.deps import get_current_user

router = APIRouter(prefix="/api/admin", tags=["System Admin"])

class ConfigUpdate(BaseModel):
    key: str
    value: str
    description: Optional[str] = None

@router.get("/config", response_model=List[ConfigUpdate])
def get_system_config(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    configs = db.query(SystemConfig).all()
    # Normalize return
    return [ConfigUpdate(key=c.key, value=c.value, description=c.description) for c in configs]

@router.post("/config")
def update_system_config(config_in: ConfigUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    config = db.query(SystemConfig).filter(SystemConfig.key == config_in.key).first()
    if config:
        config.value = config_in.value
        if config_in.description:
            config.description = config_in.description
    else:
        config = SystemConfig(key=config_in.key, value=config_in.value, description=config_in.description)
        db.add(config)
    
    db.commit()
    return {"message": "Config updated", "key": config.key, "value": config.value}
