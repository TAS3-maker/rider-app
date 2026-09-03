"""
RidePact Phase 4 — Admin API tests
Serial run: `pytest /app/backend/tests/test_ridepact_phase4_admin.py -o addopts='-n 0'`
"""
import os
import random
import string
from datetime import datetime, timedelta, timezone

import pytest
import requests

BASE_URL = os.environ.get(
    "EXPO_PUBLIC_BACKEND_URL",
    "https://typography-74.preview.emergentagent.com",
).rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "admin@ridepact.com"
ADMIN_PASSWORD = "Admin@12345"
STUDENT_EMAIL = "jdoe@university.edu"
STUDENT_PASSWORD = "Passw0rd!"

INVALID_OID = "not-a-valid-id"
NONEXISTENT_OID = "000000000000000000000000"


def _rand(n=6):
    return "".join(random.choices(string.ascii_lowercase + string.digits, k=n))


def _iso(dt):
    return dt.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")


def hdr(tok):
    return {"Authorization": f"Bearer {tok}", "Content-Type": "application/json"}


@pytest.fixture(scope="module")
def state():
    return {}


@pytest.fixture(scope="module")
def http():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def admin_token(http):
    r = http.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, f"admin login failed: {r.status_code} {r.text}"
    return r.json()["accessToken"]


@pytest.fixture(scope="module")
def student_token(http):
    r = http.post(f"{API}/auth/login", json={"email": STUDENT_EMAIL, "password": STUDENT_PASSWORD})
    assert r.status_code == 200, f"student login failed: {r.status_code} {r.text}"
    return r.json()["accessToken"]


# =================== AUTH / RBAC ===================
ADMIN_ENDPOINTS = [
    ("GET", "/admin/dashboard"),
    ("GET", "/admin/users"),
    ("GET", "/admin/trips"),
    ("GET", "/admin/groups"),
    ("GET", "/admin/events"),
    ("GET", "/admin/schools"),
    ("GET", "/admin/destinations"),
    ("GET", "/admin/pickups"),
    ("GET", "/admin/events/calendar"),
    ("GET", "/admin/notifications/history"),
    ("GET", "/admin/settings"),
    ("GET", "/admin/resolutions"),
    ("GET", "/admin/stats"),
]


class TestAdminRBAC:
    """Every /api/admin/* endpoint must require role=admin."""

    @pytest.mark.parametrize("method,path", ADMIN_ENDPOINTS)
    def test_student_gets_403(self, http, student_token, method, path):
        r = http.request(method, f"{API}{path}", headers=hdr(student_token))
        assert r.status_code == 403, f"{method} {path} expected 403, got {r.status_code}: {r.text[:200]}"

    @pytest.mark.parametrize("method,path", ADMIN_ENDPOINTS)
    def test_admin_gets_200(self, http, admin_token, method, path):
        r = http.request(method, f"{API}{path}", headers=hdr(admin_token))
        assert r.status_code == 200, f"{method} {path} expected 200, got {r.status_code}: {r.text[:200]}"

    def test_missing_token_401(self, http):
        r = http.get(f"{API}/admin/dashboard")
        assert r.status_code in (401, 403), f"unauthenticated should be 401/403, got {r.status_code}"


# =================== DASHBOARD ===================
class TestDashboard:
    def test_dashboard_shape_and_numeric(self, http, admin_token):
        r = http.get(f"{API}/admin/dashboard", headers=hdr(admin_token))
        assert r.status_code == 200
        b = r.json()
        required_numeric = ["totalUsers", "activeStudents", "activeTrips",
                            "completedRides", "cancelledRides", "activeGroups",
                            "upcomingEvents", "avgRidersPerGroup", "avgReliability"]
        for k in required_numeric:
            assert k in b, f"missing {k}"
            assert b[k] is not None, f"{k} is None"
            assert isinstance(b[k], (int, float)), f"{k} must be numeric, got {type(b[k]).__name__}"
        assert "matchToCompleteRate" in b and b["matchToCompleteRate"] is not None


