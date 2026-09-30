from freezegun import freeze_time

from app.models import ServiceTime, LivestreamSettings


def seed_schedule(db_session):
    db_session.add_all(
        [
            ServiceTime(day="Sunday", label="Morning Service", start_time="09:00", end_time="11:30", sort_order=1),
            ServiceTime(day="Sunday", label="Evening Service", start_time="15:30", end_time="18:00", sort_order=2),
            ServiceTime(day="Tuesday", label="Intercessory Prayer", start_time="16:00", end_time="18:00", sort_order=3),
            ServiceTime(day="Wednesday", label="Bible Study", start_time="16:00", end_time="18:00", sort_order=4),
        ]
    )
    db_session.add(LivestreamSettings(auto_live=True, manual_live=False))
    db_session.commit()


# 2026-01-04 is a Sunday; Lusaka is UTC+2 with no DST, so 08:00 UTC = 10:00 Lusaka.
@freeze_time("2026-01-04 08:00:00")
def test_live_during_sunday_morning_service(client, db_session):
    seed_schedule(db_session)
    res = client.get("/api/live-status")
    assert res.status_code == 200
    body = res.json()
    assert body["is_live"] is True
    assert body["title"] == "Morning Service"


# 2026-01-05 is the following Monday, 10:00 Lusaka.
@freeze_time("2026-01-05 08:00:00")
def test_not_live_monday_next_service_is_tuesday(client, db_session):
    seed_schedule(db_session)
    res = client.get("/api/live-status")
    body = res.json()
    assert body["is_live"] is False
    assert "Tuesday" in body["next_service"]["label"]
    assert body["next_service"]["starts_at"].startswith("2026-01-06T16:00:00")


@freeze_time("2026-01-04 08:00:00", tz_offset=0)
def test_live_status_correct_even_if_server_clock_is_utc(client, db_session):
    """The conversion to Lusaka time must happen regardless of what
    timezone the server's own OS clock is running in."""
    seed_schedule(db_session)
    assert client.get("/api/live-status").json()["is_live"] is True


def test_manual_live_overrides_schedule(client, db_session, auth_headers):
    seed_schedule(db_session)
    res = client.put(
        "/api/livestream", headers=auth_headers, json={"manual_live": True, "manual_title": "Special Service"}
    )
    assert res.status_code == 200

    status = client.get("/api/live-status").json()
    assert status["is_live"] is True
    assert status["title"] == "Special Service"


def test_youtube_embed_conversion(client, db_session, auth_headers):
    seed_schedule(db_session)
    client.put("/api/livestream", headers=auth_headers, json={"youtube_url": "https://youtu.be/abc123XYZ"})
    status = client.get("/api/live-status").json()
    assert status["embed_url"] == "https://www.youtube.com/embed/abc123XYZ"


def test_no_stream_link_gives_empty_embed_url(client, db_session):
    seed_schedule(db_session)
    status = client.get("/api/live-status").json()
    assert status["embed_url"] == ""


def test_livestream_admin_endpoints_require_auth(client, db_session):
    seed_schedule(db_session)
    assert client.get("/api/livestream").status_code == 401
    assert client.put("/api/livestream", json={"manual_live": True}).status_code == 401
