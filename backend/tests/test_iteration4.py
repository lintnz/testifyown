"""
Iteration 4 tests: Annual pricing + Manage subscription (billing portal).
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
def fresh_user():
    email = f"TEST_iter4_{uuid.uuid4().hex[:8]}@example.com"
    name = f"Iter4U{uuid.uuid4().hex[:6]}"
    r = requests.post(f"{API}/auth/register", json={"name": name, "email": email, "password": "Passw0rd!"})
    assert r.status_code == 200, r.text
    token = r.json()["token"]
    h = {"Authorization": f"Bearer {token}"}
    r2 = requests.post(f"{API}/onboarding", headers=h, json={
        "business_name": name, "primary_color": "#ff5722",
        "collection_name": f"Coll {uuid.uuid4().hex[:6]}", "logo_url": None,
    })
    assert r2.status_code == 200, r2.text
    return {"headers": h, "email": email, "name": name, "token": token}


# ---------- /plans annual shape ----------
class TestPlansAnnual:
    def test_plans_have_monthly_and_yearly(self):
        r = requests.get(f"{API}/plans")
        assert r.status_code == 200
        plans = {p["id"]: p for p in r.json()}
        assert set(plans.keys()) >= {"free", "pro", "business"}

        pro = plans["pro"]
        assert pro["price_monthly"] == 29
        assert pro["price_yearly"] == 290
        assert pro["lookup_monthly"] == "pro_monthly"
        assert pro["lookup_yearly"] == "pro_yearly"

        biz = plans["business"]
        assert biz["price_monthly"] == 79
        assert biz["price_yearly"] == 790
        assert biz["lookup_monthly"] == "business_monthly"
        assert biz["lookup_yearly"] == "business_yearly"

        free = plans["free"]
        assert free["price_monthly"] == 0
        assert free["price_yearly"] == 0
        assert free["lookup_monthly"] in (None, "")
        assert free["lookup_yearly"] in (None, "")


# ---------- checkout for yearly + monthly ----------
class TestYearlyCheckout:
    def test_pro_yearly_checkout(self, fresh_user):
        r = requests.post(
            f"{API}/payments/checkout",
            headers=fresh_user["headers"],
            json={"lookup_key": "pro_yearly", "origin_url": BASE_URL},
        )
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["checkout_url"].startswith("https://")
        assert d["session_id"].startswith("cs_")

    def test_pro_monthly_checkout_regression(self, fresh_user):
        r = requests.post(
            f"{API}/payments/checkout",
            headers=fresh_user["headers"],
            json={"lookup_key": "pro_monthly", "origin_url": BASE_URL},
        )
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["checkout_url"].startswith("https://")
        assert d["session_id"].startswith("cs_")

    def test_business_yearly_checkout(self, fresh_user):
        r = requests.post(
            f"{API}/payments/checkout",
            headers=fresh_user["headers"],
            json={"lookup_key": "business_yearly", "origin_url": BASE_URL},
        )
        assert r.status_code == 200, r.text
        assert r.json()["checkout_url"].startswith("https://")


# ---------- portal ----------
class TestBillingPortal:
    def test_portal_no_subscription_returns_400(self, fresh_user):
        r = requests.post(
            f"{API}/payments/portal",
            headers=fresh_user["headers"],
            json={"origin_url": BASE_URL},
        )
        assert r.status_code == 400, r.text
        assert "no active subscription" in r.text.lower()

    def test_portal_admin_seeded_pro_no_customer_returns_400(self, admin_headers):
        # admin is seeded as pro but has no stripe_customer_id
        r = requests.post(
            f"{API}/payments/portal",
            headers=admin_headers,
            json={"origin_url": BASE_URL},
        )
        assert r.status_code == 400, r.text

    def test_portal_requires_auth(self):
        r = requests.post(f"{API}/payments/portal", json={"origin_url": BASE_URL})
        assert r.status_code in (401, 403)


# ---------- regression: free limits still enforced ----------
class TestFreeLimitsRegression:
    def test_second_collection_blocked_for_fresh_free_user(self):
        email = f"TEST_iter4free_{uuid.uuid4().hex[:8]}@example.com"
        r = requests.post(f"{API}/auth/register", json={"name": "L", "email": email, "password": "Passw0rd!"})
        assert r.status_code == 200
        h = {"Authorization": f"Bearer {r.json()['token']}"}
        requests.post(f"{API}/onboarding", headers=h, json={
            "business_name": "L", "primary_color": "#000",
            "collection_name": f"C {uuid.uuid4().hex[:6]}", "logo_url": None,
        })
        r2 = requests.post(f"{API}/collections", headers=h, json={"name": "Second"})
        assert r2.status_code == 402
