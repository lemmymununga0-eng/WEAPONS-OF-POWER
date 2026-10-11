"""Admin user management. Super admin only. Accounts are deactivated, never deleted."""
import re
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..auth import ALL_ROLES, ROLE_SUPER, hash_password, require_super
from ..database import get_db
from ..models import AdminUser

router = APIRouter(prefix="/api/admin/users", tags=["admin-users"])


class UserOut(BaseModel):
    id: int
    username: str
    name: str
    email: str
    role: str
    is_active: bool

    model_config = {"from_attributes": True}


class UserCreateIn(BaseModel):
    username: str
    name: str = ""
    email: str = ""
    role: str
    password: str


class UserUpdateIn(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None
    password: Optional[str] = None  # sets a new temporary password


def _active_supers(db: Session) -> int:
    return db.query(AdminUser).filter(AdminUser.role == ROLE_SUPER, AdminUser.is_active.isnot(False)).count()


@router.get("", response_model=List[UserOut])
def list_users(db: Session = Depends(get_db), _s: AdminUser = Depends(require_super)):
    return db.query(AdminUser).order_by(AdminUser.id).all()


@router.post("", response_model=UserOut)
def create_user(payload: UserCreateIn, db: Session = Depends(get_db), _s: AdminUser = Depends(require_super)):
    username = payload.username.strip().lower()
    if not re.fullmatch(r"[a-z0-9_.@-]{3,60}", username):
        raise HTTPException(422, "Username must be 3 to 60 letters, numbers or . _ @ -")
    if payload.role not in ALL_ROLES:
        raise HTTPException(422, "Unknown role.")
    if len(payload.password) < 8:
        raise HTTPException(422, "The temporary password must be at least 8 characters.")
    if payload.email and "@" not in payload.email:
        raise HTTPException(422, "That email address doesn't look right.")
    if db.query(AdminUser).filter(AdminUser.username == username).first():
        raise HTTPException(409, "That username is already taken.")
    user = AdminUser(
        username=username,
        name=payload.name.strip(),
        email=payload.email.strip(),
        role=payload.role,
        is_active=True,
        must_change_password=True,
        hashed_password=hash_password(payload.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.put("/{user_id}", response_model=UserOut)
def update_user(user_id: int, payload: UserUpdateIn, db: Session = Depends(get_db), me: AdminUser = Depends(require_super)):
    user = db.get(AdminUser, user_id)
    if not user:
        raise HTTPException(404, "User not found")
    if payload.role is not None and payload.role not in ALL_ROLES:
        raise HTTPException(422, "Unknown role.")

    if user.id == me.id:
        if payload.role is not None and payload.role != user.role:
            raise HTTPException(400, "You can't change your own role.")
        if payload.is_active is False:
            raise HTTPException(400, "You can't deactivate your own account.")

    losing_super = user.role == ROLE_SUPER and (
        (payload.role is not None and payload.role != ROLE_SUPER) or payload.is_active is False
    )
    if losing_super and _active_supers(db) <= 1:
        raise HTTPException(400, "There must be at least one active super admin.")

    if payload.password is not None:
        if len(payload.password) < 8:
            raise HTTPException(422, "The temporary password must be at least 8 characters.")
        user.hashed_password = hash_password(payload.password)
        user.must_change_password = True
    for field in ("name", "email", "role", "is_active"):
        value = getattr(payload, field)
        if value is not None:
            setattr(user, field, value)
    db.commit()
    db.refresh(user)
    return user
