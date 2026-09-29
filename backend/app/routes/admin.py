from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import AdminUser
from ..schemas import LoginIn, PasswordChangeIn, Token
from ..auth import (
    verify_password,
    hash_password,
    create_access_token,
    get_current_admin,
    check_login_rate_limit,
    record_failed_login,
    clear_login_attempts,
)

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
    token = create_access_token({"sub": admin.username})
    return Token(access_token=token)


@router.get("/me")
def me(admin: AdminUser = Depends(get_current_admin)):
    return {"username": admin.username}


@router.put("/password")
def change_password(
    payload: PasswordChangeIn,
    db: Session = Depends(get_db),
    admin: AdminUser = Depends(get_current_admin),
):
    if not verify_password(payload.current_password, admin.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    if len(payload.new_password) < 8:
        raise HTTPException(status_code=400, detail="New password must be at least 8 characters")

    admin.hashed_password = hash_password(payload.new_password)
    db.commit()
    return {"ok": True}
