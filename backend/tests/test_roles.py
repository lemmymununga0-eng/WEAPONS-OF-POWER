"""Role-based access: super_admin, admin, content_manager."""
from app.auth import hash_password
from app.models import AdminUser


def token_for(client, db_session, username, role, active=True):
    db_session.add(AdminUser(username=username, hashed_password=hash_password("TestPass123!"), role=role, is_active=active))
    db_session.commit()
    res = client.post("/api/admin/login", json={"username": username, "password": "TestPass123!"})
    return res, ({"Authorization": f"Bearer {res.json()['access_token']}"} if res.status_code == 200 else None)


def test_content_manager_limits(client, db_session):
    _, h = token_for(client, db_session, "cm", "content_manager")
    assert client.get("/api/admin/me", headers=h).json()["role"] == "content_manager"
    # allowed: sermons, events, ministries, announcements, media
    assert client.post("/api/events", headers=h, data={"title": "E", "event_date": "2030-01-01"}).status_code == 200
    assert client.post("/api/admin/announcements", headers=h, json={"title": "A"}).status_code == 200
    # forbidden: prayer, messages, leaders, church info, users, service times
    for method, url, kw in [
        ("get", "/api/admin/prayer-requests", {}),
        ("get", "/api/contact", {}),
        ("post", "/api/admin/leaders", {"data": {"name": "x"}}),
        ("put", "/api/church-info", {"json": {"name": "x"}}),
        ("get", "/api/admin/users", {}),
        ("post", "/api/service-times", {"json": {"day": "Monday", "label": "x", "start_time": "09:00", "end_time": "10:00"}}),
    ]:
        assert getattr(client, method)(url, headers=h, **kw).status_code == 403, url


def test_admin_cannot_manage_users_but_can_do_the_rest(client, db_session):
    _, h = token_for(client, db_session, "adm", "admin")
    assert client.get("/api/admin/users", headers=h).status_code == 403
    assert client.get("/api/admin/prayer-requests", headers=h).status_code == 200
    assert client.get("/api/contact", headers=h).status_code == 200


def test_super_admin_user_lifecycle(client, db_session):
    _, h = token_for(client, db_session, "boss", "super_admin")
    bad = client.post("/api/admin/users", headers=h, json={"username": "n", "role": "admin", "password": "longenough1"})
    assert bad.status_code == 422
    made = client.post("/api/admin/users", headers=h, json={"username": "Sister.Ann", "name": "Ann", "role": "content_manager", "password": "TempPass123"})
    assert made.status_code == 200 and made.json()["username"] == "sister.ann"
    assert client.post("/api/admin/users", headers=h, json={"username": "sister.ann", "role": "admin", "password": "TempPass123"}).status_code == 409

    uid = made.json()["id"]
    assert client.put(f"/api/admin/users/{uid}", headers=h, json={"role": "admin"}).json()["role"] == "admin"
    assert client.put(f"/api/admin/users/{uid}", headers=h, json={"is_active": False}).json()["is_active"] is False
    # deactivated accounts can't log in or use an old token
    assert client.post("/api/admin/login", json={"username": "sister.ann", "password": "TempPass123"}).status_code == 401


def test_cannot_lock_out_super_admins(client, db_session):
    _, h = token_for(client, db_session, "boss", "super_admin")
    me = client.get("/api/admin/users", headers=h).json()[0]
    assert client.put(f"/api/admin/users/{me['id']}", headers=h, json={"is_active": False}).status_code == 400
    assert client.put(f"/api/admin/users/{me['id']}", headers=h, json={"role": "admin"}).status_code == 400
    # a second super admin can be demoted while the first stays active
    token_for(client, db_session, "boss2", "super_admin")
    users = {u["username"]: u for u in client.get("/api/admin/users", headers=h).json()}
    assert client.put(f"/api/admin/users/{users['boss2']['id']}", headers=h, json={"role": "admin"}).status_code == 200


def test_old_token_stops_working_after_deactivation(client, db_session):
    _, boss = token_for(client, db_session, "boss", "super_admin")
    _, h = token_for(client, db_session, "cm", "content_manager")
    uid = [u for u in client.get("/api/admin/users", headers=boss).json() if u["username"] == "cm"][0]["id"]
    client.put(f"/api/admin/users/{uid}", headers=boss, json={"is_active": False})
    assert client.get("/api/admin/me", headers=h).status_code == 401
