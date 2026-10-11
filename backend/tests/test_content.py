"""Leaders, announcements, media, prayer requests, and the new event/ministry fields."""
from datetime import date, timedelta


def test_prayer_request_is_private_and_validated(client, auth_headers):
    bad = client.post("/api/prayer-requests", json={"request": "   "})
    assert bad.status_code == 422
    bad_email = client.post("/api/prayer-requests", json={"request": "Pray for me", "email": "nope"})
    assert bad_email.status_code == 422

    ok = client.post("/api/prayer-requests", json={"request": "Pray for my family", "category": "Family", "confidential": True})
    assert ok.status_code == 200
    assert set(ok.json()) == {"id", "created_at"}  # nothing echoed back publicly

    assert client.get("/api/admin/prayer-requests").status_code == 401
    rows = client.get("/api/admin/prayer-requests", headers=auth_headers).json()
    assert rows[0]["status"] == "New" and rows[0]["confidential"] is True

    res = client.put(f"/api/admin/prayer-requests/{rows[0]['id']}", headers=auth_headers, json={"status": "Prayed For"})
    assert res.json()["status"] == "Prayed For"
    assert client.put(f"/api/admin/prayer-requests/{rows[0]['id']}", headers=auth_headers, json={"status": "??"}).status_code == 422


def test_announcement_window(client, auth_headers):
    today = date.today()
    past = {"title": "Old", "start_date": str(today - timedelta(10)), "end_date": str(today - timedelta(5))}
    live = {"title": "Now", "start_date": str(today - timedelta(1)), "end_date": str(today + timedelta(1))}
    hidden = {"title": "Draft", "published": False}
    for payload in (past, live, hidden):
        assert client.post("/api/admin/announcements", headers=auth_headers, json=payload).status_code == 200
    titles = [a["title"] for a in client.get("/api/announcements/active").json()]
    assert titles == ["Now"]
    bad = client.post("/api/admin/announcements", headers=auth_headers, json={"title": "x", "start_date": "2026-02-02", "end_date": "2026-01-01"})
    assert bad.status_code == 422


def test_founder_leader_cannot_be_deleted(client, auth_headers, db_session):
    from app.models import Leader

    founder = Leader(name="Founder", is_founder=True)
    db_session.add(founder)
    db_session.commit()
    assert client.delete(f"/api/admin/leaders/{founder.id}", headers=auth_headers).status_code == 400

    other = client.post("/api/admin/leaders", headers=auth_headers, data={"name": "Pastor Joy", "sort_order": "1"}).json()
    names = [leader["name"] for leader in client.get("/api/leaders").json()]
    assert names == ["Founder", "Pastor Joy"]
    assert client.delete(f"/api/admin/leaders/{other['id']}", headers=auth_headers).status_code == 200


def test_media_filters_and_requires_content(client, auth_headers):
    assert client.post("/api/admin/media", headers=auth_headers, data={"title": "t", "kind": "video"}).status_code == 422
    client.post("/api/admin/media", headers=auth_headers, data={"title": "Vid", "kind": "video", "url": "https://youtu.be/abc"})
    client.post("/api/admin/media", headers=auth_headers, data={"title": "Hidden", "kind": "video", "url": "https://youtu.be/x", "published": "false"})
    assert [m["title"] for m in client.get("/api/media?kind=video").json()] == ["Vid"]
    assert client.get("/api/media?kind=photo").json() == []


def test_event_update_and_unpublished_hidden(client, auth_headers):
    ev = client.post("/api/events", headers=auth_headers, data={"title": "Revival", "event_date": "2030-01-10"}).json()
    res = client.put(f"/api/events/{ev['id']}", headers=auth_headers, data={"end_date": "2030-01-12", "registration_enabled": "true", "registration_url": "https://x.org"})
    assert res.json()["end_date"] == "2030-01-12" and res.json()["registration_enabled"] is True
    assert client.put(f"/api/events/{ev['id']}", headers=auth_headers, data={"end_date": "2029-01-01"}).status_code == 422

    client.put(f"/api/events/{ev['id']}", headers=auth_headers, data={"published": "false"})
    assert client.get(f"/api/events/{ev['id']}").status_code == 404
    assert client.get("/api/events").json() == []
    assert len(client.get("/api/events/admin", headers=auth_headers).json()) == 1


def test_inactive_ministry_hidden_publicly(client, auth_headers):
    m = client.post("/api/ministries", headers=auth_headers, data={"name": "Youth", "contact_info": "0971", "is_active": "false"}).json()
    assert client.get(f"/api/ministries/{m['id']}").status_code == 404
    assert client.get("/api/ministries").json() == []
    admin_rows = client.get("/api/ministries/admin", headers=auth_headers).json()
    assert admin_rows[0]["contact_info"] == "0971"
