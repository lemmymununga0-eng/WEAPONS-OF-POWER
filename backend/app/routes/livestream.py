from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import LivestreamSettings, ServiceTime, AdminUser
from ..schemas import LivestreamSettingsOut, LivestreamSettingsIn, LiveStatusOut
from ..auth import get_current_admin
from ..livestream_logic import now_in_lusaka, is_within_service, next_occurrence, embed_url_for

router = APIRouter(tags=["livestream"])


@router.get("/api/live-status", response_model=LiveStatusOut)
def live_status(db: Session = Depends(get_db)):
    settings = db.query(LivestreamSettings).first()
    service_times = db.query(ServiceTime).order_by(ServiceTime.sort_order).all()
    now = now_in_lusaka()

    is_live = False
    title = ""

    if settings and settings.manual_live:
        is_live = True
        title = settings.manual_title or "Live Now"
    elif settings and settings.auto_live:
        for st in service_times:
            if is_within_service(now, st.day, st.start_time, st.end_time):
                is_live = True
                title = st.label
                break

    embed_url = embed_url_for(settings.youtube_url, settings.facebook_url) if settings else ""

    next_service = None
    if service_times:
        best_st, best_dt = None, None
        for st in service_times:
            dt = next_occurrence(now, st.day, st.start_time)
            if best_dt is None or dt < best_dt:
                best_dt, best_st = dt, st
        if best_st:
            next_service = {"label": f"{best_st.day} {best_st.label}", "starts_at": best_dt.isoformat()}

    return {"is_live": is_live, "title": title, "embed_url": embed_url, "next_service": next_service}


@router.get("/api/livestream", response_model=LivestreamSettingsOut)
def get_livestream_settings(db: Session = Depends(get_db), _admin: AdminUser = Depends(get_current_admin)):
    return db.query(LivestreamSettings).first()


@router.put("/api/livestream", response_model=LivestreamSettingsOut)
def update_livestream_settings(
    payload: LivestreamSettingsIn,
    db: Session = Depends(get_db),
    _admin: AdminUser = Depends(get_current_admin),
):
    settings = db.query(LivestreamSettings).first()
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(settings, field, value)
    db.commit()
    db.refresh(settings)
    return settings
