from typing import List, Optional

from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Ministry, AdminUser
from ..schemas import MinistryOut
from ..auth import get_current_admin
from ..uploads import save_upload, IMAGE_TYPES

router = APIRouter(prefix="/api/ministries", tags=["ministries"])


@router.get("", response_model=List[MinistryOut])
def list_ministries(db: Session = Depends(get_db)):
    return db.query(Ministry).order_by(Ministry.id).all()


@router.post("", response_model=MinistryOut)
def create_ministry(
    name: str = Form(...),
    description: str = Form(""),
    leader: str = Form(""),
    meeting_time: str = Form(""),
    image: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    _admin: AdminUser = Depends(get_current_admin),
):
    try:
        image_path = save_upload(image, IMAGE_TYPES) if image else ""
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    ministry = Ministry(name=name, description=description, leader=leader, meeting_time=meeting_time, image_path=image_path)
    db.add(ministry)
    db.commit()
    db.refresh(ministry)
    return ministry


@router.delete("/{ministry_id}")
def delete_ministry(ministry_id: int, db: Session = Depends(get_db), _admin: AdminUser = Depends(get_current_admin)):
    ministry = db.get(Ministry, ministry_id)
    if not ministry:
        raise HTTPException(404, "Ministry not found")
    db.delete(ministry)
    db.commit()
    return {"ok": True}
