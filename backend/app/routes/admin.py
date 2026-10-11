from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import AdminUser
from ..schemas import LoginIn, PasswordChangeIn, Token
from ..auth import (
    verify_password,
    hash_password,
    create_access_token,
    get_current_admin_any,
    check_login_rate_limit,
    record_failed_login,
    clear_login_attempts,
)
from ..seed import DEFAULT_ADMIN_PASSWORD

router = APIRouter(prefix="/api/admin", tags=["admin"])


@router.post("/login", response_model=Token)
def login(payload: LoginIn, request: Request, db: Session = Depends(get_db)):
    ip = request.client.host if request.client else "unknown"
    check_login_rate_limit(ip)

    admin = db.query(AdminUser).filter(AdminUser.username == payload.username).first()
    if not admin or not verify_password(payload.password, admin.hashed_password):
        record_failed_login(ip)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
        )
    clear_login_attempts(ip)
    if admin.is_active is False:
        record_failed_login(ip)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="This account has been deactivated.")
    token = create_access_token({"sub": admin.username})
    return Token(access_token=token)


@router.get("/me")
def me(admin: AdminUser = Depends(get_current_admin_any)):
    return {
        "id": admin.id,
        "username": admin.username,
        "name": admin.name or admin.username,
        "role": admin.role,
        "using_default_password": verify_password(DEFAULT_ADMIN_PASSWORD, admin.hashed_password),
        "must_change_password": bool(admin.must_change_password),
    }


@router.put("/password")
def change_password(
    payload: PasswordChangeIn,
    db: Session = Depends(get_db),
    admin: AdminUser = Depends(get_current_admin_any),
):
    if not verify_password(payload.current_password, admin.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    if len(payload.new_password) < 8:
        raise HTTPException(status_code=400, detail="New password must be at least 8 characters")

    if payload.new_password == payload.current_password:
        raise HTTPException(status_code=400, detail="Choose a password that is different from the current one")
    admin.hashed_password = hash_password(payload.new_password)
    admin.must_change_password = False
    db.commit()
    return {"ok": True}
