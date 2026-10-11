"""Admin-only management of leaders, announcements, media and prayer requests."""
from typing import List, Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..auth import get_current_admin, require_admin
from ..database import get_db
from ..models import AdminUser, Announcement, Leader, MediaItem, PrayerRequest
from ..schemas import AnnouncementOut, LeaderOut, MediaItemOut
from ..uploads import IMAGE_TYPES, save_upload

router = APIRouter(prefix="/api/admin", tags=["admin-content"])

PRAYER_STATUSES = ["New", "In Progress", "Prayed For", "Closed"]


def _save_image(file: Optional[UploadFile]) -> str:
    if not file:
        return ""
    try:
        return save_upload(file, IMAGE_TYPES)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# ---------- Leaders ----------

@router.get("/leaders", response_model=List[LeaderOut])
def admin_list_leaders(db: Session = Depends(get_db), _a: AdminUser = Depends(require_admin)):
    return db.query(Leader).order_by(Leader.is_founder.desc(), Leader.sort_order, Leader.id).all()


@router.post("/leaders", response_model=LeaderOut)
def create_leader(
    name: str = Form(...),
    position: str = Form(""),
    biography: str = Form(""),
    sort_order: int = Form(0),
    photo: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    _a: AdminUser = Depends(require_admin),
):
    leader = Leader(name=name, position=position, biography=biography, sort_order=sort_order, photo_path=_save_image(photo))
    db.add(leader)
    db.commit()
    db.refresh(leader)
    return leader


@router.put("/leaders/{leader_id}", response_model=LeaderOut)
def update_leader(
    leader_id: int,
    name: Optional[str] = Form(None),
    position: Optional[str] = Form(None),
    biography: Optional[str] = Form(None),
    sort_order: Optional[int] = Form(None),
    photo: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    _a: AdminUser = Depends(require_admin),
):
    leader = db.get(Leader, leader_id)
    if not leader:
        raise HTTPException(404, "Leader not found")
    for field, value in (("name", name), ("position", position), ("biography", biography), ("sort_order", sort_order)):
        if value is not None:
            setattr(leader, field, value)
    if photo:
        leader.photo_path = _save_image(photo)
    db.commit()
    db.refresh(leader)
    return leader


@router.delete("/leaders/{leader_id}")
def delete_leader(leader_id: int, db: Session = Depends(get_db), _a: AdminUser = Depends(require_admin)):
    leader = db.get(Leader, leader_id)
    if not leader:
        raise HTTPException(404, "Leader not found")
    if leader.is_founder:
        raise HTTPException(400, "The founder's card can't be deleted. Edit it instead.")
    db.delete(leader)
    db.commit()
    return {"ok": True}


# ---------- Announcements ----------

class AnnouncementIn(BaseModel):
    title: str
    body: str = ""
    priority: str = "normal"
    start_date: str = ""
    end_date: str = ""
    published: bool = True


class AnnouncementAdminOut(AnnouncementOut):
    published: bool = True


@router.get("/announcements", response_model=List[AnnouncementAdminOut])
def admin_list_announcements(db: Session = Depends(get_db), _a: AdminUser = Depends(get_current_admin)):
    return db.query(Announcement).order_by(Announcement.id.desc()).all()


@router.post("/announcements", response_model=AnnouncementAdminOut)
def create_announcement(payload: AnnouncementIn, db: Session = Depends(get_db), _a: AdminUser = Depends(get_current_admin)):
    if payload.start_date and payload.end_date and payload.end_date < payload.start_date:
        raise HTTPException(422, "The end date can't be before the start date.")
    row = Announcement(**payload.model_dump())
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


@router.put("/announcements/{ann_id}", response_model=AnnouncementAdminOut)
def update_announcement(ann_id: int, payload: AnnouncementIn, db: Session = Depends(get_db), _a: AdminUser = Depends(get_current_admin)):
    row = db.get(Announcement, ann_id)
    if not row:
        raise HTTPException(404, "Announcement not found")
    if payload.start_date and payload.end_date and payload.end_date < payload.start_date:
        raise HTTPException(422, "The end date can't be before the start date.")
    for field, value in payload.model_dump().items():
        setattr(row, field, value)
    db.commit()
    db.refresh(row)
    return row


