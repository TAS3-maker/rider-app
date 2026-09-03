"""
RidePact Phase 3 backend tests — chat, notifications, ratings, calendar.
Serial execution required: `pytest /app/backend/tests/test_ridepact_phase3.py -o addopts='-n 0'`
"""
import os
import random
import string
import time
from datetime import datetime, timedelta, timezone

import pytest
import requests
import socketio

BASE_URL = os.environ.get(
    "EXPO_PUBLIC_BACKEND_URL",
    "https://typography-74.preview.emergentagent.com",
).rstrip("/")
API = f"{BASE_URL}/api"

STUDENT_A_EMAIL = "jdoe@university.edu"
STUDENT_A_PASSWORD = "Passw0rd!"
ADMIN_EMAIL = "admin@ridepact.com"
ADMIN_PASSWORD = "Admin@12345"

DIR_TO = "university_to_airport"


def _rand(n=8):
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
def airports(http):
    r = http.get(f"{API}/airports")
    assert r.status_code == 200
    items = r.json().get("data") or r.json()
    return {a["code"]: a["id"] for a in items}


@pytest.fixture(scope="module")
def student_a(http):
    r = http.post(f"{API}/auth/login", json={"email": STUDENT_A_EMAIL, "password": STUDENT_A_PASSWORD})
    assert r.status_code == 200, r.text
    return {"token": r.json()["accessToken"], "user": r.json()["user"]}


@pytest.fixture(scope="module")
def student_b(http):
    email = f"qa3_{_rand()}@university.edu"
    reg = http.post(f"{API}/auth/register", json={
        "email": email, "password": "Passw0rd!",
        "username": "qab_" + _rand(4),
        "paymentHandle": "@qab",
        "pickupAddress": "500 Test Blvd",
    })
    assert reg.status_code == 201, reg.text
    code = reg.json()["devVerificationCode"]
    vr = http.post(f"{API}/auth/verify-email", json={"email": email, "code": code})
    assert vr.status_code == 200
    return {"token": vr.json()["accessToken"], "user": vr.json()["user"], "email": email}


@pytest.fixture(scope="module")
def student_c(http):
    """Third student to test 403 non-member chat read."""
    email = f"qa3c_{_rand()}@university.edu"
    reg = http.post(f"{API}/auth/register", json={
        "email": email, "password": "Passw0rd!",
        "username": "qac_" + _rand(4),
        "paymentHandle": "@qac",
        "pickupAddress": "9 Other St",
    })
    assert reg.status_code == 201
    code = reg.json()["devVerificationCode"]
    vr = http.post(f"{API}/auth/verify-email", json={"email": email, "code": code})
    assert vr.status_code == 200
    return {"token": vr.json()["accessToken"], "user": vr.json()["user"]}


@pytest.fixture(scope="module")
def admin_token(http):
    r = http.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    if r.status_code != 200:
        pytest.skip(f"admin login failed: {r.status_code} {r.text}")
    return r.json()["accessToken"]


# ----- shared group of A (booker) + B (member) -----
@pytest.fixture(scope="module")
def group_ab(http, student_a, student_b, airports, state):
    base = (datetime.now(timezone.utc) + timedelta(days=12)).replace(hour=15, minute=0, second=0, microsecond=0)
    pa = {
        "direction": DIR_TO,
        "airport": airports["DTW"],
        "travelDate": _iso(base.replace(hour=0, minute=0)),
        "flightTime": _iso(base),
        "checkedBags": 1,
        "flexible": False,
        "pickupLocation": "Campus Hub",
        "mode": "public",
    }
    rA = http.post(f"{API}/rides", headers=hdr(student_a["token"]), json=pa)
    assert rA.status_code == 201, rA.text
    rideA = rA.json()["ride"]["id"]
    cg = http.post(f"{API}/groups", headers=hdr(student_a["token"]), json={"rideId": rideA})
    assert cg.status_code == 201, cg.text
    gid = cg.json()["data"]["id"]

    pb = {**pa, "flightTime": _iso(base + timedelta(minutes=30))}
    rB = http.post(f"{API}/rides", headers=hdr(student_b["token"]), json=pb)
    assert rB.status_code == 201, rB.text
    rideB = rB.json()["ride"]["id"]
    j = http.post(f"{API}/groups/{gid}/join", headers=hdr(student_b["token"]), json={"rideId": rideB})
    assert j.status_code == 200, j.text

    state["groupId"] = gid
    state["rideA"] = rideA
    state["rideB"] = rideB
    return gid


