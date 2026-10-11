from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import ContactMessage, AdminUser
from ..schemas import ContactMessageIn, ContactMessageOut
from ..auth import require_admin

router = APIRouter(prefix="/api/contact", tags=["contact"])


@router.post("", response_model=ContactMessageOut)
def submit_message(payload: ContactMessageIn, db: Session = Depends(get_db)):
    msg = ContactMessage(**payload.model_dump())
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return msg


@router.get("", response_model=List[ContactMessageOut])
def list_messages(db: Session = Depends(get_db), _admin: AdminUser = Depends(require_admin)):
    """Admin-only inbox of contact form submissions."""
    return db.query(ContactMessage).order_by(ContactMessage.created_at.desc()).all()


@router.put("/{message_id}/read", response_model=ContactMessageOut)
def mark_message_read(message_id: int, db: Session = Depends(get_db), _admin: AdminUser = Depends(require_admin)):
    msg = db.get(ContactMessage, message_id)
    if not msg:
        raise HTTPException(404, "Message not found")
    msg.read = True
    db.commit()
    db.refresh(msg)
    return msg


@router.delete("/{message_id}")
def delete_message(message_id: int, db: Session = Depends(get_db), _admin: AdminUser = Depends(require_admin)):
    msg = db.get(ContactMessage, message_id)
    if not msg:
        raise HTTPException(404, "Message not found")
    db.delete(msg)
    db.commit()
    return {"ok": True}
