from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import ContactMessage, AdminUser
from ..schemas import ContactMessageIn, ContactMessageOut
from ..auth import get_current_admin

router = APIRouter(prefix="/api/contact", tags=["contact"])


@router.post("", response_model=ContactMessageOut)
def submit_message(payload: ContactMessageIn, db: Session = Depends(get_db)):
    msg = ContactMessage(**payload.model_dump())
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return msg


@router.get("", response_model=List[ContactMessageOut])
def list_messages(db: Session = Depends(get_db), _admin: AdminUser = Depends(get_current_admin)):
    """Admin-only inbox of contact form submissions."""
    return db.query(ContactMessage).order_by(ContactMessage.created_at.desc()).all()
