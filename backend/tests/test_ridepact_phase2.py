"""
RidePact Phase 2 backend tests — ride coordination:
matching, groups, fares, lifecycle & edge-case flags.
Uses two verified @university.edu students (Student A = seeded jdoe,
Student B = freshly registered per run).
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

STUDENT_A_EMAIL = "jdoe@university.edu"
STUDENT_A_PASSWORD = "Passw0rd!"

DIR_TO = "university_to_airport"
DIR_FROM = "airport_to_university"


def _rand(n=8):
    return "".join(random.choices(string.ascii_lowercase + string.digits, k=n))


def _iso(dt):
    return dt.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")


# ---------- session state shared across tests ----------

@pytest.fixture(scope="module")
def state():
    return {}


@pytest.fixture(scope="module")
def http():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def airports(http):
    r = http.get(f"{API}/airports")
    assert r.status_code == 200
    items = r.json().get("data") or r.json()
    by_code = {a["code"]: a["id"] for a in items}
    assert "DTW" in by_code and "ORD" in by_code
    return by_code


@pytest.fixture(scope="module")
def student_a(http):
    r = http.post(f"{API}/auth/login", json={"email": STUDENT_A_EMAIL, "password": STUDENT_A_PASSWORD})
    assert r.status_code == 200, r.text
    return {"token": r.json()["accessToken"], "user": r.json()["user"]}


@pytest.fixture(scope="module")
def student_b(http):
    email = f"qa_{_rand()}@university.edu"
    password = "Passw0rd!"
    reg = http.post(f"{API}/auth/register", json={
        "email": email, "password": password,
        "username": "qauser_" + _rand(4),
        "paymentHandle": "@qab",
        "pickupAddress": "500 Test Blvd",
    })
    assert reg.status_code == 201, reg.text
    code = reg.json().get("devVerificationCode")
    assert code, "devVerificationCode must be present in DEV_MODE"
    vr = http.post(f"{API}/auth/verify-email", json={"email": email, "code": code})
    assert vr.status_code == 200, vr.text
    return {"token": vr.json()["accessToken"], "user": vr.json()["user"], "email": email, "password": password}


def hdr(tok):
    return {"Authorization": f"Bearer {tok}", "Content-Type": "application/json"}


def make_ride_payload(direction, airport_id, base_dt, mode=None, bags=1, flexible=False):
    payload = {
        "direction": direction,
        "airport": airport_id,
        "travelDate": _iso(base_dt.replace(hour=0, minute=0, second=0, microsecond=0)),
        "flightTime": _iso(base_dt),
        "checkedBags": bags,
        "flexible": flexible,
        "pickupLocation": "Campus Hub",
    }
    if mode:
        payload["mode"] = mode
    return payload


# ---------- 1. createRide public mode ----------

class TestCreateRideAndMatch:
    def test_create_public_ride_a(self, http, student_a, airports, state):
        base = (datetime.now(timezone.utc) + timedelta(days=10)).replace(hour=14, minute=0, second=0, microsecond=0)
        payload = make_ride_payload(DIR_TO, airports["DTW"], base, mode="public")
        r = http.post(f"{API}/rides", headers=hdr(student_a["token"]), json=payload)
        assert r.status_code == 201, r.text
        body = r.json()
        assert body.get("mode") == "public"
        assert "ride" in body and "id" in body["ride"]
        assert "candidates" in body and isinstance(body["candidates"], list)
        assert "matchCount" in body
        state["rideA_id"] = body["ride"]["id"]
        state["baseDT"] = base
        state["dtw"] = airports["DTW"]
        state["ord"] = airports["ORD"]
        state["jfk"] = airports["JFK"]

    def test_a_creates_group_from_ride(self, http, student_a, state):
        r = http.post(f"{API}/groups", headers=hdr(student_a["token"]),
                      json={"rideId": state["rideA_id"]})
        assert r.status_code == 201, r.text
        g = r.json()["data"]
        assert g["memberCount"] == 1
        assert g["status"] == "open"
        # booker set → check members has isBooker true
        assert any(m.get("isBooker") for m in g.get("members", []))
        state["groupA_id"] = g["id"]

    def test_b_creates_matching_ride_and_finds_group(self, http, student_b, state):
        base = state["baseDT"] + timedelta(minutes=45)  # within 120-min window
        payload = make_ride_payload(DIR_TO, state["dtw"], base, mode="public")
        r = http.post(f"{API}/rides", headers=hdr(student_b["token"]), json=payload)
        assert r.status_code == 201, r.text
        body = r.json()
        assert body["matchCount"] >= 1
        cand_ids = [c["id"] for c in body["candidates"]]
        assert state["groupA_id"] in cand_ids, f"expected group A in candidates, got {cand_ids}"
        state["rideB_id"] = body["ride"]["id"]

    def test_b_no_match_when_different_airport(self, http, student_b, state):
        base = state["baseDT"] + timedelta(minutes=15)
        payload = make_ride_payload(DIR_TO, state["ord"], base, mode="public")
        r = http.post(f"{API}/rides", headers=hdr(student_b["token"]), json=payload)
        assert r.status_code == 201
        assert r.json()["matchCount"] == 0

    def test_no_match_wrong_direction(self, http, student_b, state):
        payload = make_ride_payload(DIR_FROM, state["dtw"], state["baseDT"], mode="public")
        r = http.post(f"{API}/rides", headers=hdr(student_b["token"]), json=payload)
        assert r.status_code == 201
        assert r.json()["matchCount"] == 0

    def test_no_match_different_date(self, http, student_b, state):
        base = state["baseDT"] + timedelta(days=5)
        payload = make_ride_payload(DIR_TO, state["dtw"], base, mode="public")
        r = http.post(f"{API}/rides", headers=hdr(student_b["token"]), json=payload)
        assert r.status_code == 201
        assert r.json()["matchCount"] == 0


# ---------- 2. Private mode ----------

class TestPrivateMode:
    def test_private_ride_returns_invite(self, http, student_a, state):
        base = (datetime.now(timezone.utc) + timedelta(days=20)).replace(hour=8, minute=0, second=0, microsecond=0)
        payload = make_ride_payload(DIR_TO, state["jfk"], base, mode="private")
        r = http.post(f"{API}/rides", headers=hdr(student_a["token"]), json=payload)
        assert r.status_code == 201, r.text
        body = r.json()
        assert body.get("mode") == "private"
        assert body.get("inviteCode"), "inviteCode required"
        assert body.get("group") and body["group"]["memberCount"] == 1


# ---------- 3. Join / capacity / pickup address gating ----------

class TestGroupJoin:
    def test_b_joins_group_a(self, http, student_b, state):
        r = http.post(f"{API}/groups/{state['groupA_id']}/join",
                      headers=hdr(student_b["token"]),
                      json={"rideId": state["rideB_id"]})
        assert r.status_code == 200, r.text
        g = r.json()["data"]
        assert g["memberCount"] == 2
        assert g["status"] in ("open", "nearly_full")
        assert g.get("vehicleSuggestion")
        assert isinstance(g.get("perPerson"), (int, float)) and g["perPerson"] > 0

    def test_pickup_address_visible_to_booker_only(self, http, student_a, student_b, state):
        # Booker (A) sees pickup addresses
        r = http.get(f"{API}/groups/{state['groupA_id']}", headers=hdr(student_a["token"]))
        assert r.status_code == 200
        gA = r.json()["data"]
        has_addr_a = any(m.get("pickupAddress") for m in gA.get("members", []))
        assert has_addr_a, "booker should see pickup addresses"

        # Non-booker (B) should not see pickup addresses
        r2 = http.get(f"{API}/groups/{state['groupA_id']}", headers=hdr(student_b["token"]))
        assert r2.status_code == 200
        gB = r2.json()["data"]
        has_addr_b = any(m.get("pickupAddress") for m in gB.get("members", []))
        assert not has_addr_b, "non-booker must NOT see pickup addresses"

    def test_browse_pagination_shape(self, http, student_a):
        r = http.get(f"{API}/groups?page=1&limit=5", headers=hdr(student_a["token"]))
        assert r.status_code == 200, r.text
        b = r.json()
        for k in ["data", "page", "limit", "total", "totalPages"]:
            assert k in b, f"missing {k}"
        assert b["page"] == 1 and b["limit"] == 5


# ---------- 4. Fare split ----------

class TestFareSplit:
    def test_enter_fare_as_booker(self, http, student_a, state):
        r = http.post(f"{API}/fares/{state['groupA_id']}",
                      headers=hdr(student_a["token"]),
                      json={"totalCost": 60.00})
        assert r.status_code == 200, r.text
        data = r.json().get("data", r.json())
        fare = data.get("fare") or {}
        shares = fare.get("shares") or []
        assert len(shares) == 2, f"expected 2 shares got {shares}"
        total = round(sum(s["amount"] for s in shares), 2)
        assert abs(total - 60.00) < 0.05, f"shares must sum to total, got {total}"

    def test_non_booker_cannot_enter_fare(self, http, student_b, state):
        r = http.post(f"{API}/fares/{state['groupA_id']}",
                      headers=hdr(student_b["token"]),
                      json={"totalCost": 80.00})
        assert r.status_code in (403, 401), r.text

    def test_reenter_fare_sets_changed_flag_preserves_confirms(self, http, student_a, student_b, state):
        # B confirms his own share first
        c1 = http.post(f"{API}/fares/{state['groupA_id']}/confirm",
                       headers=hdr(student_b["token"]), json={})
        assert c1.status_code == 200, c1.text
        # Booker re-enters different total
        r = http.post(f"{API}/fares/{state['groupA_id']}",
                      headers=hdr(student_a["token"]),
                      json={"totalCost": 72.50})
        assert r.status_code == 200, r.text
        data = r.json().get("data", r.json())
        fare = data.get("fare") or {}
        assert fare.get("fareChanged") is True, "fareChanged flag must be set on re-entry"
        b_uid = str(student_b["user"]["id"])
        b_share = next((s for s in fare.get("shares", []) if str(s.get("user")) == b_uid), None)
        assert b_share is not None, f"Could not locate B's share in {fare.get('shares')}"
        assert b_share.get("paymentConfirmed") is True, "prior paymentConfirmed must be preserved after fareChanged"

    def test_booker_confirms_on_behalf(self, http, student_a, state):
        r = http.post(f"{API}/fares/{state['groupA_id']}/confirm",
                      headers=hdr(student_a["token"]),
                      json={"userId": str(student_a_user_id_cache["id"])})
        assert r.status_code == 200, r.text


student_a_user_id_cache = {}


def http_user_id(who):
    return who["user"]["id"]


@pytest.fixture(scope="module", autouse=True)
def _prime_a_id(student_a):
    student_a_user_id_cache["id"] = student_a["user"]["id"]
    yield


# ---------- 5. Book, Complete, History, Cancel ----------

class TestLifecycle:
    def test_book_group_as_booker(self, http, student_a, state):
        r = http.post(f"{API}/groups/{state['groupA_id']}/book",
                      headers=hdr(student_a["token"]), json={})
        assert r.status_code == 200, r.text
        assert r.json()["data"]["status"] == "confirmed"

    def test_non_booker_cannot_book(self, http, student_b, state):
        r = http.post(f"{API}/groups/{state['groupA_id']}/book",
                      headers=hdr(student_b["token"]), json={})
        assert r.status_code == 403, r.text

    def test_complete_group(self, http, student_a, state):
        r = http.post(f"{API}/groups/{state['groupA_id']}/complete",
                      headers=hdr(student_a["token"]), json={})
        assert r.status_code == 200, r.text
        assert r.json()["data"]["status"] == "completed"

    def test_history_shape_and_summary(self, http, student_a, state):
        r = http.get(f"{API}/rides/history?page=1&limit=10", headers=hdr(student_a["token"]))
        assert r.status_code == 200, r.text
        b = r.json()
        for k in ["data", "page", "limit", "total", "totalPages", "summary"]:
            assert k in b, f"missing {k}"
        for k in ["completedRides", "totalSaved"]:
            assert k in b["summary"], f"summary missing {k}"
        # completed groupA should be present with fare fields
        hit = next((it for it in b["data"] if it["id"] == state["groupA_id"]), None)
        assert hit is not None, "completed groupA missing from history"
        for k in ["direction", "travelDate", "riders", "totalFare", "yourShare", "saved", "paymentConfirmed"]:
            assert k in hit, f"history item missing {k}"


# ---------- 6. Edge case: rematchNeeded on flightTime PATCH ----------

class TestRematchFlag:
    def test_flight_time_change_sets_rematch(self, http, student_a, state):
        # New group scenario — create fresh ride & group for A
        base = (datetime.now(timezone.utc) + timedelta(days=30)).replace(hour=9, minute=0, second=0, microsecond=0)
        payload = make_ride_payload(DIR_TO, state["dtw"], base, mode="public")
        r = http.post(f"{API}/rides", headers=hdr(student_a["token"]), json=payload)
        assert r.status_code == 201
        ride_id = r.json()["ride"]["id"]
        cg = http.post(f"{API}/groups", headers=hdr(student_a["token"]), json={"rideId": ride_id})
        assert cg.status_code == 201, cg.text
        group_id = cg.json()["data"]["id"]
        # PATCH ride.flightTime → group.rematchNeeded should be True
        new_ft = _iso(base + timedelta(hours=3))
        pr = http.patch(f"{API}/rides/{ride_id}", headers=hdr(student_a["token"]),
                        json={"flightTime": new_ft})
        assert pr.status_code == 200, pr.text
        gr = http.get(f"{API}/groups/{group_id}", headers=hdr(student_a["token"]))
        assert gr.status_code == 200
        assert gr.json()["data"].get("rematchNeeded") is True, "group.rematchNeeded should be true after flightTime change"


# ---------- 7. Leave flows / no-booker flag ----------

class TestLeaveFlows:
    """Fresh scenario: A creates group, B joins, then A (booker) leaves → noBookerFlag true."""

    def test_a_leaves_booker_flag(self, http, student_a, student_b, state):
        base = (datetime.now(timezone.utc) + timedelta(days=40)).replace(hour=12, minute=0, second=0, microsecond=0)
        # A ride
        pa = make_ride_payload(DIR_TO, state["dtw"], base, mode="public")
        rA = http.post(f"{API}/rides", headers=hdr(student_a["token"]), json=pa)
        assert rA.status_code == 201
        rideA = rA.json()["ride"]["id"]
        cg = http.post(f"{API}/groups", headers=hdr(student_a["token"]), json={"rideId": rideA})
        assert cg.status_code == 201, cg.text
        group_id = cg.json()["data"]["id"]

        # B ride matching, joins
        rB = http.post(f"{API}/rides", headers=hdr(student_b["token"]),
                       json=make_ride_payload(DIR_TO, state["dtw"], base + timedelta(minutes=20), mode="public"))
        assert rB.status_code == 201
        rideB = rB.json()["ride"]["id"]
        j = http.post(f"{API}/groups/{group_id}/join",
                      headers=hdr(student_b["token"]), json={"rideId": rideB})
        assert j.status_code == 200, j.text

        # A (booker) leaves — should clear bookerId & set noBookerFlag
        lv = http.post(f"{API}/groups/{group_id}/leave", headers=hdr(student_a["token"]), json={})
        assert lv.status_code == 200, lv.text
        gr = http.get(f"{API}/groups/{group_id}", headers=hdr(student_b["token"]))
        assert gr.status_code == 200
        gd = gr.json()["data"]
        assert gd.get("noBookerFlag") is True, f"noBookerFlag should be true, got {gd.get('noBookerFlag')}"
        assert gd["memberCount"] == 1

        # B (only member, was not booker) can accept vacant booker role
        sb = http.post(f"{API}/groups/{group_id}/booker",
                       headers=hdr(student_b["token"]),
                       json={"userId": student_b["user"]["id"]})
        assert sb.status_code == 200, sb.text
        gd2 = sb.json()["data"]
        assert gd2.get("noBookerFlag") is False or gd2.get("noBookerFlag") is None

        # Now B leaves — last member → group cancelled
        lv2 = http.post(f"{API}/groups/{group_id}/leave", headers=hdr(student_b["token"]), json={})
        assert lv2.status_code == 200, lv2.text
        gr2 = http.get(f"{API}/groups/{group_id}", headers=hdr(student_b["token"]))
        assert gr2.status_code == 200
        assert gr2.json()["data"]["status"] == "cancelled"


# ---------- 8. Capacity 409 ----------

class TestCapacity:
    def test_full_group_returns_409(self, http, student_a, student_b, state):
        base = (datetime.now(timezone.utc) + timedelta(days=50)).replace(hour=6, minute=0, second=0, microsecond=0)
        # A creates group
        pa = make_ride_payload(DIR_TO, state["dtw"], base, mode="public")
        rA = http.post(f"{API}/rides", headers=hdr(student_a["token"]), json=pa)
        assert rA.status_code == 201
        rideA = rA.json()["ride"]["id"]
        cg = http.post(f"{API}/groups", headers=hdr(student_a["token"]), json={"rideId": rideA})
        assert cg.status_code == 201
        group_id = cg.json()["data"]["id"]

        # Register 4 more students and fill capacity beyond 4 to force 409 on 5th
        # Group capacity is 4 (A already occupies 1 seat → we need 3 to fill, then 5th fails)
        extras = []
        for _ in range(4):
            email = f"qa_{_rand()}@university.edu"
            reg = http.post(f"{API}/auth/register", json={
                "email": email, "password": "Passw0rd!",
                "username": "qax_" + _rand(4),
                "paymentHandle": "@qax",
                "pickupAddress": "1 Extra St",
            })
            assert reg.status_code == 201, reg.text
            code = reg.json()["devVerificationCode"]
            vr = http.post(f"{API}/auth/verify-email", json={"email": email, "code": code})
            assert vr.status_code == 200
            extras.append(vr.json()["accessToken"])

        # Fill: 3 joins succeed, 4th should be 409 (since seats: A + 3 = 4)
        for i, tok in enumerate(extras):
            rP = http.post(f"{API}/rides", headers=hdr(tok),
                           json=make_ride_payload(DIR_TO, state["dtw"], base + timedelta(minutes=(i+1)*10), mode="public"))
            assert rP.status_code == 201, rP.text
            rideId = rP.json()["ride"]["id"]
            j = http.post(f"{API}/groups/{group_id}/join", headers=hdr(tok),
                          json={"rideId": rideId})
            if i < 3:
                assert j.status_code == 200, f"expected join success i={i}, got {j.status_code} {j.text}"
            else:
                assert j.status_code == 409, f"expected 409 on full group, got {j.status_code} {j.text}"

        # Verify status full at 4/4
        gr = http.get(f"{API}/groups/{group_id}", headers=hdr(student_a["token"]))
        gd = gr.json()["data"]
        assert gd["memberCount"] == 4
        assert gd["status"] == "full"
