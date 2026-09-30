def test_provinces_list(client):
    res = client.get("/api/branches/provinces")
    assert res.status_code == 200
    provinces = res.json()
    assert "Lusaka" in provinces
    assert "Copperbelt" in provinces
    assert len(provinces) == 10


def test_create_branch_missing_province_fails(client, auth_headers):
    res = client.post(
        "/api/branches",
        headers=auth_headers,
        data={"name": "Test Branch", "pastor_name": "Test Pastor"},
    )
    assert res.status_code == 400
    assert "province" in res.json()["detail"].lower()


def test_create_branch_bad_phone_fails(client, auth_headers):
    res = client.post(
        "/api/branches",
        headers=auth_headers,
        data={
            "name": "Test Branch",
            "pastor_name": "Test Pastor",
            "province": "Lusaka",
            "pastor_phone": "12345",
        },
    )
    assert res.status_code == 400
    assert "phone" in res.json()["detail"].lower()


def test_create_branch_bad_coordinates_fails(client, auth_headers):
    res = client.post(
        "/api/branches",
        headers=auth_headers,
        data={
            "name": "Test Branch",
            "pastor_name": "Test Pastor",
            "province": "Lusaka",
            "latitude": "200",
            "longitude": "28",
        },
    )
    assert res.status_code == 400
    assert "latitude" in res.json()["detail"].lower()


def test_create_branch_success_and_phone_normalized(client, auth_headers):
    res = client.post(
        "/api/branches",
        headers=auth_headers,
        data={
            "name": "Test Branch Lusaka",
            "pastor_name": "Test Pastor",
            "province": "Lusaka",
            "town": "Lusaka",
            "pastor_phone": "0971234567",
            "latitude": "-15.4067",
            "longitude": "28.2871",
        },
    )
    assert res.status_code == 200, res.text
    body = res.json()
    assert body["slug"] == "test-branch-lusaka"
    assert body["pastor_phone"] == "+260971234567"
    assert body["province"] == "Lusaka"


def test_slug_collision_gets_suffixed(client, auth_headers):
    payload = {"name": "Duplicate Name", "pastor_name": "Pastor A", "province": "Lusaka"}
    first = client.post("/api/branches", headers=auth_headers, data=payload)
    second = client.post(
        "/api/branches",
        headers=auth_headers,
        data={**payload, "pastor_name": "Pastor B"},
    )
    assert first.json()["slug"] == "duplicate-name"
    assert second.json()["slug"] == "duplicate-name-2"


def test_get_branch_by_slug(client, auth_headers):
    client.post(
        "/api/branches",
        headers=auth_headers,
        data={"name": "Findable Branch", "pastor_name": "Pastor", "province": "Eastern"},
    )
    res = client.get("/api/branches/findable-branch")
    assert res.status_code == 200
    assert res.json()["name"] == "Findable Branch"


def test_get_branch_404(client):
    res = client.get("/api/branches/does-not-exist")
    assert res.status_code == 404


def test_inactive_branch_hidden_from_public_get_by_slug(client, auth_headers):
    created = client.post(
        "/api/branches",
        headers=auth_headers,
        data={"name": "Hidden Branch", "pastor_name": "Pastor", "province": "Southern", "active": "false"},
    ).json()
    res = client.get(f"/api/branches/{created['slug']}")
    assert res.status_code == 404


def test_only_one_headquarters_allowed(client, auth_headers):
    first = client.post(
        "/api/branches",
        headers=auth_headers,
        data={"name": "HQ One", "pastor_name": "Pastor", "province": "Lusaka", "is_headquarters": "true"},
    )
    assert first.status_code == 200

    second = client.post(
        "/api/branches",
        headers=auth_headers,
        data={"name": "HQ Two", "pastor_name": "Pastor", "province": "Lusaka", "is_headquarters": "true"},
    )
    assert second.status_code == 400
    assert "headquarters" in second.json()["detail"].lower()


def test_update_branch_partial(client, auth_headers):
    created = client.post(
        "/api/branches",
        headers=auth_headers,
        data={"name": "Editable Branch", "pastor_name": "Old Pastor", "province": "Lusaka"},
    ).json()

    res = client.put(
        f"/api/branches/{created['id']}",
        headers=auth_headers,
        data={"pastor_name": "New Pastor"},
    )
    assert res.status_code == 200
    body = res.json()
    assert body["pastor_name"] == "New Pastor"
    assert body["name"] == "Editable Branch"  # untouched fields stay put


def test_delete_branch(client, auth_headers):
    created = client.post(
        "/api/branches",
        headers=auth_headers,
        data={"name": "Deletable Branch", "pastor_name": "Pastor", "province": "Lusaka"},
    ).json()

    res = client.delete(f"/api/branches/{created['id']}", headers=auth_headers)
    assert res.status_code == 200

    res = client.get(f"/api/branches/{created['slug']}")
    assert res.status_code == 404


def test_delete_branch_404(client, auth_headers):
    res = client.delete("/api/branches/999999", headers=auth_headers)
    assert res.status_code == 404


def test_branch_admin_endpoints_require_auth(client):
    assert client.post("/api/branches", data={"name": "x", "pastor_name": "y", "province": "Lusaka"}).status_code == 401
    assert client.put("/api/branches/1", data={"name": "x"}).status_code == 401
    assert client.delete("/api/branches/1").status_code == 401


def test_include_inactive_requires_admin_token(client, auth_headers):
    client.post(
        "/api/branches",
        headers=auth_headers,
        data={"name": "Hidden Two", "pastor_name": "Pastor", "province": "Western", "active": "false"},
    )

    without_token = client.get("/api/branches?include_inactive=true")
    names = [b["name"] for b in without_token.json()]
    assert "Hidden Two" not in names

    with_token = client.get("/api/branches?include_inactive=true", headers=auth_headers)
    names = [b["name"] for b in with_token.json()]
    assert "Hidden Two" in names


def test_filter_by_province(client, auth_headers):
    client.post(
        "/api/branches",
        headers=auth_headers,
        data={"name": "Copperbelt Branch", "pastor_name": "Pastor", "province": "Copperbelt"},
    )
    client.post(
        "/api/branches",
        headers=auth_headers,
        data={"name": "Lusaka Branch", "pastor_name": "Pastor", "province": "Lusaka"},
    )
    res = client.get("/api/branches?province=Copperbelt")
    names = [b["name"] for b in res.json()]
    assert names == ["Copperbelt Branch"]


# ---------- Clusters ----------


def test_cluster_crud_and_delete_detaches_branches(client, auth_headers):
    cluster = client.post(
        "/api/clusters",
        headers=auth_headers,
        data={"name": "Test Cluster", "province": "Lusaka"},
    ).json()

    branch = client.post(
        "/api/branches",
        headers=auth_headers,
        data={"name": "Clustered Branch", "pastor_name": "Pastor", "province": "Lusaka", "cluster_id": str(cluster["id"])},
    ).json()
    assert branch["cluster_id"] == cluster["id"]

    del_res = client.delete(f"/api/clusters/{cluster['id']}", headers=auth_headers)
    assert del_res.status_code == 200

    refetched = client.get(f"/api/branches/{branch['slug']}").json()
    assert refetched["cluster_id"] is None  # detached, not deleted


def test_cluster_admin_endpoints_require_auth(client):
    assert client.post("/api/clusters", data={"name": "x"}).status_code == 401
    assert client.delete("/api/clusters/1").status_code == 401
