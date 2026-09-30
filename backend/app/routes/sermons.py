from typing import List, Optional

from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Sermon, AdminUser
from ..schemas import SermonOut
from ..auth import get_current_admin
from ..uploads import save_upload, AUDIO_VIDEO_TYPES

router = APIRouter(prefix="/api/sermons", tags=["sermons"])


@router.get("", response_model=List[SermonOut])
def list_sermons(db: Session = Depends(get_db)):
    """Public listing — published sermons only."""
    return db.query(Sermon).filter(Sermon.published == True).order_by(Sermon.id.desc()).all()  # noqa: E712


@router.get("/admin", response_model=List[SermonOut])
def list_sermons_admin(db: Session = Depends(get_db), _admin: AdminUser = Depends(get_current_admin)):
    """Admin listing — every sermon, published or draft."""
    return db.query(Sermon).order_by(Sermon.id.desc()).all()


@router.get("/{sermon_id}", response_model=SermonOut)
def get_sermon(sermon_id: int, db: Session = Depends(get_db)):
    """Public single-sermon lookup — published only."""
    sermon = db.query(Sermon).filter(Sermon.id == sermon_id, Sermon.published == True).first()  # noqa: E712
    if not sermon:
        raise HTTPException(404, "Sermon not found")
    return sermon


@router.post("", response_model=SermonOut)
def create_sermon(
    title: str = Form(...),
    speaker: str = Form(""),
    sermon_date: str = Form(""),
    external_link: str = Form(""),
    notes: str = Form(""),
    category: str = Form(""),
    scripture: str = Form(""),
    published: bool = Form(True),
    media: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    _admin: AdminUser = Depends(get_current_admin),
):
    try:
        media_path = save_upload(media, AUDIO_VIDEO_TYPES) if media else ""
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    sermon = Sermon(
        title=title,
        speaker=speaker,
        sermon_date=sermon_date,
        media_path=media_path,
        external_link=external_link,
        notes=notes,
        category=category,
        scripture=scripture,
        published=published,
    )
    db.add(sermon)
    db.commit()
    db.refresh(sermon)
    return sermon


@router.put("/{sermon_id}", response_model=SermonOut)
def update_sermon(
    sermon_id: int,
    title: Optional[str] = Form(None),
    speaker: Optional[str] = Form(None),
    sermon_date: Optional[str] = Form(None),
    external_link: Optional[str] = Form(None),
    notes: Optional[str] = Form(None),
    category: Optional[str] = Form(None),
    scripture: Optional[str] = Form(None),
    published: Optional[bool] = Form(None),
    media: Optional[UploadFile] = File(None),
    remove_media: bool = Form(False),
    db: Session = Depends(get_db),
    _admin: AdminUser = Depends(get_current_admin),
):
    sermon = db.get(Sermon, sermon_id)
    if not sermon:
        raise HTTPException(404, "Sermon not found")

    if title is not None:
        sermon.title = title
    if speaker is not None:
        sermon.speaker = speaker
    if sermon_date is not None:
        sermon.sermon_date = sermon_date
    if external_link is not None:
        sermon.external_link = external_link
    if notes is not None:
        sermon.notes = notes
    if category is not None:
        sermon.category = category
    if scripture is not None:
        sermon.scripture = scripture
    if published is not None:
        sermon.published = published

    if media:
        try:
            sermon.media_path = save_upload(media, AUDIO_VIDEO_TYPES)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))
    elif remove_media:
        sermon.media_path = ""

    db.commit()
    db.refresh(sermon)
    return sermon


@router.delete("/{sermon_id}")
def delete_sermon(sermon_id: int, db: Session = Depends(get_db), _admin: AdminUser = Depends(get_current_admin)):
    sermon = db.get(Sermon, sermon_id)
    if not sermon:
        raise HTTPException(404, "Sermon not found")
    db.delete(sermon)
    db.commit()
    return {"ok": True}