# ============ 1. CHAT REST ============
class TestChatRest:
    def test_history_empty_shape(self, http, student_a, group_ab):
        r = http.get(f"{API}/chat/{group_ab}/messages?page=1&limit=20", headers=hdr(student_a["token"]))
        assert r.status_code == 200, r.text
        b = r.json()
        for k in ["data", "page", "limit", "total", "totalPages"]:
            assert k in b, f"missing {k}"
        assert b["page"] == 1 and b["limit"] == 20

    def test_system_message_on_join(self, http, student_a, group_ab):
        # After B joined, at least one system message should exist
        r = http.get(f"{API}/chat/{group_ab}/messages?page=1&limit=50", headers=hdr(student_a["token"]))
        assert r.status_code == 200
        msgs = r.json()["data"]
        sys_msgs = [m for m in msgs if m.get("isSystemMessage")]
        assert any("joined" in (m.get("text") or "").lower() for m in sys_msgs), \
            f"expected 'joined' system message, got: {[m.get('text') for m in msgs]}"

    def test_post_message_persists(self, http, student_a, group_ab, state):
        text = f"hello from A {_rand(4)}"
        r = http.post(f"{API}/chat/{group_ab}/messages",
                      headers=hdr(student_a["token"]), json={"text": text})
        assert r.status_code == 201, r.text
        d = r.json()["data"]
        assert d["text"] == text
        assert d["isSystemMessage"] is False
        state["lastText"] = text

        # verify via GET
        r2 = http.get(f"{API}/chat/{group_ab}/messages?page=1&limit=10", headers=hdr(student_a["token"]))
        texts = [m["text"] for m in r2.json()["data"]]
        assert text in texts
        # newest first
        assert texts[0] == text, f"expected newest-first ordering, got {texts[:3]}"

    def test_non_member_403(self, http, student_c, group_ab):
        r = http.get(f"{API}/chat/{group_ab}/messages", headers=hdr(student_c["token"]))
        assert r.status_code == 403
        r2 = http.post(f"{API}/chat/{group_ab}/messages",
                       headers=hdr(student_c["token"]), json={"text": "sneaky"})
        assert r2.status_code == 403


# ============ 2. SOCKET.IO ============
class TestSocketIO:
    def test_socket_rejects_no_token(self):
        sio = socketio.Client(reconnection=False)
        errored = {"v": False}

        @sio.event
        def connect_error(_data):
            errored["v"] = True

        with pytest.raises(Exception):
            sio.connect(BASE_URL, socketio_path="/api/socket.io", auth={},
                        transports=["polling"], wait_timeout=5)
        try:
            sio.disconnect()
        except Exception:
            pass

    def test_socket_realtime_message(self, http, student_a, student_b, group_ab):
        received = []
        sio_b = socketio.Client(reconnection=False)

        @sio_b.on("chat:message")
        def _on_msg(payload):
            received.append(payload)

        try:
            sio_b.connect(
                BASE_URL,
                socketio_path="/api/socket.io",
                auth={"token": student_b["token"]},
                transports=["polling"],
                wait_timeout=10,
            )
        except Exception as e:
            pytest.fail(f"socket connect failed: {e}")

        assert sio_b.connected, "socket B did not connect"
        sio_b.emit("chat:join", group_ab)
        time.sleep(1.0)

        # A posts via REST — B should receive chat:message
        text = f"rt from A {_rand(4)}"
        r = http.post(f"{API}/chat/{group_ab}/messages",
                      headers=hdr(student_a["token"]), json={"text": text})
        assert r.status_code == 201, r.text

        deadline = time.time() + 6
        while time.time() < deadline and not any(m.get("text") == text for m in received):
            time.sleep(0.25)
        sio_b.disconnect()
        got = [m.get("text") for m in received]
        assert any(m == text for m in got), f"did not receive real-time message, got={got}"


