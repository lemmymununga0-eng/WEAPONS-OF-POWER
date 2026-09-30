from typing import List, Optional

from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Branch, Cluster, AdminUser
from ..schemas import BranchOut
from ..auth import get_current_admin, get_optional_admin
from ..uploads import save_upload, IMAGE_TYPES
from ..zambia import PROVINCES, normalize_phone
from ..slugify import slugify

router = APIRouter(prefix="/api/branches", tags=["branches"])


def unique_slug(db: Session, name: str, exclude_id: Optional[int] = None) -> str:
    base = slugify(name)
    slug = base
    n = 2
    while True:
        query = db.query(Branch).filter(Branch.slug == slug)
        if exclude_id is not None:
            query = query.filter(Branch.id != exclude_id)
        if not query.first():
            return slug
        slug = f"{base}-{n}"
        n += 1


def validate_coordinates(latitude: Optional[float], longitude: Optional[float]) -> None:
    if latitude is not None and not (-90 <= latitude <= 90):
        raise HTTPException(400, "Latitude must be between -90 and 90.")
    if longitude is not None and not (-180 <= longitude <= 180):
        raise HTTPException(400, "Longitude must be between -180 and 180.")
    if (latitude is None) != (longitude is None):
        raise HTTPException(400, "Set both latitude and longitude, or neither.")


def validate_province(country: str, province: Optional[str]) -> None:
    if country == "Zambia":
        if not province or province not in PROVINCES:
            raise HTTPException(
                400, f"Province is required for a Zambian branch and must be one of: {', '.join(PROVINCES)}."
            )


def check_single_headquarters(db: Session, is_headquarters: bool, exclude_id: Optional[int] = None) -> None:
    if not is_headquarters:
        return
    query = db.query(Branch).filter(Branch.is_headquarters == True)  # noqa: E712
    if exclude_id is not None:
        query = query.filter(Branch.id != exclude_id)
    if query.first():
        raise HTTPException(
            400, "Only one branch can be marked as headquarters. Unset the current headquarters branch first."
        )


def normalize_optional_phone(raw: Optional[str], country: str, field_label: str) -> Optional[str]:
    if not raw:
        return raw
    try:
        return normalize_phone(raw, country)
    except ValueError as e:
        raise HTTPException(400, f"{field_label}: {e}")


@router.get("", response_model=List[BranchOut])
def list_branches(
    country: Optional[str] = None,
    province: Optional[str] = None,
    cluster_id: Optional[int] = None,
    q: Optional[str] = None,
    include_inactive: bool = False,
    db: Session = Depends(get_db),
    admin: Optional[AdminUser] = Depends(get_optional_admin),
):
    query = db.query(Branch)
    if not (include_inactive and admin):
        query = query.filter(Branch.active == True)  # noqa: E712
    if country:
        query = query.filter(Branch.country == country)
    if province:
        query = query.filter(Branch.province == province)
    if cluster_id is not None:
        query = query.filter(Branch.cluster_id == cluster_id)
    if q:
        like = f"%{q}%"
        query = query.filter(
            (Branch.town.ilike(like)) | (Branch.pastor_name.ilike(like)) | (Branch.name.ilike(like))
        )
    return query.order_by(Branch.sort_order, Branch.name).all()


@router.get("/provinces", response_model=List[str])
def list_provinces():
    return PROVINCES


@router.get("/{slug}", response_model=BranchOut)
def get_branch(slug: str, db: Session = Depends(get_db)):
    branch = db.query(Branch).filter(Branch.slug == slug, Branch.active == True).first()  # noqa: E712
    if not branch:
        raise HTTPException(404, "Branch not found")
    return branch


@router.post("", response_model=BranchOut)
def create_branch(
    name: str = Form(...),
    country: str = Form("Zambia"),
    province: Optional[str] = Form(None),
    town: str = Form(""),
    cluster_id: Optional[int] = Form(None),
    address: str = Form(""),
    directions_note: str = Form(""),
    latitude: Optional[float] = Form(None),
    longitude: Optional[float] = Form(None),
    is_headquarters: bool = Form(False),
    service_times: str = Form(""),
    pastor_name: str = Form(...),
    pastor_title: str = Form("Pastor"),
    pastor_phone: Optional[str] = Form(None),
    pastor_whatsapp: Optional[str] = Form(None),
    pastor_email: str = Form(""),
    show_pastor_contacts: bool = Form(True),
    active: bool = Form(True),
    sort_order: int = Form(0),
    branch_photo: Optional[UploadFile] = File(None),
    pastor_photo: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    _admin: AdminUser = Depends(get_current_admin),
):
    validate_province(country, province)
    validate_coordinates(latitude, longitude)
    check_single_headquarters(db, is_headquarters)

    if cluster_id is not None and not db.get(Cluster, cluster_id):
        raise HTTPException(400, "That cluster doesn't exist.")

    pastor_phone = normalize_optional_phone(pastor_phone, country, "Pastor phone")
    pastor_whatsapp = normalize_optional_phone(pastor_whatsapp, country, "Pastor WhatsApp")

    try:
        branch_photo_path = save_upload(branch_photo, IMAGE_TYPES) if branch_photo else ""
        pastor_photo_path = save_upload(pastor_photo, IMAGE_TYPES) if pastor_photo else ""
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    branch = Branch(
        name=name,
        slug=unique_slug(db, name),
        country=country,
        province=province,
        town=town,
        cluster_id=cluster_id,
        address=address,
        directions_note=directions_note,
        latitude=latitude,
        longitude=longitude,
        is_headquarters=is_headquarters,
        service_times=service_times,
        branch_photo=branch_photo_path,
        pastor_name=pastor_name,
        pastor_title=pastor_title,
        pastor_photo=pastor_photo_path,
        pastor_phone=pastor_phone or "",
        pastor_whatsapp=pastor_whatsapp or "",
        pastor_email=pastor_email,
        show_pastor_contacts=show_pastor_contacts,
        active=active,
        sort_order=sort_order,
    )
    db.add(branch)
    db.commit()
    db.refresh(branch)
    return branch


