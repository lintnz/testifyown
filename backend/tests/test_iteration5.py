"""Iteration 5 backend tests: Team members + Custom domain."""
import os
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
if not BASE_URL:
    # Fallback: read from /app/frontend/.env
    with open("/app/frontend/.env") as f:
        for line in f:
            if line.startswith("REACT_APP_BACKEND_URL="):
                BASE_URL = line.split("=", 1)[1].strip().rstrip("/")
                break

API = f"{BASE_URL}/api"

ADMIN_EMAIL = "admin@testify.com"
ADMIN_PASS = "admin123"
MATE_EMAIL = "existingmate@example.com"
MATE_PASS = "pass123"


def _login(email, password):
    r = requests.post(f"{API}/auth/login", json={"email": email, "password": password}, timeout=30)
    assert r.status_code == 200, f"login failed for {email}: {r.status_code} {r.text}"
    return r.json()["token"]


def _register(name, email, password):
    r = requests.post(f"{API}/auth/register", json={"name": name, "email": email, "password": password}, timeout=30)
    assert r.status_code == 200, f"register {email}: {r.status_code} {r.text}"
    return r.json()["token"]


def _auth(token):
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture(scope="module")
def admin_token():
    return _login(ADMIN_EMAIL, ADMIN_PASS)


@pytest.fixture(scope="module")
def mate_token():
    # existingmate may already exist; try login, else register
    r = requests.post(f"{API}/auth/login", json={"email": MATE_EMAIL, "password": MATE_PASS}, timeout=30)
    if r.status_code == 200:
        return r.json()["token"]
    pytest.skip("existingmate account not present")


# ---------- Members list & plan ----------
def test_members_list_as_admin(admin_token):
    r = requests.get(f"{API}/members", headers=_auth(admin_token), timeout=30)
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["can_manage"] is True
    assert data["plan"] == "business"
    assert len(data["members"]) >= 1
    emails = [mm["email"] for mm in data["members"]]
    assert ADMIN_EMAIL in emails


def test_invite_new_email_pending(admin_token):
    email = f"testify_invite_{uuid.uuid4().hex[:8]}@example.com"
    r = requests.post(f"{API}/members/invite", headers=_auth(admin_token),
                      json={"email": email, "role": "member"}, timeout=30)
    assert r.status_code == 200, r.text
    assert r.json()["status"] == "invited"
    # verify pending invite listed
    r2 = requests.get(f"{API}/members", headers=_auth(admin_token), timeout=30)
    invite_emails = [i["email"] for i in r2.json()["invites"]]
    assert email in invite_emails


def test_invite_existing_user_added(admin_token):
    # Create a fresh user then invite them -> status 'added'
    email = f"testify_existing_{uuid.uuid4().hex[:8]}@example.com"
    _register("Existing User", email, "pass1234")
    r = requests.post(f"{API}/members/invite", headers=_auth(admin_token),
                      json={"email": email, "role": "member"}, timeout=30)
    assert r.status_code == 200, r.text
    assert r.json()["status"] == "added"
    r2 = requests.get(f"{API}/members", headers=_auth(admin_token), timeout=30)
    member_emails = [mm["email"] for mm in r2.json()["members"]]
    assert email in member_emails


# ---------- Plan gate ----------
def test_free_plan_invite_402_and_domain_402():
    email = f"testify_free_{uuid.uuid4().hex[:8]}@example.com"
    token = _register("Free User", email, "pass1234")
    r = requests.post(f"{API}/members/invite", headers=_auth(token),
                     json={"email": "someone@example.com", "role": "member"}, timeout=30)
    assert r.status_code == 402, f"expected 402, got {r.status_code} {r.text}"
    r2 = requests.put(f"{API}/workspace/domain", headers=_auth(token),
                      json={"domain": "reviews.example.com"}, timeout=30)
    assert r2.status_code == 402, f"expected 402, got {r2.status_code} {r2.text}"


