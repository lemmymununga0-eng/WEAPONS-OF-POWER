from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import ServiceTime, AdminUser
from ..schemas import ServiceTimeOut, ServiceTimeIn, ServiceTimeReorderIn
from ..auth import get_current_admin

router = APIRouter(prefix="/api/service-times", tags=["service-times"])

# Reading service times happens via GET /api/church-info (they're nested
# there for the public site); everything here is admin-only management.


@router.post("", response_model=ServiceTimeOut)
def create_service_time(
    payload: ServiceTimeIn,
    db: Session = Depends(get_db),
    _admin: AdminUser = Depends(get_current_admin),
):
    st = ServiceTime(**payload.model_dump())
    db.add(st)
    db.commit()
    db.refresh(st)
    return st


@router.put("/{service_time_id}", response_model=ServiceTimeOut)
def update_service_time(
    service_time_id: int,
    payload: ServiceTimeIn,
    db: Session = Depends(get_db),
    _admin: AdminUser = Depends(get_current_admin),
):
    st = db.get(ServiceTime, service_time_id)
    if not st:
        raise HTTPException(404, "Service time not found")
    for field, value in payload.model_dump().items():
        setattr(st, field, value)
    db.commit()
    db.refresh(st)
    return st


@router.delete("/{service_time_id}")
def delete_service_time(
    service_time_id: int,
    db: Session = Depends(get_db),
    _admin: AdminUser = Depends(get_current_admin),
):
    st = db.get(ServiceTime, service_time_id)
    if not st:
        raise HTTPException(404, "Service time not found")
    db.delete(st)
    db.commit()
    return {"ok": True}


@router.post("/reorder")
def reorder_service_times(
    payload: ServiceTimeReorderIn,
    db: Session = Depends(get_db),
    _admin: AdminUser = Depends(get_current_admin),
):
    """Sets sort_order to match the position of each id in the given list."""
    for index, service_time_id in enumerate(payload.ids):
        st = db.get(ServiceTime, service_time_id)
        if st:
            st.sort_order = index
    db.commit()
    return {"ok": True}
