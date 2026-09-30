def create_sermon(client, auth_headers, **overrides):
    data = {"title": "Test Sermon", "speaker": "Apostle Banda", "published": "true"}
    data.update(overrides)
    res = client.post("/api/sermons", headers=auth_headers, data=data)
    assert res.status_code == 200, res.text
    return res.json()


def test_public_list_only_shows_published(client, auth_headers):
    create_sermon(client, auth_headers, title="Published One", published="true")
    create_sermon(client, auth_headers, title="Draft One", published="false")

    titles = [s["title"] for s in client.get("/api/sermons").json()]
    assert "Published One" in titles
    assert "Draft One" not in titles


def test_admin_list_shows_everything(client, auth_headers):
    create_sermon(client, auth_headers, title="Published One", published="true")
    create_sermon(client, auth_headers, title="Draft One", published="false")

    titles = [s["title"] for s in client.get("/api/sermons/admin", headers=auth_headers).json()]
    assert "Published One" in titles
    assert "Draft One" in titles


def test_admin_list_requires_auth(client):
    assert client.get("/api/sermons/admin").status_code == 401


def test_get_single_published_sermon(client, auth_headers):
    sermon = create_sermon(client, auth_headers, published="true")
    res = client.get(f"/api/sermons/{sermon['id']}")
    assert res.status_code == 200
    assert res.json()["title"] == "Test Sermon"


def test_get_single_draft_sermon_404s_publicly(client, auth_headers):
    sermon = create_sermon(client, auth_headers, published="false")
    res = client.get(f"/api/sermons/{sermon['id']}")
    assert res.status_code == 404


def test_get_single_sermon_404_for_missing_id(client):
    assert client.get("/api/sermons/999999").status_code == 404


def test_update_sermon_publish_toggle(client, auth_headers):
    sermon = create_sermon(client, auth_headers, published="false")
    assert client.get(f"/api/sermons/{sermon['id']}").status_code == 404

    res = client.put(f"/api/sermons/{sermon['id']}", headers=auth_headers, data={"published": "true"})
    assert res.status_code == 200
    assert res.json()["published"] is True
    assert client.get(f"/api/sermons/{sermon['id']}").status_code == 200


def test_update_sermon_partial_fields(client, auth_headers):
    sermon = create_sermon(client, auth_headers, category="", scripture="")
    res = client.put(
        f"/api/sermons/{sermon['id']}",
        headers=auth_headers,
        data={"category": "Faith", "scripture": "Ephesians 6:10-18"},
    )
    assert res.status_code == 200
    body = res.json()
    assert body["category"] == "Faith"
    assert body["scripture"] == "Ephesians 6:10-18"
    assert body["title"] == "Test Sermon"  # untouched


def test_delete_sermon(client, auth_headers):
    sermon = create_sermon(client, auth_headers)
    res = client.delete(f"/api/sermons/{sermon['id']}", headers=auth_headers)
    assert res.status_code == 200
    assert client.get("/api/sermons/admin", headers=auth_headers).json() == []


def test_sermon_write_endpoints_require_auth(client):
    assert client.post("/api/sermons", data={"title": "x"}).status_code == 401
    assert client.put("/api/sermons/1", data={"title": "x"}).status_code == 401
    assert client.delete("/api/sermons/1").status_code == 401


def test_upload_rejects_disallowed_file_type(client, auth_headers):
    import io

    res = client.post(
        "/api/sermons",
        headers=auth_headers,
        data={"title": "Bad Upload"},
        files={"media": ("evil.html", io.BytesIO(b"<script>"), "text/html")},
    )
    assert res.status_code == 400
    assert "Unsupported file type" in res.json()["detail"]