# =================== USERS ===================
class TestUsers:
    def test_list_shape_and_mapped_fields(self, http, admin_token, state):
        r = http.get(f"{API}/admin/users?limit=50", headers=hdr(admin_token))
        assert r.status_code == 200, r.text
        b = r.json()
        assert isinstance(b.get("data"), list), "data must be list"
        assert b["total"] >= 1
        assert len(b["data"]) >= 1
        u = b["data"][0]
        required = ["id", "name", "email", "school", "paymentHandle",
                    "ridesCount", "reliabilityRating", "status", "verificationStatus"]
        for k in required:
            assert k in u, f"user missing {k}: {list(u.keys())}"
        assert u["status"] in ("active", "inactive")
        assert u["verificationStatus"] in ("verified", "pending")
        # find jdoe
        jdoe = next((x for x in b["data"] if x["email"] == STUDENT_EMAIL), None)
        assert jdoe is not None, "seeded student jdoe should appear in list"
        state["jdoe_id"] = jdoe["id"]
        state["jdoe_status"] = jdoe["status"]

    def test_search_filter(self, http, admin_token):
        r = http.get(f"{API}/admin/users?search=jdoe", headers=hdr(admin_token))
        assert r.status_code == 200
        data = r.json()["data"]
        assert any(u["email"] == STUDENT_EMAIL for u in data)

    def test_status_filter_active(self, http, admin_token):
        r = http.get(f"{API}/admin/users?status=active", headers=hdr(admin_token))
        assert r.status_code == 200
        for u in r.json()["data"]:
            assert u["status"] == "active"

    def test_verification_filter_verified(self, http, admin_token):
        r = http.get(f"{API}/admin/users?verification=verified", headers=hdr(admin_token))
        assert r.status_code == 200
        for u in r.json()["data"]:
            assert u["verificationStatus"] == "verified"

    def test_get_single_user(self, http, admin_token, state):
        uid = state["jdoe_id"]
        r = http.get(f"{API}/admin/users/{uid}", headers=hdr(admin_token))
        assert r.status_code == 200
        b = r.json()
        assert b["id"] == uid
        assert b["email"] == STUDENT_EMAIL

    def test_get_user_invalid_id_400(self, http, admin_token):
        r = http.get(f"{API}/admin/users/{INVALID_OID}", headers=hdr(admin_token))
        assert r.status_code == 400, f"expected 400 for invalid id, got {r.status_code}"

    def test_get_user_404(self, http, admin_token):
        r = http.get(f"{API}/admin/users/{NONEXISTENT_OID}", headers=hdr(admin_token))
        assert r.status_code == 404

    def test_user_rides_endpoint(self, http, admin_token, state):
        uid = state["jdoe_id"]
        r = http.get(f"{API}/admin/users/{uid}/rides", headers=hdr(admin_token))
        assert r.status_code == 200
        assert isinstance(r.json()["data"], list)

    def test_user_rides_invalid_id_400(self, http, admin_token):
        r = http.get(f"{API}/admin/users/{INVALID_OID}/rides", headers=hdr(admin_token))
        assert r.status_code == 400

    def test_deactivate_then_reactivate_user(self, http, admin_token, state):
        uid = state["jdoe_id"]
        # Deactivate
        r = http.patch(f"{API}/admin/users/{uid}/status",
                       headers=hdr(admin_token), json={"status": "inactive"})
        assert r.status_code == 200, r.text
        assert r.json()["status"] == "inactive"
        # Verify via GET
        g = http.get(f"{API}/admin/users/{uid}", headers=hdr(admin_token))
        assert g.json()["status"] == "inactive"
        # Reactivate to leave state clean
        r2 = http.patch(f"{API}/admin/users/{uid}/status",
                        headers=hdr(admin_token), json={"status": "active"})
        assert r2.status_code == 200
        assert r2.json()["status"] == "active"

    def test_patch_status_invalid_id_400(self, http, admin_token):
        r = http.patch(f"{API}/admin/users/{INVALID_OID}/status",
                       headers=hdr(admin_token), json={"status": "inactive"})
        assert r.status_code == 400


