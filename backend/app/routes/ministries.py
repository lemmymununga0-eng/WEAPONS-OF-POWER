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
    return db.query(Ministry).filter(Ministry.is_active.isnot(False)).order_by(Ministry.id).all()


@router.get("/admin", response_model=List[MinistryOut])
def list_ministries_admin(db: Session = Depends(get_db), _admin: AdminUser = Depends(get_current_admin)):
    return db.query(Ministry).order_by(Ministry.id).all()


@router.get("/{ministry_id}", response_model=MinistryOut)
def get_ministry(ministry_id: int, db: Session = Depends(get_db)):
    ministry = db.get(Ministry, ministry_id)
    if not ministry or ministry.is_active is False:
        raise HTTPException(404, "Ministry not found")
    return ministry


@router.post("", response_model=MinistryOut)
def create_ministry(
    name: str = Form(...),
    description: str = Form(""),
    leader: str = Form(""),
    meeting_time: str = Form(""),
    contact_info: str = Form(""),
    is_active: bool = Form(True),
    image: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    _admin: AdminUser = Depends(get_current_admin),
):
    try:
        image_path = save_upload(image, IMAGE_TYPES) if image else ""
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    ministry = Ministry(name=name, description=description, leader=leader, meeting_time=meeting_time, image_path=image_path, contact_info=contact_info, is_active=is_active)
    db.add(ministry)
    db.commit()
    db.refresh(ministry)
    return ministry


@router.put("/{ministry_id}", response_model=MinistryOut)
def update_ministry(
    ministry_id: int,
    name: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    leader: Optional[str] = Form(None),
    meeting_time: Optional[str] = Form(None),
    contact_info: Optional[str] = Form(None),
    is_active: Optional[bool] = Form(None),
    image: Optional[UploadFile] = File(None),
    remove_image: bool = Form(False),
    db: Session = Depends(get_db),
    _admin: AdminUser = Depends(get_current_admin),
):
    ministry = db.get(Ministry, ministry_id)
    if not ministry:
        raise HTTPException(404, "Ministry not found")

    if name is not None:
        ministry.name = name
    if description is not None:
        ministry.description = description
    if leader is not None:
        ministry.leader = leader
    if meeting_time is not None:
        ministry.meeting_time = meeting_time
    if contact_info is not None:
        ministry.contact_info = contact_info
    if is_active is not None:
        ministry.is_active = is_active

    if image:
        try:
            ministry.image_path = save_upload(image, IMAGE_TYPES)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))
    elif remove_image:
        ministry.image_path = ""

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