@router.put("/{branch_id}", response_model=BranchOut)
def update_branch(
    branch_id: int,
    name: Optional[str] = Form(None),
    country: Optional[str] = Form(None),
    province: Optional[str] = Form(None),
    town: Optional[str] = Form(None),
    cluster_id: Optional[int] = Form(None),
    address: Optional[str] = Form(None),
    directions_note: Optional[str] = Form(None),
    latitude: Optional[float] = Form(None),
    longitude: Optional[float] = Form(None),
    is_headquarters: Optional[bool] = Form(None),
    service_times: Optional[str] = Form(None),
    pastor_name: Optional[str] = Form(None),
    pastor_title: Optional[str] = Form(None),
    pastor_phone: Optional[str] = Form(None),
    pastor_whatsapp: Optional[str] = Form(None),
    pastor_email: Optional[str] = Form(None),
    show_pastor_contacts: Optional[bool] = Form(None),
    active: Optional[bool] = Form(None),
    sort_order: Optional[int] = Form(None),
    branch_photo: Optional[UploadFile] = File(None),
    pastor_photo: Optional[UploadFile] = File(None),
    remove_branch_photo: bool = Form(False),
    remove_pastor_photo: bool = Form(False),
    db: Session = Depends(get_db),
    _admin: AdminUser = Depends(get_current_admin),
):
    branch = db.get(Branch, branch_id)
    if not branch:
        raise HTTPException(404, "Branch not found")

    effective_country = country if country is not None else branch.country
    effective_province = province if province is not None else branch.province
    validate_province(effective_country, effective_province)

    effective_lat = latitude if latitude is not None else branch.latitude
    effective_lng = longitude if longitude is not None else branch.longitude
    validate_coordinates(effective_lat, effective_lng)

    if is_headquarters is not None:
        check_single_headquarters(db, is_headquarters, exclude_id=branch_id)

    if cluster_id is not None and cluster_id != 0 and not db.get(Cluster, cluster_id):
        raise HTTPException(400, "That cluster doesn't exist.")

    if pastor_phone is not None:
        pastor_phone = normalize_optional_phone(pastor_phone, effective_country, "Pastor phone")
    if pastor_whatsapp is not None:
        pastor_whatsapp = normalize_optional_phone(pastor_whatsapp, effective_country, "Pastor WhatsApp")

    for field, value in [
        ("name", name),
        ("country", country),
        ("province", province),
        ("town", town),
        ("address", address),
        ("directions_note", directions_note),
        ("latitude", latitude),
        ("longitude", longitude),
        ("is_headquarters", is_headquarters),
        ("service_times", service_times),
        ("pastor_name", pastor_name),
        ("pastor_title", pastor_title),
        ("pastor_phone", pastor_phone),
        ("pastor_whatsapp", pastor_whatsapp),
        ("pastor_email", pastor_email),
        ("show_pastor_contacts", show_pastor_contacts),
        ("active", active),
        ("sort_order", sort_order),
    ]:
        if value is not None:
            setattr(branch, field, value)

    if cluster_id is not None:
        branch.cluster_id = cluster_id if cluster_id != 0 else None

    if name is not None:
        branch.slug = unique_slug(db, name, exclude_id=branch_id)

    try:
        if branch_photo:
            branch.branch_photo = save_upload(branch_photo, IMAGE_TYPES)
        elif remove_branch_photo:
            branch.branch_photo = ""

        if pastor_photo:
            branch.pastor_photo = save_upload(pastor_photo, IMAGE_TYPES)
        elif remove_pastor_photo:
            branch.pastor_photo = ""
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    db.commit()
    db.refresh(branch)
    return branch


@router.delete("/{branch_id}")
def delete_branch(branch_id: int, db: Session = Depends(get_db), _admin: AdminUser = Depends(get_current_admin)):
    branch = db.get(Branch, branch_id)
    if not branch:
        raise HTTPException(404, "Branch not found")
    db.delete(branch)
    db.commit()
    return {"ok": True}