# =================== TRIPS ===================
class TestTrips:
    def test_list_shape(self, http, admin_token, state):
        r = http.get(f"{API}/admin/trips?limit=20", headers=hdr(admin_token))
        assert r.status_code == 200, r.text
        b = r.json()
        assert isinstance(b.get("data"), list)
        if b["data"]:
            t = b["data"][0]
            for k in ["id", "route", "date", "flightTime", "status",
                      "bookerName", "groupId", "fareEstimate"]:
                assert k in t, f"trip missing {k}"
            state["trip_id"] = t.get("_id")

    def test_get_trip_by_id(self, http, admin_token, state):
        tid = state.get("trip_id")
        if not tid:
            pytest.skip("no trip present")
        r = http.get(f"{API}/admin/trips/{tid}", headers=hdr(admin_token))
        assert r.status_code == 200
        assert "id" in r.json() and "route" in r.json()

    def test_trips_status_filter(self, http, admin_token):
        r = http.get(f"{API}/admin/trips?status=completed", headers=hdr(admin_token))
        assert r.status_code == 200


# =================== GROUPS ===================
class TestGroups:
    def test_list_shape(self, http, admin_token, state):
        r = http.get(f"{API}/admin/groups?limit=20", headers=hdr(admin_token))
        assert r.status_code == 200, r.text
        b = r.json()
        assert isinstance(b.get("data"), list)
        if b["data"]:
            g = b["data"][0]
            for k in ["id", "tripId", "type", "status", "capacity", "riders"]:
                assert k in g, f"group missing {k}"
            assert isinstance(g["riders"], list)
            state["group_id"] = g["_id"]

    def test_get_group_by_id(self, http, admin_token, state):
        gid = state.get("group_id")
        if not gid:
            pytest.skip("no group")
        r = http.get(f"{API}/admin/groups/{gid}", headers=hdr(admin_token))
        assert r.status_code == 200
        assert "riders" in r.json()

    def test_get_group_invalid_returns_404_not_500(self, http, admin_token):
        # invalid or nonexistent — must not 500
        r = http.get(f"{API}/admin/groups/{NONEXISTENT_OID}", headers=hdr(admin_token))
        assert r.status_code in (400, 404), f"expected 400/404, got {r.status_code}"


# =================== EVENT LOG ===================
class TestEventLog:
    def test_list(self, http, admin_token):
        r = http.get(f"{API}/admin/events?limit=20", headers=hdr(admin_token))
        assert r.status_code == 200
        b = r.json()
        assert isinstance(b.get("data"), list)
        if b["data"]:
            e = b["data"][0]
            for k in ["id", "timestamp", "eventType", "user", "details"]:
                assert k in e, f"event missing {k}"


# =================== SCHOOLS ===================
class TestSchools:
    def test_list(self, http, admin_token):
        r = http.get(f"{API}/admin/schools", headers=hdr(admin_token))
        assert r.status_code == 200
        b = r.json()
        assert isinstance(b.get("data"), list)
        assert len(b["data"]) >= 1
        s = b["data"][0]
        for k in ["id", "name", "domain", "status"]:
            assert k in s

    def test_create_and_duplicate_409(self, http, admin_token, state):
        domain = f"test-{_rand()}.edu"
        payload = {"name": f"TEST_University_{_rand()}", "shortName": "TESTU",
                   "domain": domain, "status": "Live"}
        r = http.post(f"{API}/admin/schools", headers=hdr(admin_token), json=payload)
        assert r.status_code == 201, r.text
        b = r.json()
        assert b["name"] == payload["name"]
        assert b["domain"] == domain
        assert b["status"] == "Live"
        state["school_id"] = b["id"]
        # duplicate domain
        r2 = http.post(f"{API}/admin/schools", headers=hdr(admin_token),
                       json={"name": "Dup", "domain": domain})
        assert r2.status_code == 409, f"duplicate domain should 409, got {r2.status_code}"

    def test_patch_school(self, http, admin_token, state):
        sid = state.get("school_id")
        if not sid:
            pytest.skip("no school id")
        r = http.patch(f"{API}/admin/schools/{sid}",
                       headers=hdr(admin_token), json={"shortName": "TU2", "status": "Paused"})
        assert r.status_code == 200
        b = r.json()
        assert b["shortName"] == "TU2"
        assert b["status"] == "Paused"

    def test_patch_school_invalid_id_400(self, http, admin_token):
        r = http.patch(f"{API}/admin/schools/{INVALID_OID}",
                       headers=hdr(admin_token), json={"shortName": "X"})
        assert r.status_code == 400


