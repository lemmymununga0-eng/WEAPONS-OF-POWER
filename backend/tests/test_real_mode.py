"""No demo content, and no way to use the admin area on a default or temporary password."""
from app.auth import hash_password
from app.models import AdminUser, ChurchInfo, Event, Leader, Ministry
from app.seed import DEFAULT_ADMIN_PASSWORD, seed_if_empty


def test_fresh_seed_has_no_sample_content(db_session):
    seed_if_empty(db_session)
    assert db_session.query(Ministry).count() == 0
    assert db_session.query(Event).count() == 0
    info = db_session.query(ChurchInfo).first()
    assert info.name and info.founder_name and info.location
    assert info.mission == "" and info.founder_bio == "" and info.give_details == ""
    assert db_session.query(Leader).filter(Leader.is_founder.is_(True)).count() == 1


def test_old_demo_rows_are_cleaned_but_edited_ones_kept(db_session):
    seed_if_empty(db_session)
    db_session.add_all(
        [
            Ministry(name="Sample", description="(Example — edit or remove via the admin dashboard.)"),
            Ministry(name="Edited", description="(Example — edit or remove via the admin dashboard.)", leader="Sister Grace"),
            Ministry(name="Real", description="We pray together."),
            Event(title="Example Event — replace or delete me", event_date="2026-12-31"),
            Event(title="Real Revival", event_date="2026-12-01"),
        ]
    )
    db_session.commit()

    seed_if_empty(db_session)  # runs the cleanup again, like a restart

    names = {m.name: m.description for m in db_session.query(Ministry).all()}
    assert "Sample" not in names
    assert names["Edited"] == ""
    assert names["Real"] == "We pray together."
    assert [e.title for e in db_session.query(Event).all()] == ["Real Revival"]


def test_default_password_account_must_change_before_anything_else(client, db_session):
    seed_if_empty(db_session)
    login = client.post("/api/admin/login", json={"username": "admin", "password": DEFAULT_ADMIN_PASSWORD})
    assert login.status_code == 200
    h = {"Authorization": f"Bearer {login.json()['access_token']}"}

    assert client.get("/api/admin/me", headers=h).json()["must_change_password"] is True
    blocked = client.get("/api/admin/users", headers=h)
    assert blocked.status_code == 403 and "new password" in blocked.json()["detail"]
    assert client.post("/api/events", headers=h, data={"title": "x", "event_date": "2030-01-01"}).status_code == 403

    same = client.put("/api/admin/password", headers=h, json={"current_password": DEFAULT_ADMIN_PASSWORD, "new_password": DEFAULT_ADMIN_PASSWORD})
    assert same.status_code == 400
    ok = client.put("/api/admin/password", headers=h, json={"current_password": DEFAULT_ADMIN_PASSWORD, "new_password": "A-Brand-New-Pass1"})
    assert ok.status_code == 200
    assert client.get("/api/admin/me", headers=h).json()["must_change_password"] is False
    assert client.get("/api/admin/users", headers=h).status_code == 200


def test_new_and_reset_users_get_a_temporary_password(client, db_session):
    db_session.add(AdminUser(username="boss", hashed_password=hash_password("TestPass123!"), role="super_admin"))
    db_session.commit()
    t = client.post("/api/admin/login", json={"username": "boss", "password": "TestPass123!"}).json()["access_token"]
    boss = {"Authorization": f"Bearer {t}"}

    made = client.post("/api/admin/users", headers=boss, json={"username": "ann", "role": "admin", "password": "TempPass123"}).json()
    ann_t = client.post("/api/admin/login", json={"username": "ann", "password": "TempPass123"}).json()["access_token"]
    ann = {"Authorization": f"Bearer {ann_t}"}
    assert client.get("/api/admin/prayer-requests", headers=ann).status_code == 403
    client.put("/api/admin/password", headers=ann, json={"current_password": "TempPass123", "new_password": "Ann-Own-Pass-9"})
    assert client.get("/api/admin/prayer-requests", headers=ann).status_code == 200

    client.put(f"/api/admin/users/{made['id']}", headers=boss, json={"password": "ResetPass123"})
    again = client.post("/api/admin/login", json={"username": "ann", "password": "ResetPass123"}).json()["access_token"]
    assert client.get("/api/admin/prayer-requests", headers={"Authorization": f"Bearer {again}"}).status_code == 403
