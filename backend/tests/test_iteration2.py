"""
Iteration 2 tests: admin settings, public config, imports, wall of love.
"""
import os
import uuid
import requests
import pytest

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
if not BASE_URL:
    with open("/app/frontend/.env") as f:
        for line in f:
            if line.startswith("REACT_APP_BACKEND_URL="):
                BASE_URL = line.split("=", 1)[1].strip().rstrip("/")
                break

API = f"{BASE_URL}/api"
ADMIN_EMAIL = "admin@testify.com"
ADMIN_PASSWORD = "admin123"


@pytest.fixture(scope="module")
def admin_headers():
    r = requests.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, r.text
    return {"Authorization": f"Bearer {r.json()['token']}"}


@pytest.fixture(scope="module")
def non_admin_headers():
    email = f"test_nonadmin_{uuid.uuid4().hex[:8]}@example.com"
    unique_name = f"NonAdmin{uuid.uuid4().hex[:6]}"
    r = requests.post(f"{API}/auth/register", json={"name": unique_name, "email": email, "password": "Passw0rd!"})
    assert r.status_code == 200, r.text
    return {"Authorization": f"Bearer {r.json()['token']}"}


class TestAdminAuth:
    def test_admin_me_is_admin(self, admin_headers):
        r = requests.get(f"{API}/auth/me", headers=admin_headers)
        assert r.status_code == 200
        me = r.json()
        assert me["email"] == ADMIN_EMAIL
        assert me.get("is_admin") is True

    def test_non_admin_me_not_admin(self, non_admin_headers):
        r = requests.get(f"{API}/auth/me", headers=non_admin_headers)
        assert r.status_code == 200
        assert r.json().get("is_admin") is not True


class TestAdminSettings:
    def test_get_settings_admin(self, admin_headers):
        r = requests.get(f"{API}/admin/settings", headers=admin_headers)
        assert r.status_code == 200, r.text
        d = r.json()
        # keys present
        for key in ["recaptcha_site_key", "recaptcha_secret_key", "resend_api_key",
                    "sender_email", "google_places_api_key"]:
            assert key in d, f"Missing key {key}"
        assert d.get("resend_api_key"), "resend_api_key should be set from env"
        assert d.get("sender_email"), "sender email should be set"

    def test_get_settings_forbidden_for_non_admin(self, non_admin_headers):
        r = requests.get(f"{API}/admin/settings", headers=non_admin_headers)
        assert r.status_code == 403

    def test_put_settings_forbidden_for_non_admin(self, non_admin_headers):
        r = requests.put(f"{API}/admin/settings", headers=non_admin_headers,
                         json={"recaptcha_site_key": "hacker"})
        assert r.status_code == 403

    def test_put_settings_updates_persist_and_public_config(self, admin_headers):
        test_key = f"test-site-key-{uuid.uuid4().hex[:6]}"
        try:
            r = requests.put(f"{API}/admin/settings", headers=admin_headers,
                             json={"recaptcha_site_key": test_key})
            assert r.status_code == 200, r.text

            # verify GET returns it
            r2 = requests.get(f"{API}/admin/settings", headers=admin_headers)
            assert r2.json().get("recaptcha_site_key") == test_key

            # public config exposes it (no auth needed)
            r3 = requests.get(f"{API}/public/config")
            assert r3.status_code == 200
            assert r3.json().get("recaptcha_site_key") == test_key
        finally:
            # RESET to empty
            requests.put(f"{API}/admin/settings", headers=admin_headers,
                         json={"recaptcha_site_key": "", "recaptcha_secret_key": ""})
            # verify reset
            r4 = requests.get(f"{API}/public/config")
            assert r4.json().get("recaptcha_site_key", "") == ""


class TestPublicConfig:
    def test_public_config_no_auth(self):
        r = requests.get(f"{API}/public/config")
        assert r.status_code == 200
        assert "recaptcha_site_key" in r.json()


class TestImports:
    def test_manual_import_creates_approved(self, admin_headers):
        payload = {
            "first_name": "TEST_Import",
            "text": "Imported testimonial content.",
            "rating": 5,
            "source": "twitter",
        }
        r = requests.post(f"{API}/testimonials/import", headers=admin_headers, json=payload)
        assert r.status_code == 200, r.text
        t = r.json()
        assert t.get("status") == "approved"
        assert "Imported" in (t.get("tags") or [])
        tid = t["id"]
        # cleanup
        requests.delete(f"{API}/testimonials/{tid}", headers=admin_headers)

    def test_google_import_without_key_returns_400(self, admin_headers):
        r = requests.post(f"{API}/testimonials/import-google", headers=admin_headers,
                          json={"query": "Acme"})
        assert r.status_code == 400, r.text
        body = r.text.lower()
        assert "google" in body or "places" in body or "key" in body


class TestSubmitStillWorks:
    def test_submit_ok_no_recaptcha(self):
        r = requests.post(f"{API}/public/collection/testify-demo/submit", json={
            "first_name": "TEST_afterreset", "email": "test_afterreset@example.com",
            "text": "still working", "consent": True
        })
        assert r.status_code == 200, r.text
        assert r.json().get("ok") is True


class TestWallEndpoint:
    def test_wall(self):
        r = requests.get(f"{API}/public/wall/testify-demo")
        assert r.status_code == 200, r.text
        d = r.json()
        for k in ["business_name", "count", "testimonials", "collect_slug"]:
            assert k in d, f"missing {k}"
        assert isinstance(d["testimonials"], list)
        # only approved
        for t in d["testimonials"]:
            assert "status" not in t or t.get("status") == "approved"


class TestRegression:
    def test_overview(self, admin_headers):
        r = requests.get(f"{API}/overview", headers=admin_headers)
        assert r.status_code == 200
        d = r.json()
        for k in ["total", "new", "approved", "recent"]:
            assert k in d

    def test_analytics(self, admin_headers):
        r = requests.get(f"{API}/analytics", headers=admin_headers)
        assert r.status_code == 200
        d = r.json()
        assert "timeseries" in d and "conversion_rate" in d