# =================== DESTINATIONS ===================
class TestDestinations:
    def test_crud(self, http, admin_token, state):
        r = http.get(f"{API}/admin/destinations", headers=hdr(admin_token))
        assert r.status_code == 200

        # create
        c = http.post(f"{API}/admin/destinations", headers=hdr(admin_token),
                      json={"name": f"TEST_Dest_{_rand()}", "type": "campus",
                            "address": "1 Test Rd", "status": "Active"})
        assert c.status_code == 201, c.text
        d = c.json()
        assert d["status"] == "Active"
        state["dest_id"] = d["id"]

        # patch to inactive
        p = http.patch(f"{API}/admin/destinations/{d['id']}",
                       headers=hdr(admin_token), json={"status": "Inactive"})
        assert p.status_code == 200
        assert p.json()["status"] == "Inactive"

    def test_patch_dest_invalid_id_400(self, http, admin_token):
        r = http.patch(f"{API}/admin/destinations/{INVALID_OID}",
                       headers=hdr(admin_token), json={"status": "Active"})
        assert r.status_code == 400


# =================== PICKUPS / AIRPORTS ===================
class TestPickups:
    def test_list_and_create_duplicate_409(self, http, admin_token, state):
        r = http.get(f"{API}/admin/pickups", headers=hdr(admin_token))
        assert r.status_code == 200
        data = r.json()["data"]
        assert isinstance(data, list)

        # create new unique 3-letter code
        code = _rand(3).upper()
        c = http.post(f"{API}/admin/pickups", headers=hdr(admin_token),
                      json={"name": f"TEST_Airport_{_rand()}", "code": code,
                            "address": "TestCity", "baseFare": 42, "status": "Active"})
        assert c.status_code == 201, c.text
        state["pickup_id"] = c.json()["id"]
        state["pickup_code"] = code

        # duplicate code
        d = http.post(f"{API}/admin/pickups", headers=hdr(admin_token),
                      json={"name": "Dup", "code": code})
        assert d.status_code == 409, f"duplicate code should 409, got {d.status_code} {d.text}"

    def test_patch_pickup(self, http, admin_token, state):
        pid = state.get("pickup_id")
        if not pid:
            pytest.skip("no pickup")
        r = http.patch(f"{API}/admin/pickups/{pid}",
                       headers=hdr(admin_token), json={"baseFare": 99, "status": "Inactive"})
        assert r.status_code == 200
        assert r.json()["status"] == "Inactive"


# =================== BREAK CALENDAR (TravelEvents) ===================
class TestBreakCalendar:
    def test_list_has_demand(self, http, admin_token):
        r = http.get(f"{API}/admin/events/calendar", headers=hdr(admin_token))
        assert r.status_code == 200
        data = r.json()["data"]
        assert isinstance(data, list)
        if data:
            e = data[0]
            for k in ["id", "title", "demandCount", "demand"]:
                assert k in e, f"event missing {k}: {list(e.keys())}"
            assert e["demand"] in ("Low", "Medium", "High", "Very High")
            assert isinstance(e["demandCount"], int)

    def test_full_crud_and_soft_delete_and_notify(self, http, admin_token, state):
        start = datetime.now(timezone.utc) + timedelta(days=45)
        end = start + timedelta(days=3)
        payload = {"title": f"TEST_Break_{_rand()}", "description": "phase4 crud",
                   "startDate": _iso(start), "endDate": _iso(end),
                   "visibility": True, "type": "holiday"}
        c = http.post(f"{API}/admin/events/calendar", headers=hdr(admin_token), json=payload)
        assert c.status_code == 201, c.text
        eid = c.json()["id"]

        # patch
        p = http.patch(f"{API}/admin/events/calendar/{eid}",
                       headers=hdr(admin_token), json={"description": "updated"})
        assert p.status_code == 200

        # trigger-notification
        tn = http.post(f"{API}/admin/events/calendar/{eid}/trigger-notification",
                       headers=hdr(admin_token), json={"type": "14d"})
        assert tn.status_code == 200
        assert tn.json().get("notification14dSent") is True

        # delete → soft (visible=false)
        d = http.delete(f"{API}/admin/events/calendar/{eid}", headers=hdr(admin_token))
        assert d.status_code == 200
        after = http.get(f"{API}/admin/events/calendar", headers=hdr(admin_token)).json()["data"]
        ent = next((e for e in after if e["id"] == eid), None)
        # allowed to still appear in admin list but must be flagged Hidden
        if ent is not None:
            assert ent.get("visibility") in (False, None) or ent.get("status") == "Hidden"

    def test_calendar_invalid_id_400(self, http, admin_token):
        r = http.patch(f"{API}/admin/events/calendar/{INVALID_OID}",
                       headers=hdr(admin_token), json={"description": "x"})
        assert r.status_code == 400


