"""
Testify Backend API Tests
Covers auth, workspace, onboarding, collections, testimonials, public flows,
uploads, widgets, analytics, and end-to-end propagation.
"""
import os
import io
import uuid
import time
import pytest
import requests

BASE_URL = os.environ["REACT_APP_BACKEND_URL"].rstrip("/") if os.environ.get("REACT_APP_BACKEND_URL") else None
if not BASE_URL:
    # fallback read from frontend .env
    with open("/app/frontend/.env") as f:
        for line in f:
            if line.startswith("REACT_APP_BACKEND_URL="):
                BASE_URL = line.split("=", 1)[1].strip().rstrip("/")
                break

API = f"{BASE_URL}/api"
ADMIN_EMAIL = "admin@testify.com"
ADMIN_PASSWORD = "admin123"


# ------------- Fixtures -------------
@pytest.fixture(scope="session")
def admin_token():
    r = requests.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, f"Admin login failed: {r.status_code} {r.text}"
    return r.json()["token"]


@pytest.fixture(scope="session")
def admin_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}


@pytest.fixture(scope="session")
def new_user():
    email = f"test_{uuid.uuid4().hex[:8]}@example.com"
    r = requests.post(f"{API}/auth/register", json={"name": "Test User", "email": email, "password": "Passw0rd!"})
    assert r.status_code == 200, r.text
    data = r.json()
    return {"email": email, "token": data["token"], "user": data["user"]}


@pytest.fixture(scope="session")
def new_user_headers(new_user):
    return {"Authorization": f"Bearer {new_user['token']}"}


# ------------- Auth -------------
class TestAuth:
    def test_register_new_user_not_onboarded(self, new_user):
        # Verify token exists
        assert new_user["token"]
        # Fetch /me to see onboarded field
        r = requests.get(f"{API}/auth/me", headers={"Authorization": f"Bearer {new_user['token']}"})
        assert r.status_code == 200
        me = r.json()
        assert me["email"] == new_user["email"]
        assert me.get("onboarded") is False

    def test_admin_login_and_me_onboarded(self, admin_token):
        r = requests.get(f"{API}/auth/me", headers={"Authorization": f"Bearer {admin_token}"})
        assert r.status_code == 200
        me = r.json()
        assert me["email"] == ADMIN_EMAIL
        assert me.get("onboarded") is True

    def test_forgot_password_ok_any_email(self):
        r = requests.post(f"{API}/auth/forgot-password", json={"email": "nonexistent@example.com"})
        assert r.status_code == 200
        assert r.json().get("ok") is True

    def test_reset_password_invalid_token(self):
        r = requests.post(f"{API}/auth/reset-password", json={"token": "invalid_token_xyz", "password": "NewPass1!"})
        assert r.status_code == 400


# ------------- Workspace -------------
class TestWorkspace:
    def test_get_workspace(self, admin_headers):
        r = requests.get(f"{API}/workspace", headers=admin_headers)
        assert r.status_code == 200
        ws = r.json()
        assert "id" in ws and "name" in ws

    def test_update_workspace(self, admin_headers):
        original = requests.get(f"{API}/workspace", headers=admin_headers).json()
        payload = {"name": original["name"], "primary_color": "#123456"}
        r = requests.put(f"{API}/workspace", headers=admin_headers, json=payload)
        assert r.status_code == 200
        assert r.json()["primary_color"] == "#123456"
        # restore
        requests.put(f"{API}/workspace", headers=admin_headers, json={"primary_color": original.get("primary_color", "#ff5722")})


# ------------- Onboarding -------------
class TestOnboarding:
    def test_onboarding_marks_user(self, new_user_headers):
        payload = {
            "business_name": "TEST Biz",
            "primary_color": "#00aa88",
            "logo_url": None,
            "collection_name": "TEST Collection",
        }
        r = requests.post(f"{API}/onboarding", headers=new_user_headers, json=payload)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["workspace"]["name"] == "TEST Biz"
        assert data["collection"]["published"] is True
        # verify onboarded=true
        me = requests.get(f"{API}/auth/me", headers=new_user_headers).json()
        assert me["onboarded"] is True


