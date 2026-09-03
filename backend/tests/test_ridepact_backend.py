"""
RidePact Phase 0 backend tests.
Covers: health, auth (register/verify/login/me/forgot/reset), admin role gate,
public reference lists, and user profile update.
"""
import os
import random
import string
import pytest
import requests

BASE_URL = os.environ.get("EXPO_PUBLIC_BACKEND_URL", "https://typography-74.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "admin@ridepact.com"
ADMIN_PASSWORD = "Admin@12345"
STUDENT_EMAIL = "jdoe@university.edu"
STUDENT_PASSWORD = "Passw0rd!"


def _rand(n=8):
    return "".join(random.choices(string.ascii_lowercase + string.digits, k=n))


@pytest.fixture(scope="session")
def client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="session")
def fresh_user(client):
    email = f"qa_{_rand()}@university.edu"
    password = "Passw0rd!"
    return {"email": email, "password": password}


@pytest.fixture(scope="session")
def registered_user(client, fresh_user):
    payload = {
        "email": fresh_user["email"],
        "password": fresh_user["password"],
        "username": "qauser_" + _rand(4),
        "paymentHandle": "@qa",
        "pickupAddress": "123 Test Ave",
    }
    r = client.post(f"{API}/auth/register", json=payload)
    assert r.status_code == 201, r.text
    data = r.json()
    return {**fresh_user, "devCode": data.get("devVerificationCode"), "user": data.get("user")}


@pytest.fixture(scope="session")
def verified_token(client, registered_user):
    r = client.post(f"{API}/auth/verify-email", json={
        "email": registered_user["email"],
        "code": registered_user["devCode"],
    })
    assert r.status_code == 200, r.text
    return r.json()["accessToken"]


@pytest.fixture(scope="session")
def admin_token(client):
    r = client.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["user"]["role"] == "admin"
    return body["accessToken"]


# ---------- Health ----------
class TestHealth:
    def test_health(self, client):
        r = client.get(f"{API}/health")
        assert r.status_code == 200
        assert r.json().get("status") == "ok"


# ---------- Register ----------
class TestRegister:
    def test_register_success_returns_devcode(self, registered_user):
        assert registered_user["devCode"] and len(registered_user["devCode"]) == 6
        assert registered_user["devCode"].isdigit()
        assert registered_user["user"]["email"] == registered_user["email"]

    def test_register_rejects_bad_domain(self, client):
        r = client.post(f"{API}/auth/register", json={
            "email": f"qa_{_rand()}@gmail.com",
            "password": "Passw0rd!",
        })
        assert r.status_code == 400, r.text

    def test_register_rejects_duplicate(self, client, registered_user):
        r = client.post(f"{API}/auth/register", json={
            "email": registered_user["email"],
            "password": "Passw0rd!",
        })
        assert r.status_code == 409, r.text

    def test_register_rejects_weak_password(self, client):
        r = client.post(f"{API}/auth/register", json={
            "email": f"qa_{_rand()}@university.edu",
            "password": "short",
        })
        assert r.status_code == 400, r.text


# ---------- Verify Email ----------
class TestVerifyEmail:
    def test_verify_wrong_code_returns_400(self, client):
        # register a new fresh user, then submit wrong code
        email = f"qa_{_rand()}@university.edu"
        client.post(f"{API}/auth/register", json={"email": email, "password": "Passw0rd!"})
        r = client.post(f"{API}/auth/verify-email", json={"email": email, "code": "000000"})
        # collision with actual code extremely unlikely; still safe as it must not equal
        assert r.status_code == 400, r.text

    def test_verify_success_returns_token(self, verified_token):
        assert isinstance(verified_token, str) and len(verified_token) > 20