# ============ 3. NOTIFICATIONS ============
class TestNotifications:
    def test_list_shape_and_types(self, http, student_a):
        r = http.get(f"{API}/notifications?page=1&limit=20", headers=hdr(student_a["token"]))
        assert r.status_code == 200, r.text
        b = r.json()
        for k in ["data", "page", "limit", "total", "totalPages", "unread"]:
            assert k in b, f"missing {k}"
        assert isinstance(b["unread"], int)

    def test_chat_and_join_notifications_created_for_a(self, http, student_a):
        # A should have both user_joined (B joined) and chat_message (B eventually sends) or just user_joined so far
        r = http.get(f"{API}/notifications?page=1&limit=50", headers=hdr(student_a["token"]))
        types = [n.get("type") for n in r.json()["data"]]
        assert "user_joined" in types, f"expected user_joined notification for A, got {types}"

    def test_b_sends_and_a_gets_chat_notification(self, http, student_a, student_b, group_ab):
        text = f"ping from B {_rand(4)}"
        r = http.post(f"{API}/chat/{group_ab}/messages",
                      headers=hdr(student_b["token"]), json={"text": text})
        assert r.status_code == 201
        time.sleep(1.0)
        rn = http.get(f"{API}/notifications?page=1&limit=20", headers=hdr(student_a["token"]))
        types = [n.get("type") for n in rn.json()["data"]]
        assert "chat_message" in types, f"expected chat_message notification, got {types}"

    def test_unread_count_and_mark_all(self, http, student_a):
        uc = http.get(f"{API}/notifications/unread-count", headers=hdr(student_a["token"]))
        assert uc.status_code == 200 and "unread" in uc.json()

        ma = http.post(f"{API}/notifications/read-all", headers=hdr(student_a["token"]), json={})
        assert ma.status_code == 200
        uc2 = http.get(f"{API}/notifications/unread-count", headers=hdr(student_a["token"]))
        assert uc2.json()["unread"] == 0

    def test_mark_single_read(self, http, student_b, group_ab, student_a):
        # A sends to bump B's unread
        http.post(f"{API}/chat/{group_ab}/messages", headers=hdr(student_a["token"]),
                  json={"text": f"bump {_rand(3)}"})
        time.sleep(0.7)
        r = http.get(f"{API}/notifications?page=1&limit=5", headers=hdr(student_b["token"]))
        items = r.json()["data"]
        if not items:
            pytest.skip("no notifications for B yet")
        nid = items[0]["id"]
        mr = http.post(f"{API}/notifications/{nid}/read", headers=hdr(student_b["token"]), json={})
        assert mr.status_code == 200


