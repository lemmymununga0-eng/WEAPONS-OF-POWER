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
    return db.query(Event).filter(Event.published.isnot(False)).order_by(Event.event_date).all()


@router.get("/admin", response_model=List[EventOut])
def list_events_admin(db: Session = Depends(get_db), _admin: AdminUser = Depends(get_current_admin)):
    return db.query(Event).order_by(Event.event_date.desc()).all()


@router.put("/{event_id}", response_model=EventOut)
def update_event(
    event_id: int,
    title: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    event_date: Optional[str] = Form(None),
    event_time: Optional[str] = Form(None),
    location: Optional[str] = Form(None),
    end_date: Optional[str] = Form(None),
    speaker: Optional[str] = Form(None),
    registration_enabled: Optional[bool] = Form(None),
    registration_url: Optional[str] = Form(None),
    published: Optional[bool] = Form(None),
    flyer: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    _admin: AdminUser = Depends(get_current_admin),
):
    event = db.get(Event, event_id)
    if not event:
        raise HTTPException(404, "Event not found")
    fields = dict(
        title=title, description=description, event_date=event_date, event_time=event_time, location=location,
        end_date=end_date, speaker=speaker, registration_enabled=registration_enabled,
        registration_url=registration_url, published=published,
    )
    for key, value in fields.items():
        if value is not None:
            setattr(event, key, value)
    if event.end_date and event.end_date < event.event_date:
        raise HTTPException(422, "The end date can't be before the start date.")
    if flyer:
        try:
            event.flyer_path = save_upload(flyer, IMAGE_TYPES)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))
    db.commit()
    db.refresh(event)
    return event


@router.get("/{event_id}", response_model=EventOut)
def get_event(event_id: int, db: Session = Depends(get_db)):
    event = db.get(Event, event_id)
    if not event or event.published is False:
        raise HTTPException(404, "Event not found")
    return event


@router.post("", response_model=EventOut)
def create_event(
    title: str = Form(...),
    description: str = Form(""),
    event_date: str = Form(...),
    event_time: str = Form(""),
    location: str = Form(""),
    end_date: str = Form(""),
    speaker: str = Form(""),
    registration_enabled: bool = Form(False),
    registration_url: str = Form(""),
    published: bool = Form(True),
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
        end_date=end_date,
        speaker=speaker,
        registration_enabled=registration_enabled,
        registration_url=registration_url,
        published=published,
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