# ---------- Login ----------
class TestLogin:
    def test_login_verified_student(self, client, registered_user, verified_token):
        r = client.post(f"{API}/auth/login", json={
            "email": registered_user["email"],
            "password": registered_user["password"],
        })
        assert r.status_code == 200, r.text
        assert "accessToken" in r.json()

    def test_login_wrong_password(self, client, registered_user, verified_token):
        r = client.post(f"{API}/auth/login", json={
            "email": registered_user["email"],
            "password": "WrongPass1!",
        })
        assert r.status_code == 401, r.text

    def test_login_unverified_returns_403(self, client):
        email = f"qa_{_rand()}@university.edu"
        pw = "Passw0rd!"
        rr = client.post(f"{API}/auth/register", json={"email": email, "password": pw})
        assert rr.status_code == 201
        r = client.post(f"{API}/auth/login", json={"email": email, "password": pw})
        assert r.status_code == 403, r.text

    def test_seeded_student_login(self, client):
        r = client.post(f"{API}/auth/login", json={"email": STUDENT_EMAIL, "password": STUDENT_PASSWORD})
        assert r.status_code == 200, r.text
        assert "accessToken" in r.json()

    def test_admin_login(self, admin_token):
        assert isinstance(admin_token, str) and len(admin_token) > 20


# ---------- Auth me ----------
class TestMe:
    def test_me_returns_user(self, client, verified_token, registered_user):
        r = client.get(f"{API}/auth/me", headers={"Authorization": f"Bearer {verified_token}"})
        assert r.status_code == 200
        assert r.json()["user"]["email"] == registered_user["email"]


# ---------- Admin role gating ----------
class TestAdminRole:
    def test_student_cannot_access_admin_health(self, client, verified_token):
        r = client.get(f"{API}/admin/health", headers={"Authorization": f"Bearer {verified_token}"})
        assert r.status_code == 403, r.text

    def test_admin_health_ok(self, client, admin_token):
        r = client.get(f"{API}/admin/health", headers={"Authorization": f"Bearer {admin_token}"})
        assert r.status_code == 200
        assert r.json().get("ok") is True

    def test_admin_stats_ok(self, client, admin_token):
        r = client.get(f"{API}/admin/stats", headers={"Authorization": f"Bearer {admin_token}"})
        assert r.status_code == 200
        body = r.json()
        for k in ["totalStudents", "activeStudents", "totalRides", "activeRides",
                  "completedRides", "cancelledRides", "activeGroups", "upcomingEvents"]:
            assert k in body, f"missing key {k} in stats"
            assert isinstance(body[k], int)


# ---------- Forgot / Reset password ----------
class TestPasswordReset:
    def test_forgot_and_reset_flow(self, client, registered_user):
        email = registered_user["email"]
        r = client.post(f"{API}/auth/forgot-password", json={"email": email})
        assert r.status_code == 200, r.text
        token = r.json().get("devResetToken")
        assert token, "devResetToken should be present in DEV_MODE"

        new_password = "NewPassw0rd!"
        rr = client.post(f"{API}/auth/reset-password", json={
            "email": email, "token": token, "newPassword": new_password
        })
        assert rr.status_code == 200, rr.text

        # new password logs in
        rl = client.post(f"{API}/auth/login", json={"email": email, "password": new_password})
        assert rl.status_code == 200, rl.text
        # update the fixture-tracked password for subsequent tests (if any)
        registered_user["password"] = new_password


# ---------- User profile update ----------
class TestUserProfile:
    def test_patch_users_me(self, client, verified_token):
        new_handle = "@qa_" + _rand(4)
        r = client.patch(f"{API}/users/me",
                         headers={"Authorization": f"Bearer {verified_token}"},
                         json={"paymentHandle": new_handle})
        assert r.status_code == 200, r.text
        body = r.json()
        # Response shape can be {user:{}} or user directly – handle both
        user = body.get("user", body)
        assert user.get("paymentHandle") == new_handle


# ---------- Public reference lists ----------
class TestPublicLists:
    def test_universities(self, client):
        r = client.get(f"{API}/universities")
        assert r.status_code == 200, r.text
        data = r.json()
        items = data if isinstance(data, list) else data.get("data", data.get("items", data.get("universities", [])))
        names = [u.get("name") for u in items]
        assert any("State University" in (n or "") for n in names), f"State University not in {names}"

    def test_airports(self, client):
        r = client.get(f"{API}/airports")
        assert r.status_code == 200

    def test_destinations(self, client):
        r = client.get(f"{API}/destinations")
        assert r.status_code == 200

    def test_calendar(self, client):
        r = client.get(f"{API}/calendar")
        assert r.status_code == 200