@router.delete("/announcements/{ann_id}")
def delete_announcement(ann_id: int, db: Session = Depends(get_db), _a: AdminUser = Depends(get_current_admin)):
    row = db.get(Announcement, ann_id)
    if not row:
        raise HTTPException(404, "Announcement not found")
    db.delete(row)
    db.commit()
    return {"ok": True}


# ---------- Media ----------

class MediaAdminOut(MediaItemOut):
    published: bool = True


@router.get("/media", response_model=List[MediaAdminOut])
def admin_list_media(db: Session = Depends(get_db), _a: AdminUser = Depends(get_current_admin)):
    return db.query(MediaItem).order_by(MediaItem.created_at.desc()).all()


@router.post("/media", response_model=MediaAdminOut)
def create_media(
    title: str = Form(...),
    kind: str = Form(...),
    category: str = Form(""),
    url: str = Form(""),
    published: bool = Form(True),
    file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    _a: AdminUser = Depends(get_current_admin),
):
    if kind not in ("video", "photo"):
        raise HTTPException(422, "Type must be video or photo.")
    file_path = _save_image(file) if kind == "photo" else ""
    if not url and not file_path:
        raise HTTPException(422, "Add a link, or upload a photo.")
    row = MediaItem(title=title, kind=kind, category=category, url=url, file_path=file_path, published=published)
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


@router.put("/media/{media_id}", response_model=MediaAdminOut)
def update_media(
    media_id: int,
    title: Optional[str] = Form(None),
    category: Optional[str] = Form(None),
    url: Optional[str] = Form(None),
    published: Optional[bool] = Form(None),
    db: Session = Depends(get_db),
    _a: AdminUser = Depends(get_current_admin),
):
    row = db.get(MediaItem, media_id)
    if not row:
        raise HTTPException(404, "Media item not found")
    for field, value in (("title", title), ("category", category), ("url", url), ("published", published)):
        if value is not None:
            setattr(row, field, value)
    db.commit()
    db.refresh(row)
    return row


@router.delete("/media/{media_id}")
def delete_media(media_id: int, db: Session = Depends(get_db), _a: AdminUser = Depends(get_current_admin)):
    row = db.get(MediaItem, media_id)
    if not row:
        raise HTTPException(404, "Media item not found")
    db.delete(row)
    db.commit()
    return {"ok": True}


# ---------- Prayer requests (private) ----------

class PrayerAdminOut(BaseModel):
    id: int
    name: str
    email: str
    phone: str
    request: str
    category: str
    confidential: bool
    status: str
    created_at: object

    model_config = {"from_attributes": True}


class PrayerStatusIn(BaseModel):
    status: str


@router.get("/prayer-requests", response_model=List[PrayerAdminOut])
def list_prayer_requests(
    status: str = "",
    category: str = "",
    confidential: bool = False,
    db: Session = Depends(get_db),
    _a: AdminUser = Depends(require_admin),
):
    q = db.query(PrayerRequest)
    if status:
        q = q.filter(PrayerRequest.status == status)
    if category:
        q = q.filter(PrayerRequest.category == category)
    if confidential:
        q = q.filter(PrayerRequest.confidential.is_(True))
    return q.order_by(PrayerRequest.created_at.desc()).all()


@router.put("/prayer-requests/{req_id}", response_model=PrayerAdminOut)
def set_prayer_status(req_id: int, payload: PrayerStatusIn, db: Session = Depends(get_db), _a: AdminUser = Depends(require_admin)):
    if payload.status not in PRAYER_STATUSES:
        raise HTTPException(422, "Unknown status.")
    row = db.get(PrayerRequest, req_id)
    if not row:
        raise HTTPException(404, "Prayer request not found")
    row.status = payload.status
    db.commit()
    db.refresh(row)
    return row


@router.delete("/prayer-requests/{req_id}")
def delete_prayer_request(req_id: int, db: Session = Depends(get_db), _a: AdminUser = Depends(require_admin)):
    row = db.get(PrayerRequest, req_id)
    if not row:
        raise HTTPException(404, "Prayer request not found")
    db.delete(row)
    db.commit()
    return {"ok": True}
