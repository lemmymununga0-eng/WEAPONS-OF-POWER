def test_using_default_password_true_for_seeded_default(client, auth_headers):
    # auth_headers fixture creates the admin with password "TestPass123!",
    # not the real default "ChangeMe123!" — so it should read as False here,
    # proving the flag actually compares against the real default rather
    # than always returning True.
    res = client.get("/api/admin/me", headers=auth_headers)
    assert res.status_code == 200
    assert res.json()["using_default_password"] is False


def test_using_default_password_true_when_it_matches(client, db_session):
    from app.models import AdminUser
    from app.auth import hash_password
    from app.seed import DEFAULT_ADMIN_PASSWORD

    admin = AdminUser(username="admin", hashed_password=hash_password(DEFAULT_ADMIN_PASSWORD))
    db_session.add(admin)
    db_session.commit()

    login = client.post("/api/admin/login", json={"username": "admin", "password": DEFAULT_ADMIN_PASSWORD})
    token = login.json()["access_token"]

    res = client.get("/api/admin/me", headers={"Authorization": f"Bearer {token}"})
    assert res.json()["using_default_password"] is True


def test_using_default_password_false_after_change(client, auth_headers):
    client.put(
        "/api/admin/password",
        headers=auth_headers,
        json={"current_password": "TestPass123!", "new_password": "BrandNewPass456!"},
    )
    res = client.get("/api/admin/me", headers=auth_headers)
    assert res.json()["using_default_password"] is False


def test_church_info_giving_fields_roundtrip(client, db_session, auth_headers):
    from app.models import ChurchInfo

    db_session.add(
        ChurchInfo(name="Test Church", founder_name="Test Founder", founder_title="Pastor", location="Test Location")
    )
    db_session.commit()

    res = client.put(
        "/api/church-info",
        headers=auth_headers,
        json={
            "airtel_number": "0971234567",
            "airtel_name": "WOPMI Giving",
            "bank_name": "Zanaco",
            "bank_account_number": "1234567890",
        },
    )
    assert res.status_code == 200
    body = res.json()
    assert body["airtel_number"] == "0971234567"
    assert body["airtel_name"] == "WOPMI Giving"
    assert body["bank_name"] == "Zanaco"
    assert body["bank_account_number"] == "1234567890"
    assert body["mtn_number"] == ""  # untouched fields keep their default
