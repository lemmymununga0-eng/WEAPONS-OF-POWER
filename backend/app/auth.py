"""
Admin authentication — a single admin account, not a public user system.

Passwords are hashed with bcrypt directly (no passlib) to avoid the
passlib/bcrypt version-compatibility warnings on newer bcrypt releases.
JWTs are short-lived; the frontend re-sends the login form when one expires.

SECRET_KEY MUST be overridden via the SECRET_KEY environment variable
before this ever runs somewhere public — see backend/.env.example.
"""
import os
from collections import defaultdict
from datetime import datetime, timedelta, timezone
from time import time
from typing import Optional

import bcrypt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from .database import get_db
from .models import AdminUser

SECRET_KEY = os.environ.get("SECRET_KEY", "dev-only-secret-change-me")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 12  # 12 hours

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/admin/login")
optional_oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/admin/login", auto_error=False)

# ---- login rate limiting ----
# In-memory per-IP counter. Good enough for a single-instance deployment
# (Render/Railway free tier); would need a shared store (e.g. Redis) behind
# multiple instances or a load balancer.
MAX_LOGIN_ATTEMPTS = 5
LOGIN_WINDOW_SECONDS = 5 * 60
_login_attempts: dict[str, list[float]] = defaultdict(list)


def check_login_rate_limit(ip: str) -> None:
    now = time()
    attempts = _login_attempts[ip]
    attempts[:] = [t for t in attempts if now - t < LOGIN_WINDOW_SECONDS]
    if len(attempts) >= MAX_LOGIN_ATTEMPTS:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many login attempts. Try again in a few minutes.",
        )


def record_failed_login(ip: str) -> None:
    _login_attempts[ip].append(time())


def clear_login_attempts(ip: str) -> None:
    _login_attempts.pop(ip, None)


def hash_password(plain_password: str) -> str:
    return bcrypt.hashpw(plain_password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def get_current_admin_any(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> AdminUser:
    """Valid, active admin, even one who still has to change their password."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate admin credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    admin = db.query(AdminUser).filter(AdminUser.username == username).first()
    if admin is None or admin.is_active is False:
        raise credentials_exception
    return admin


def get_current_admin(admin: AdminUser = Depends(get_current_admin_any)) -> AdminUser:
    if admin.must_change_password:
        raise HTTPException(status_code=403, detail="You need to set a new password before continuing.")
    return admin


ROLE_SUPER = "super_admin"
ROLE_ADMIN = "admin"
ROLE_CONTENT = "content_manager"
ALL_ROLES = (ROLE_SUPER, ROLE_ADMIN, ROLE_CONTENT)


def require_admin(admin: AdminUser = Depends(get_current_admin)) -> AdminUser:
    """Admin or super admin. Content managers are turned away."""
    if admin.role not in (ROLE_SUPER, ROLE_ADMIN):
        raise HTTPException(status_code=403, detail="You don't have permission to do that.")
    return admin


def require_super(admin: AdminUser = Depends(get_current_admin)) -> AdminUser:
    if admin.role != ROLE_SUPER:
        raise HTTPException(status_code=403, detail="Only a super admin can do that.")
    return admin


def get_optional_admin(
    token: Optional[str] = Depends(optional_oauth2_scheme), db: Session = Depends(get_db)
) -> Optional[AdminUser]:
    """Like get_current_admin, but returns None instead of raising when
    there's no (or an invalid) token — for endpoints whose behaviour
    changes for an admin caller without requiring one."""
    if not token:
        return None
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            return None
    except JWTError:
        return None
    admin = db.query(AdminUser).filter(AdminUser.username == username).first()
    if admin is None or admin.is_active is False or admin.role not in (ROLE_SUPER, ROLE_ADMIN):
        return None
    return admin