# ------------- Collections -------------
class TestCollections:
    created_id = None

    def test_list_collections(self, admin_headers):
        r = requests.get(f"{API}/collections", headers=admin_headers)
        assert r.status_code == 200
        cols = r.json()
        assert isinstance(cols, list)
        for c in cols:
            assert "testimonial_count" in c

    def test_create_get_update_delete(self, admin_headers):
        payload = {"name": "TEST_Col", "slug": f"test-col-{uuid.uuid4().hex[:6]}"}
        r = requests.post(f"{API}/collections", headers=admin_headers, json=payload)
        assert r.status_code == 200, r.text
        col = r.json()
        cid = col["id"]

        # get
        r = requests.get(f"{API}/collections/{cid}", headers=admin_headers)
        assert r.status_code == 200

        # update slug
        new_slug = f"updated-{uuid.uuid4().hex[:6]}"
        r = requests.put(f"{API}/collections/{cid}", headers=admin_headers, json={"slug": new_slug})
        assert r.status_code == 200
        assert r.json()["slug"] == new_slug

        # publish/unpublish
        r = requests.put(f"{API}/collections/{cid}", headers=admin_headers, json={"published": False})
        assert r.status_code == 200
        assert r.json()["published"] is False

        # delete
        r = requests.delete(f"{API}/collections/{cid}", headers=admin_headers)
        assert r.status_code == 200

        # verify 404 after delete
        r = requests.get(f"{API}/collections/{cid}", headers=admin_headers)
        assert r.status_code == 404

    def test_cross_workspace_access_404(self, admin_headers, new_user_headers):
        # admin creates a collection
        payload = {"name": "TEST_ADMIN_COL", "slug": f"admin-col-{uuid.uuid4().hex[:6]}"}
        r = requests.post(f"{API}/collections", headers=admin_headers, json=payload)
        cid = r.json()["id"]
        # new user tries to access
        r2 = requests.get(f"{API}/collections/{cid}", headers=new_user_headers)
        assert r2.status_code == 404
        r3 = requests.put(f"{API}/collections/{cid}", headers=new_user_headers, json={"name": "hacked"})
        assert r3.status_code == 404
        # cleanup
        requests.delete(f"{API}/collections/{cid}", headers=admin_headers)


# ------------- Public Collection & Submission -------------
class TestPublicCollection:
    def test_public_collection_and_views(self):
        r1 = requests.get(f"{API}/public/collection/testify-demo")
        assert r1.status_code == 200, r1.text
        data = r1.json()
        assert data["slug"] == "testify-demo"
        assert "business_name" in data

    def test_public_collection_404(self):
        r = requests.get(f"{API}/public/collection/does-not-exist-slug")
        assert r.status_code == 404

    def test_submit_consent_false_rejected(self):
        r = requests.post(f"{API}/public/collection/testify-demo/submit", json={
            "first_name": "TEST", "text": "Great!", "consent": False
        })
        assert r.status_code == 400

    def test_submit_empty_text_no_video_rejected(self):
        r = requests.post(f"{API}/public/collection/testify-demo/submit", json={
            "first_name": "TEST", "consent": True
        })
        assert r.status_code == 400

    def test_submit_honeypot_rejected(self):
        r = requests.post(f"{API}/public/collection/testify-demo/submit", json={
            "first_name": "TEST", "text": "hi", "consent": True, "honeypot": "spam"
        })
        assert r.status_code == 400

    def test_submit_success(self):
        r = requests.post(f"{API}/public/collection/testify-demo/submit", json={
            "first_name": "TESTSubmitter", "text": "This is a TEST testimonial.", "consent": True
        })
        assert r.status_code == 200, r.text
        j = r.json()
        assert j["ok"] is True
        assert "thank_you_message" in j