# ============ 4. RATINGS ============
class TestRatings:
    def test_pending_ratings_shape(self, http, student_a, group_ab, student_b):
        r = http.get(f"{API}/ratings/pending?groupId={group_ab}", headers=hdr(student_a["token"]))
        assert r.status_code == 200, r.text
        data = r.json()["data"]
        b_uid = str(student_b["user"]["id"])
        b_entry = next((x for x in data if str(x["userId"]) == b_uid), None)
        assert b_entry is not None, f"B should be in pending list, got {data}"
        assert b_entry["alreadyRated"] is False
        assert "initials" in b_entry and "name" in b_entry

    def test_missing_groupId_returns_400(self, http, student_a):
        r = http.get(f"{API}/ratings/pending", headers=hdr(student_a["token"]))
        assert r.status_code == 400

    def test_submit_rating_and_reliability_recompute(self, http, student_a, student_b, group_ab):
        # A rates B: 4 reliability, 5 punctuality → avg = 4.5
        payload = {
            "groupId": group_ab,
            "toUser": student_b["user"]["id"],
            "reliabilityStars": 4,
            "punctualityStars": 5,
            "confirmed": True,
        }
        r = http.post(f"{API}/ratings", headers=hdr(student_a["token"]), json=payload)
        assert r.status_code == 201, r.text

        # duplicate should be rejected
        r2 = http.post(f"{API}/ratings", headers=hdr(student_a["token"]), json=payload)
        assert r2.status_code in (400, 409), f"duplicate should 4xx, got {r2.status_code} {r2.text}"

        # pending should now show alreadyRated: true for B
        p = http.get(f"{API}/ratings/pending?groupId={group_ab}", headers=hdr(student_a["token"]))
        b_uid = str(student_b["user"]["id"])
        b_entry = next(x for x in p.json()["data"] if str(x["userId"]) == b_uid)
        assert b_entry["alreadyRated"] is True

        # reliabilityScore recomputed on B
        me = http.get(f"{API}/users/me", headers=hdr(student_b["token"]))
        assert me.status_code == 200, me.text
        u = me.json().get("data") or me.json().get("user") or me.json()
        score = u.get("reliabilityScore")
        assert score is not None
        # Avg of (4+5)/2 = 4.5
        assert abs(float(score) - 4.5) < 0.15, f"expected ~4.5 reliability, got {score}"

    def test_cannot_rate_self(self, http, student_a, group_ab):
        r = http.post(f"{API}/ratings", headers=hdr(student_a["token"]), json={
            "groupId": group_ab, "toUser": student_a["user"]["id"],
            "reliabilityStars": 5, "punctualityStars": 5,
        })
        assert r.status_code == 400

    def test_invalid_stars(self, http, student_a, student_b, group_ab):
        r = http.post(f"{API}/ratings", headers=hdr(student_a["token"]), json={
            "groupId": group_ab, "toUser": student_b["user"]["id"],
            "reliabilityStars": 0, "punctualityStars": 3,
        })
        assert r.status_code == 400


# ============ 5. CALENDAR ============
class TestCalendar:
    def test_list_pagination_and_demand(self, http, student_a):
        r = http.get(f"{API}/calendar?page=1&limit=10", headers=hdr(student_a["token"]))
        assert r.status_code == 200, r.text
        b = r.json()
        for k in ["data", "page", "limit", "total", "totalPages"]:
            assert k in b
        assert b["total"] >= 1, "expected seeded travel events"
        for ev in b["data"]:
            assert "demandCount" in ev and "highDemand" in ev
            assert isinstance(ev["demandCount"], int)
            assert isinstance(ev["highDemand"], bool)
            # required event fields
            for k in ["id", "title", "startDate"]:
                assert k in ev, f"event missing {k}: {ev}"

    def test_student_cannot_create_event(self, http, student_a):
        r = http.post(f"{API}/calendar", headers=hdr(student_a["token"]),
                      json={"title": "TEST_disallowed", "startDate": _iso(datetime.now(timezone.utc))})
        assert r.status_code == 403, f"student create should be forbidden, got {r.status_code}"

    def test_student_cannot_delete_event(self, http, student_a):
        r = http.delete(f"{API}/calendar/000000000000000000000000", headers=hdr(student_a["token"]))
        assert r.status_code == 403

    def test_admin_crud_and_soft_delete(self, http, admin_token):
        start = datetime.now(timezone.utc) + timedelta(days=60)
        end = start + timedelta(days=3)
        payload = {
            "title": f"TEST_Event_{_rand(4)}",
            "description": "phase3 crud",
            "startDate": _iso(start),
            "endDate": _iso(end),
            "type": "holiday",
            "visible": True,
        }
        c = requests.post(f"{API}/calendar", headers=hdr(admin_token), json=payload)
        assert c.status_code == 201, c.text
        ev = c.json()["data"]
        eid = ev["id"]

        # PATCH
        p = requests.patch(f"{API}/calendar/{eid}", headers=hdr(admin_token),
                           json={"description": "updated"})
        assert p.status_code == 200
        assert p.json()["data"]["description"] == "updated"

        # DELETE (soft)
        d = requests.delete(f"{API}/calendar/{eid}", headers=hdr(admin_token))
        assert d.status_code == 200

        # After soft delete, event no longer appears in student-visible list
        lst = requests.get(f"{API}/calendar?page=1&limit=50",
                           headers=hdr(admin_token)).json()
        ids = [e["id"] for e in lst["data"]]
        assert eid not in ids, "soft-deleted event must not appear in visible list"
