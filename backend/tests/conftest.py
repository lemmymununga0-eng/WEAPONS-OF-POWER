"""
Shared pytest fixtures.

DATABASE_URL and UPLOADS_DIR must point at temp locations *before*
app.main is imported anywhere, since app/database.py creates the engine
at import time and app/uploads.py resolves its directory at import time.
"""
import os
import tempfile

_tmp_root = tempfile.mkdtemp(prefix="wopmi-test-")
os.environ["DATABASE_URL"] = f"sqlite:///{os.path.join(_tmp_root, 'test.db')}"
os.environ["UPLOADS_DIR"] = os.path.join(_tmp_root, "uploads")
os.environ["SECRET_KEY"] = "test-only-secret"
os.environ["ALLOWED_ORIGINS"] = "http://localhost:5173"

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from app.main import app  # noqa: E402
from app.database import Base, engine, SessionLocal  # noqa: E402


@pytest.fixture(autouse=True)
def reset_login_rate_limit():
    """The login rate limiter is an in-memory module-level dict keyed by
    client IP; TestClient always uses the same fake IP, so without this,
    a test that deliberately fails login would lock out every later
    test's login attempts."""
    from app.auth import _login_attempts

    _login_attempts.clear()
    yield
    _login_attempts.clear()


@pytest.fixture()
def db_session():
    """A fresh, empty schema for every test."""
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture()
def client(db_session):
    return TestClient(app)


@pytest.fixture()
def admin_token(client, db_session):
    from app.models import AdminUser
    from app.auth import hash_password

    admin = AdminUser(username="admin", hashed_password=hash_password("TestPass123!"))
    db_session.add(admin)
    db_session.commit()

    res = client.post("/api/admin/login", json={"username": "admin", "password": "TestPass123!"})
    assert res.status_code == 200, res.text
    return res.json()["access_token"]


@pytest.fixture()
def auth_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}