# ------------- Testimonials CRUD -------------
class TestTestimonials:
    def test_list_and_filters(self, admin_headers):
        r = requests.get(f"{API}/testimonials", headers=admin_headers)
        assert r.status_code == 200
        assert isinstance(r.json(), list)
        # filter by status pending
        r2 = requests.get(f"{API}/testimonials?status=pending", headers=admin_headers)
        assert r2.status_code == 200
        for t in r2.json():
            assert t["status"] == "pending"
        # filter by type text
        r3 = requests.get(f"{API}/testimonials?type=text", headers=admin_headers)
        assert r3.status_code == 200
        for t in r3.json():
            assert t.get("video_url") in (None, "")
        # search
        r4 = requests.get(f"{API}/testimonials?search=test", headers=admin_headers)
        assert r4.status_code == 200

    def test_full_testimonial_lifecycle(self, admin_headers):
        # submit new via public
        requests.post(f"{API}/public/collection/testify-demo/submit", json={
            "first_name": "TESTLifecycle", "text": "Lifecycle test.", "consent": True
        })
        # find that testimonial
        pending = requests.get(f"{API}/testimonials?status=pending", headers=admin_headers).json()
        target = next((t for t in pending if t["first_name"] == "TESTLifecycle"), None)
        assert target is not None
        tid = target["id"]

        # get detail
        r = requests.get(f"{API}/testimonials/{tid}", headers=admin_headers)
        assert r.status_code == 200

        # update text
        r = requests.put(f"{API}/testimonials/{tid}", headers=admin_headers, json={"text": "Updated text TEST"})
        assert r.status_code == 200
        assert r.json()["text"] == "Updated text TEST"

        # approve
        r = requests.post(f"{API}/testimonials/{tid}/status", headers=admin_headers, json={"status": "approved"})
        assert r.status_code == 200
        assert r.json()["status"] == "approved"
        assert r.json().get("approved_at") is not None

        # feature toggle
        r = requests.post(f"{API}/testimonials/{tid}/feature", headers=admin_headers)
        assert r.status_code == 200
        assert r.json()["featured"] is True

        # add tag
        r = requests.post(f"{API}/testimonials/{tid}/tags", headers=admin_headers, json={"tag": "TEST_tag"})
        assert r.status_code == 200
        assert "TEST_tag" in r.json()["tags"]

        # remove tag
        r = requests.delete(f"{API}/testimonials/{tid}/tags/TEST_tag", headers=admin_headers)
        assert r.status_code == 200
        assert "TEST_tag" not in r.json()["tags"]

        # delete
        r = requests.delete(f"{API}/testimonials/{tid}", headers=admin_headers)
        assert r.status_code == 200


# ------------- Upload -------------
class TestUpload:
    def test_upload_image_and_fetch(self, admin_headers):
        # tiny PNG
        png = (b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01"
               b"\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\rIDATx\x9cc\xf8\xff"
               b"\xff?\x00\x05\xfe\x02\xfe\xa7V\xbd\x1f\x00\x00\x00\x00IEND\xaeB`\x82")
        files = {"file": ("test.png", io.BytesIO(png), "image/png")}
        r = requests.post(f"{API}/upload", headers=admin_headers, files=files)
        assert r.status_code == 200, r.text
        url = r.json()["url"]
        assert url.startswith("/api/media/")
        # fetch media
        r2 = requests.get(f"{BASE_URL}{url}")
        assert r2.status_code == 200

    def test_upload_unsupported_type(self, admin_headers):
        files = {"file": ("test.txt", io.BytesIO(b"hi"), "text/plain")}
        r = requests.post(f"{API}/upload", headers=admin_headers, files=files)
        assert r.status_code == 400


# ------------- Widgets -------------
class TestWidgets:
    def test_widget_crud(self, admin_headers):
        # create
        r = requests.post(f"{API}/widgets", headers=admin_headers, json={
            "name": "TEST Widget", "type": "wall", "configuration": {"limit": 5}
        })
        assert r.status_code == 200
        wid = r.json()["id"]
        assert r.json()["configuration"]["limit"] == 5
        # merges with defaults
        assert r.json()["configuration"]["source"] == "approved"

        # list
        r = requests.get(f"{API}/widgets", headers=admin_headers)
        assert r.status_code == 200
        assert any(w["id"] == wid for w in r.json())

        # get
        r = requests.get(f"{API}/widgets/{wid}", headers=admin_headers)
        assert r.status_code == 200

        # update config merges
        r = requests.put(f"{API}/widgets/{wid}", headers=admin_headers, json={"configuration": {"columns": 2}})
        assert r.status_code == 200
        assert r.json()["configuration"]["columns"] == 2
        assert r.json()["configuration"]["limit"] == 5  # preserved

        # delete
        r = requests.delete(f"{API}/widgets/{wid}", headers=admin_headers)
        assert r.status_code == 200


