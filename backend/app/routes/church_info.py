from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import ChurchInfo, ServiceTime, AdminUser
from ..schemas import ChurchInfoOut, ChurchInfoIn
from ..auth import require_admin
from ..uploads import save_upload, IMAGE_TYPES

router = APIRouter(prefix="/api/church-info", tags=["church-info"])


@router.get("", response_model=ChurchInfoOut)
def get_church_info(db: Session = Depends(get_db)):
    info = db.query(ChurchInfo).first()
    times = db.query(ServiceTime).order_by(ServiceTime.sort_order).all()
    out = ChurchInfoOut.model_validate(info)
    out.service_times = times
    return out


@router.post("/founder-photo", response_model=ChurchInfoOut)
def upload_founder_photo(
    photo: UploadFile = File(...),
    db: Session = Depends(get_db),
    _admin: AdminUser = Depends(require_admin),
):
    info = db.query(ChurchInfo).first()
    try:
        info.founder_photo = save_upload(photo, IMAGE_TYPES)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    db.commit()
    db.refresh(info)
    times = db.query(ServiceTime).order_by(ServiceTime.sort_order).all()
    out = ChurchInfoOut.model_validate(info)
    out.service_times = times
    return out


@router.post("/church-photo", response_model=ChurchInfoOut)
def upload_church_photo(
    photo: UploadFile = File(...),
    db: Session = Depends(get_db),
    _admin: AdminUser = Depends(require_admin),
):
    info = db.query(ChurchInfo).first()
    try:
        info.church_photo = save_upload(photo, IMAGE_TYPES)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    db.commit()
    db.refresh(info)
    times = db.query(ServiceTime).order_by(ServiceTime.sort_order).all()
    out = ChurchInfoOut.model_validate(info)
    out.service_times = times
    return out


@router.put("", response_model=ChurchInfoOut)
def update_church_info(
    payload: ChurchInfoIn,
    db: Session = Depends(get_db),
    _admin: AdminUser = Depends(require_admin),
):
    info = db.query(ChurchInfo).first()
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(info, field, value)
    db.commit()
    db.refresh(info)
    times = db.query(ServiceTime).order_by(ServiceTime.sort_order).all()
    out = ChurchInfoOut.model_validate(info)
    out.service_times = times
    return out
