"""
Iteration 3 tests: Stripe subscriptions, plan-based limits, branding flags.
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


# ---------- fixtures ----------
@pytest.fixture(scope="module")
def admin_headers():
    r = requests.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, r.text
    return {"Authorization": f"Bearer {r.json()['token']}"}


@pytest.fixture(scope="module")
def fresh_user():
    """Register a fresh free user AND complete onboarding (which creates 1 collection)."""
    email = f"TEST_free_{uuid.uuid4().hex[:8]}@example.com"
    name = f"FreeUser{uuid.uuid4().hex[:6]}"
    r = requests.post(f"{API}/auth/register", json={"name": name, "email": email, "password": "Passw0rd!"})
    assert r.status_code == 200, r.text
    token = r.json()["token"]
    h = {"Authorization": f"Bearer {token}"}
    # complete onboarding — this creates the first collection
    r2 = requests.post(f"{API}/onboarding", headers=h, json={
        "business_name": name, "primary_color": "#ff5722",
        "collection_name": "First Collection", "logo_url": None,
    })
    assert r2.status_code == 200, r2.text
    return {"headers": h, "email": email, "name": name}


# ---------- /plans ----------
class TestPlans:
    def test_plans_shape(self):
        r = requests.get(f"{API}/plans")
        assert r.status_code == 200, r.text
        plans = r.json()
        assert isinstance(plans, list)
        by_id = {p["id"]: p for p in plans}
        assert set(by_id.keys()) >= {"free", "pro", "business"}
        assert by_id["free"]["price"] == 0
        assert by_id["pro"]["price"] == 29
        assert by_id["business"]["price"] == 79
        assert by_id["pro"]["lookup_key"] == "pro_monthly"
        assert by_id["business"]["lookup_key"] == "business_monthly"


# ---------- /payments/checkout & /payments/status ----------
class TestPaymentsCheckout:
    def test_checkout_returns_url_and_persists(self, fresh_user):
        origin = BASE_URL
        r = requests.post(
            f"{API}/payments/checkout",
            headers=fresh_user["headers"],
            json={"lookup_key": "pro_monthly", "origin_url": origin},
        )
        assert r.status_code == 200, r.text
        data = r.json()
        assert "checkout_url" in data and data["checkout_url"].startswith("https://")
        assert "session_id" in data and data["session_id"].startswith("cs_")
        # Store on fixture for downstream test
        fresh_user["session_id"] = data["session_id"]
        fresh_user["checkout_url"] = data["checkout_url"]

    def test_checkout_invalid_lookup_key(self, fresh_user):
        r = requests.post(
            f"{API}/payments/checkout",
            headers=fresh_user["headers"],
            json={"lookup_key": "nonexistent_key", "origin_url": BASE_URL},
        )
        assert r.status_code == 400

    def test_checkout_requires_auth(self):
        r = requests.post(
            f"{API}/payments/checkout",
            json={"lookup_key": "pro_monthly", "origin_url": BASE_URL},
        )
        assert r.status_code in (401, 403)

    def test_status_endpoint_public(self, fresh_user):
        sid = fresh_user.get("session_id")
        if not sid:
            pytest.skip("checkout did not run first")
        r = requests.get(f"{API}/payments/status/{sid}")
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["session_id"] == sid
        assert "status" in d and "payment_status" in d
        assert d.get("plan") == "pro"
        # not paid yet since we didn't complete checkout
        assert d["payment_status"] in ("pending", "unpaid", "no_payment_required")

    def test_status_not_found(self):
        r = requests.get(f"{API}/payments/status/cs_test_nonexistent_{uuid.uuid4().hex}")
        assert r.status_code == 404


# ---------- Plan-based limits (FREE user) ----------
class TestFreePlanLimits:
    def test_second_collection_blocked(self, fresh_user):
        r = requests.post(
            f"{API}/collections",
            headers=fresh_user["headers"],
            json={"name": "Second Collection"},
        )
        assert r.status_code == 402, r.text
        assert "upgrade" in r.text.lower() or "free plan" in r.text.lower()

    def test_second_widget_blocked(self, fresh_user):
        # create first widget
        r1 = requests.post(
            f"{API}/widgets",
            headers=fresh_user["headers"],
            json={"name": "W1", "type": "grid", "configuration": {}},
        )
        assert r1.status_code == 200, r1.text
        # second widget must fail 402
        r2 = requests.post(
            f"{API}/widgets",
            headers=fresh_user["headers"],
            json={"name": "W2", "type": "grid", "configuration": {}},
        )
        assert r2.status_code == 402, r2.text
        assert "upgrade" in r2.text.lower() or "free plan" in r2.text.lower()


# ---------- Admin (pro) unlimited ----------
class TestProUnlimited:
    def test_admin_can_create_multiple_collections(self, admin_headers):
        created = []
        try:
            for i in range(2):
                r = requests.post(
                    f"{API}/collections",
                    headers=admin_headers,
                    json={"name": f"TEST_iter3_col_{uuid.uuid4().hex[:6]}"},
                )
                assert r.status_code == 200, r.text
                created.append(r.json()["id"])
        finally:
            for cid in created:
                requests.delete(f"{API}/collections/{cid}", headers=admin_headers)

    def test_admin_can_create_multiple_widgets(self, admin_headers):
        # get current widget count
        existing = requests.get(f"{API}/widgets", headers=admin_headers).json()
        created = []
        try:
            for i in range(2):
                r = requests.post(
                    f"{API}/widgets",
                    headers=admin_headers,
                    json={"name": f"TEST_iter3_wid_{uuid.uuid4().hex[:6]}", "type": "grid", "configuration": {}},
                )
                assert r.status_code == 200, r.text
                created.append(r.json()["id"])
        finally:
            for wid in created:
                requests.delete(f"{API}/widgets/{wid}", headers=admin_headers)


# ---------- Branding flag on public widget ----------
class TestBrandingFlag:
    def test_free_workspace_widget_branding_true(self, fresh_user):
        widgets = requests.get(f"{API}/widgets", headers=fresh_user["headers"]).json()
        assert widgets, "expected at least one widget on the free workspace"
        wid = widgets[0]["id"]
        r = requests.get(f"{API}/public/widget/{wid}")
        assert r.status_code == 200, r.text
        assert r.json().get("branding") is True

    def test_pro_workspace_widget_branding_false(self, admin_headers):
        widgets = requests.get(f"{API}/widgets", headers=admin_headers).json()
        assert widgets, "expected admin workspace to have at least one widget"
        wid = widgets[0]["id"]
        r = requests.get(f"{API}/public/widget/{wid}")
        assert r.status_code == 200, r.text
        assert r.json().get("branding") is False


# ---------- Regression: public submission and wall ----------
class TestRegression:
    def test_public_submit_demo(self):
        r = requests.post(
            f"{API}/public/collection/testify-demo/submit",
            json={
                "first_name": "TEST_iter3_submit",
                "email": "test_iter3@example.com",
                "text": "iter3 regression",
                "consent": True,
            },
        )
        assert r.status_code == 200, r.text
        assert r.json().get("ok") is True

    def test_public_wall_branding_flag(self):
        r = requests.get(f"{API}/public/wall/testify-demo")
        assert r.status_code == 200, r.text
        d = r.json()
        assert "branding" in d
        # admin workspace is on pro
        assert d["branding"] is False
