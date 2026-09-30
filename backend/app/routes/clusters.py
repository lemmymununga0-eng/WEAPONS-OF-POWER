from typing import List, Optional

from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Cluster, Branch, AdminUser
from ..schemas import ClusterOut
from ..auth import get_current_admin
from ..uploads import save_upload, IMAGE_TYPES

router = APIRouter(prefix="/api/clusters", tags=["clusters"])


@router.get("", response_model=List[ClusterOut])
def list_clusters(db: Session = Depends(get_db)):
    return db.query(Cluster).order_by(Cluster.name).all()


@router.post("", response_model=ClusterOut)
def create_cluster(
    name: str = Form(...),
    province: str = Form(""),
    overseer_name: str = Form(""),
    overseer_phone: str = Form(""),
    description: str = Form(""),
    overseer_photo: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    _admin: AdminUser = Depends(get_current_admin),
):
    try:
        photo_path = save_upload(overseer_photo, IMAGE_TYPES) if overseer_photo else ""
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    cluster = Cluster(
        name=name,
        province=province,
        overseer_name=overseer_name,
        overseer_photo=photo_path,
        overseer_phone=overseer_phone,
        description=description,
    )
    db.add(cluster)
    db.commit()
    db.refresh(cluster)
    return cluster


@router.put("/{cluster_id}", response_model=ClusterOut)
def update_cluster(
    cluster_id: int,
    name: Optional[str] = Form(None),
    province: Optional[str] = Form(None),
    overseer_name: Optional[str] = Form(None),
    overseer_phone: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    overseer_photo: Optional[UploadFile] = File(None),
    remove_overseer_photo: bool = Form(False),
    db: Session = Depends(get_db),
    _admin: AdminUser = Depends(get_current_admin),
):
    cluster = db.get(Cluster, cluster_id)
    if not cluster:
        raise HTTPException(404, "Cluster not found")

    if name is not None:
        cluster.name = name
    if province is not None:
        cluster.province = province
    if overseer_name is not None:
        cluster.overseer_name = overseer_name
    if overseer_phone is not None:
        cluster.overseer_phone = overseer_phone
    if description is not None:
        cluster.description = description

    if overseer_photo:
        try:
            cluster.overseer_photo = save_upload(overseer_photo, IMAGE_TYPES)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))
    elif remove_overseer_photo:
        cluster.overseer_photo = ""

    db.commit()
    db.refresh(cluster)
    return cluster


@router.delete("/{cluster_id}")
def delete_cluster(cluster_id: int, db: Session = Depends(get_db), _admin: AdminUser = Depends(get_current_admin)):
    """Removing a cluster detaches its branches instead of deleting them."""
    cluster = db.get(Cluster, cluster_id)
    if not cluster:
        raise HTTPException(404, "Cluster not found")

    db.query(Branch).filter(Branch.cluster_id == cluster_id).update({"cluster_id": None})
    db.delete(cluster)
    db.commit()
    return {"ok": True}
