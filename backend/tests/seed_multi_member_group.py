"""Seed a multi-member group with 2 students, booked, fare entered, so we can test
Fare-Split RIDER view and Rate Riders screen via the mobile UI."""
import os, sys, json, requests, datetime as dt

BASE = os.environ.get("BASE_URL", "https://typography-74.preview.emergentagent.com").rstrip("/") + "/api"
S_A = {"email": "student@university.edu", "password": "Student@12345"}
S_B = {"email": "taylor@university.edu",  "password": "Student@12345"}

def login(cred):
    r = requests.post(f"{BASE}/auth/login", json=cred, timeout=20)
    r.raise_for_status()
    j = r.json()
    return j["accessToken"], j["user"]

def auth(t): return {"Authorization": f"Bearer {t}", "Content-Type": "application/json"}

def get_airport(code="DTW"):
    r = requests.get(f"{BASE}/airports", timeout=20); r.raise_for_status()
    for a in r.json().get("data", r.json()):
        if a.get("code") == code:
            return a
    return None

def create_ride(token, airport, flight_offset_days=3, direction="university_to_airport", bags=1, mode="public"):
    flight = (dt.datetime.utcnow() + dt.timedelta(days=flight_offset_days)).replace(microsecond=0)
    travel_date = flight.strftime("%Y-%m-%d")
    payload = {
        "direction": direction,
        "destinationType": "airport",
        "airport": airport["_id"] if "_id" in airport else airport["id"],
        "travelDate": travel_date,
        "flightTime": flight.isoformat() + "Z",
        "checkedBags": bags,
        "mode": mode,
        "flexibleTiming": True,
    }
    r = requests.post(f"{BASE}/rides", json=payload, headers=auth(token), timeout=30)
    print("create_ride", r.status_code, r.text[:400])
    r.raise_for_status()
    return r.json()

def main():
    tokA, userA = login(S_A); print("A id:", userA["id"], userA.get("name"))
    tokB, userB = login(S_B); print("B id:", userB["id"], userB.get("name"))
    airport = get_airport("DTW"); assert airport, "airport not found"
    print("airport:", airport.get("code"))

    # A creates PRIVATE ride -> creates group (A booker)
    resA = create_ride(tokA, airport, 5, "university_to_airport", 1, "private")
    grpA = resA.get("group") or resA.get("data") or {}
    gid = grpA.get("id") or grpA.get("_id")
    print("A groupId:", gid, "isBooker:", grpA.get("isCurrentUserBooker"))
    assert gid, resA

    # B creates matching PUBLIC ride
    resB = create_ride(tokB, airport, 5, "university_to_airport", 1, "public")
    ride_b_id = resB.get("ride", {}).get("id")
    print("B rideId:", ride_b_id)

    # B joins A's group
    jr = requests.post(f"{BASE}/groups/{gid}/join", json={"rideId": ride_b_id}, headers=auth(tokB), timeout=20)
    print("B join:", jr.status_code, jr.text[:300])

    # A books the ride
    br = requests.post(f"{BASE}/groups/{gid}/book", headers=auth(tokA), timeout=20)
    print("A book:", br.status_code, br.text[:300])

    # A enters fare (57.00) — endpoint is /api/fares/:groupId
    fr = requests.post(f"{BASE}/fares/{gid}", json={"totalCost": 57.0}, headers=auth(tokA), timeout=20)
    print("A fare:", fr.status_code, fr.text[:400])

    # A completes the ride (needed for rating)
    cr = requests.post(f"{BASE}/groups/{gid}/complete", headers=auth(tokA), timeout=20)
    print("A complete:", cr.status_code, cr.text[:300])

    # Get final group state
    gg = requests.get(f"{BASE}/groups/{gid}", headers=auth(tokA), timeout=20).json()
    print("FINAL group snippet:", json.dumps(gg, default=str)[:600])

    print("\nGROUP_ID:", gid)
    print("B_TOKEN:", tokB)
    print("A_TOKEN:", tokA)
    # Save for UI test
    with open("/tmp/seed_ctx.json", "w") as f:
        json.dump({"gid": gid, "tokA": tokA, "tokB": tokB, "userA": userA, "userB": userB}, f)

if __name__ == "__main__":
    main()
