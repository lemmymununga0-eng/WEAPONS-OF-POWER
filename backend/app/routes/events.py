from typing import List, Optional

from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Event, AdminUser
from ..schemas import EventOut
from ..auth import get_current_admin
from ..uploads import save_upload, IMAGE_TYPES

router = APIRouter(prefix="/api/events", tags=["events"])


@router.get("", response_model=List[EventOut])
def list_events(db: Session = Depends(get_db)):
    return db.query(Event).order_by(Event.event_date).all()


@router.post("", response_model=EventOut)
def create_event(
    title: str = Form(...),
    description: str = Form(""),
    event_date: str = Form(...),
    event_time: str = Form(""),
    location: str = Form(""),
    flyer: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    _admin: AdminUser = Depends(get_current_admin),
):
    try:
        flyer_path = save_upload(flyer, IMAGE_TYPES) if flyer else ""
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    event = Event(
        title=title,
        description=description,
        event_date=event_date,
        event_time=event_time,
        location=location,
        flyer_path=flyer_path,
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    return event


@router.delete("/{event_id}")
def delete_event(event_id: int, db: Session = Depends(get_db), _admin: AdminUser = Depends(get_current_admin)):
    event = db.get(Event, event_id)
    if not event:
        raise HTTPException(404, "Event not found")
    db.delete(event)
    db.commit()
    return {"ok": True}