# =================== NOTIFICATIONS (broadcast) ===================
class TestBroadcastNotifications:
    def test_broadcast_and_history(self, http, admin_token, student_token):
        title = f"TEST_Announcement_{_rand()}"
        message = "Phase 4 broadcast test"
        r = http.post(f"{API}/admin/notifications",
                      headers=hdr(admin_token), json={"title": title, "message": message})
        assert r.status_code == 201, r.text
        b = r.json()
        assert b["title"] == title
        assert isinstance(b["deliveredCount"], int)
        assert b["deliveredCount"] >= 1

        # history should aggregate it
        h = http.get(f"{API}/admin/notifications/history", headers=hdr(admin_token))
        assert h.status_code == 200
        titles = [row["title"] for row in h.json()["data"]]
        assert title in titles, f"broadcast '{title}' missing from history: {titles[:5]}"

        # student should now see it
        n = http.get(f"{API}/notifications?page=1&limit=20", headers=hdr(student_token))
        assert n.status_code == 200
        student_titles = [x.get("title") for x in n.json().get("data", [])]
        assert title in student_titles, "student did not receive announcement"

    def test_broadcast_validation(self, http, admin_token):
        r = http.post(f"{API}/admin/notifications",
                      headers=hdr(admin_token), json={"title": "only"})
        assert r.status_code == 400


# =================== SETTINGS ===================
class TestSettings:
    def test_get_defaults_merged(self, http, admin_token):
        r = http.get(f"{API}/admin/settings", headers=hdr(admin_token))
        assert r.status_code == 200
        b = r.json()
        for k in ["platformName", "supportEmail", "maxGroupSize",
                  "matchingTimeWindowMinutes", "notificationTriggers"]:
            assert k in b, f"settings missing {k}"

    def test_patch_persists_and_syncs(self, http, admin_token):
        new_val = random.randint(90, 150)
        r = http.patch(f"{API}/admin/settings", headers=hdr(admin_token),
                       json={"matchingTimeWindowMinutes": new_val, "maxGroupSize": 4})
        assert r.status_code == 200
        assert r.json()["matchingTimeWindowMinutes"] == new_val
        # re-GET
        g = http.get(f"{API}/admin/settings", headers=hdr(admin_token))
        assert g.json()["matchingTimeWindowMinutes"] == new_val

    def test_reset(self, http, admin_token):
        r = http.post(f"{API}/admin/settings/reset", headers=hdr(admin_token), json={})
        assert r.status_code == 200
        b = r.json()
        assert b["matchingTimeWindowMinutes"] == 120
        assert b["maxGroupSize"] == 4


# =================== RESOLUTIONS ===================
class TestResolutions:
    def test_shape(self, http, admin_token):
        r = http.get(f"{API}/admin/resolutions", headers=hdr(admin_token))
        assert r.status_code == 200
        b = r.json()
        for k in ["bookerNeeded", "missingInfo", "paymentDisputes", "fareDisputes"]:
            assert k in b, f"resolutions missing {k}"
            assert isinstance(b[k], list)

    def test_resolve_invalid_id_400(self, http, admin_token):
        r = http.post(f"{API}/admin/resolutions/missing-info/{INVALID_OID}/resolve",
                      headers=hdr(admin_token), json={})
        assert r.status_code == 400

    def test_assign_booker_invalid_id_400(self, http, admin_token):
        r = http.post(f"{API}/admin/resolutions/booker/{INVALID_OID}/assign",
                      headers=hdr(admin_token), json={"userId": NONEXISTENT_OID})
        assert r.status_code == 400