# ---------- Auto-accept invite on register ----------
def test_auto_accept_invite_on_register(admin_token):
    email = f"testify_autoacc_{uuid.uuid4().hex[:8]}@example.com"
    inv = requests.post(f"{API}/members/invite", headers=_auth(admin_token),
                       json={"email": email, "role": "member"}, timeout=30)
    assert inv.status_code == 200 and inv.json()["status"] == "invited"

    new_token = _register("Auto Accept", email, "pass1234")
    r = requests.get(f"{API}/workspaces/mine", headers=_auth(new_token), timeout=30)
    assert r.status_code == 200, r.text
    wss = r.json()
    assert len(wss) >= 2, f"expected >=2 workspaces, got {wss}"
    names = [w["name"] for w in wss]
    assert "Testify Demo" in names


# ---------- Workspace switch ----------
def test_workspace_switch_and_scoped_data(mate_token):
    r = requests.get(f"{API}/workspaces/mine", headers=_auth(mate_token), timeout=30)
    assert r.status_code == 200
    wss = r.json()
    assert len(wss) >= 2, f"expected 2+ workspaces for existingmate, got {wss}"
    demo = next((w for w in wss if w["name"] == "Testify Demo"), None)
    assert demo, "Testify Demo not in existingmate's workspaces"
    sw = requests.post(f"{API}/workspaces/switch", headers=_auth(mate_token),
                       json={"workspace_id": demo["id"]}, timeout=30)
    assert sw.status_code == 200, sw.text
    # Testimonials fetch should now be Testify Demo's testimonials
    t = requests.get(f"{API}/testimonials", headers=_auth(mate_token), timeout=30)
    assert t.status_code == 200
    items = t.json()
    # Testify Demo is seeded with 6 testimonials
    assert len(items) >= 5, f"expected >=5 testimonials after switch, got {len(items)}"


def test_member_cannot_remove_owner(mate_token, admin_token):
    # get admin user id
    me = requests.get(f"{API}/auth/me", headers=_auth(admin_token), timeout=30).json()
    admin_id = me["id"]
    # mate is admin of Testify Demo. Ensure switched.
    wss = requests.get(f"{API}/workspaces/mine", headers=_auth(mate_token), timeout=30).json()
    demo = next(w for w in wss if w["name"] == "Testify Demo")
    requests.post(f"{API}/workspaces/switch", headers=_auth(mate_token),
                  json={"workspace_id": demo["id"]}, timeout=30)
    r = requests.delete(f"{API}/members/{admin_id}", headers=_auth(mate_token), timeout=30)
    assert r.status_code == 400, f"expected 400, got {r.status_code} {r.text}"


# ---------- Custom domain ----------
def test_custom_domain_flow(admin_token):
    r = requests.put(f"{API}/workspace/domain", headers=_auth(admin_token),
                     json={"domain": "reviews.testbrand.com"}, timeout=30)
    assert r.status_code == 200, r.text
    ws = r.json()
    assert ws.get("domain_status") == "pending"
    assert ws.get("domain_token", "").startswith("testify-verify=")
    v = requests.post(f"{API}/workspace/domain/verify", headers=_auth(admin_token), timeout=60)
    assert v.status_code == 200, v.text
    assert v.json()["status"] == "failed"
    d = requests.delete(f"{API}/workspace/domain", headers=_auth(admin_token), timeout=30)
    assert d.status_code == 200
    # confirm cleared
    ws2 = requests.get(f"{API}/workspace", headers=_auth(admin_token), timeout=30).json()
    assert not ws2.get("custom_domain")


# ---------- Regression ----------
def test_regression_public_submit_and_dashboard(admin_token):
    # public collection page
    r = requests.get(f"{API}/public/collection/testify-demo", timeout=30)
    assert r.status_code == 200
    # overview
    ov = requests.get(f"{API}/overview", headers=_auth(admin_token), timeout=30)
    assert ov.status_code == 200
    assert "total" in ov.json()