# ------------- Public Widget -------------
class TestPublicWidget:
    def test_public_widget_only_approved(self, admin_headers):
        # find an existing widget from seed OR create one
        widgets = requests.get(f"{API}/widgets", headers=admin_headers).json()
        if widgets:
            wid = widgets[0]["id"]
        else:
            r = requests.post(f"{API}/widgets", headers=admin_headers, json={
                "name": "TEST Public W", "type": "wall", "configuration": {"limit": 20}
            })
            wid = r.json()["id"]

        r = requests.get(f"{API}/public/widget/{wid}")
        assert r.status_code == 200
        data = r.json()
        for t in data["testimonials"]:
            # only approved should appear -- verify private fields not leaked
            assert "email" not in t
            assert "notes" not in t
            assert "status" not in t

    def test_widget_js(self):
        r = requests.get(f"{API}/widget.js")
        assert r.status_code == 200
        assert "iframe" in r.text
        assert "application/javascript" in r.headers.get("content-type", "")


# ------------- Analytics -------------
class TestAnalytics:
    def test_analytics(self, admin_headers):
        r = requests.get(f"{API}/analytics", headers=admin_headers)
        assert r.status_code == 200
        d = r.json()
        assert len(d["timeseries"]) == 14
        assert "conversion_rate" in d

    def test_overview(self, admin_headers):
        r = requests.get(f"{API}/overview", headers=admin_headers)
        assert r.status_code == 200
        d = r.json()
        for k in ["total", "new", "approved", "video", "written", "recent"]:
            assert k in d
        assert isinstance(d["recent"], list)


# ------------- E2E Propagation -------------
class TestE2EPropagation:
    def test_submit_approve_widget_edit(self, admin_headers):
        # 1. submit
        unique = f"E2E_{uuid.uuid4().hex[:6]}"
        r = requests.post(f"{API}/public/collection/testify-demo/submit", json={
            "first_name": unique, "text": "Original E2E text", "consent": True
        })
        assert r.status_code == 200

        # 2. appears in pending
        pending = requests.get(f"{API}/testimonials?status=pending", headers=admin_headers).json()
        target = next((t for t in pending if t["first_name"] == unique), None)
        assert target is not None
        tid = target["id"]

        # 3. approve
        r = requests.post(f"{API}/testimonials/{tid}/status", headers=admin_headers, json={"status": "approved"})
        assert r.status_code == 200

        # 4. create/get widget with approved source and high limit
        r = requests.post(f"{API}/widgets", headers=admin_headers, json={
            "name": "TEST_E2E_Widget", "type": "wall", "configuration": {"source": "approved", "limit": 50}
        })
        wid = r.json()["id"]

        # 5. appears in public widget
        pw = requests.get(f"{API}/public/widget/{wid}").json()
        found = next((t for t in pw["testimonials"] if t["first_name"] == unique), None)
        assert found is not None, "Approved testimonial not in public widget"
        assert found["text"] == "Original E2E text"

        # 6. edit
        r = requests.put(f"{API}/testimonials/{tid}", headers=admin_headers, json={"text": "Edited E2E text"})
        assert r.status_code == 200

        # 7. reflected in widget
        pw2 = requests.get(f"{API}/public/widget/{wid}").json()
        found2 = next((t for t in pw2["testimonials"] if t["first_name"] == unique), None)
        assert found2["text"] == "Edited E2E text"

        # cleanup
        requests.delete(f"{API}/testimonials/{tid}", headers=admin_headers)
        requests.delete(f"{API}/widgets/{wid}", headers=admin_headers)
