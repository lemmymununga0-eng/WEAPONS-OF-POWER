"""Public reads for leaders, announcements and media, plus the prayer request form."""
from datetime import date
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Leader, Announcement, MediaItem, PrayerRequest
from ..schemas import LeaderOut, AnnouncementOut, MediaItemOut, PrayerRequestIn, PrayerRequestOut

router = APIRouter(prefix="/api", tags=["public-content"])

PRAYER_CATEGORIES = {"Family", "Health", "Work", "Spiritual", "Financial", "Other"}


@router.get("/leaders", response_model=List[LeaderOut])
def list_leaders(db: Session = Depends(get_db)):
    # Founder first, then everyone else in display order.
    return db.query(Leader).order_by(Leader.is_founder.desc(), Leader.sort_order, Leader.id).all()


@router.get("/announcements/active", response_model=List[AnnouncementOut])
def active_announcements(db: Session = Depends(get_db)):
    today = date.today().isoformat()
    rows = db.query(Announcement).filter(Announcement.published.isnot(False)).order_by(Announcement.id.desc()).all()
    return [
        a for a in rows
        if (not a.start_date or a.start_date <= today) and (not a.end_date or a.end_date >= today)
    ]


@router.get("/media", response_model=List[MediaItemOut])
def list_media(kind: str = "", db: Session = Depends(get_db)):
    q = db.query(MediaItem).filter(MediaItem.published.isnot(False))
    if kind:
        q = q.filter(MediaItem.kind == kind)
    return q.order_by(MediaItem.created_at.desc()).all()


@router.post("/prayer-requests", response_model=PrayerRequestOut)
def submit_prayer_request(payload: PrayerRequestIn, db: Session = Depends(get_db)):
    text = payload.request.strip()
    if not text:
        raise HTTPException(422, "Please write your prayer request.")
    if payload.email and "@" not in payload.email:
        raise HTTPException(422, "That email address doesn't look right.")
    category = payload.category if payload.category in PRAYER_CATEGORIES else "Other"
    row = PrayerRequest(
        name=payload.name.strip(),
        email=payload.email.strip(),
        phone=payload.phone.strip(),
        request=text,
        category=category,
        confidential=payload.confidential,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return row
