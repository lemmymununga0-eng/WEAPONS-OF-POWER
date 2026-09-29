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
    return db.query(Sermon).order_by(Sermon.id.desc()).all()


@router.post("", response_model=SermonOut)
def create_sermon(
    title: str = Form(...),
    speaker: str = Form(""),
    sermon_date: str = Form(""),
    external_link: str = Form(""),
    notes: str = Form(""),
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
    )
    db.add(sermon)
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
