/**
 * RidePact backend integration tests (Node built-in test runner).
 * Run against a live server:  BASE=http://localhost:8001/api node --test tests/
 * Covers: auth, ride creation, matching, capacity, join/leave, lifecycle, fare, ratings, admin.
 */
const { test, before } = require('node:test');
const assert = require('node:assert');

const BASE = process.env.BASE || 'http://localhost:8001/api';
const stamp = Date.now();

async function api(path, { method = 'GET', token, body } = {}) {
  const res = await fetch(BASE + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  let json = null;
  try { json = await res.json(); } catch { json = null; }
  return { status: res.status, json };
}

async function makeStudent(tag) {
  const email = `test_${tag}_${stamp}@university.edu`;
  const reg = await api('/auth/register', { method: 'POST', body: { email, password: 'Passw0rd!', name: `T ${tag}`, username: `t${tag}${stamp}`, paymentHandle: `@${tag}` } });
  const code = reg.json.devVerificationCode;
  const ver = await api('/auth/verify-email', { method: 'POST', body: { email, code } });
  return { email, token: ver.json.accessToken, id: ver.json.user.id };
}

const ctx = {};

before(async () => {
  const air = await api('/airports');
  ctx.airport = air.json.data.find((a) => a.code === 'DTW').id;
  ctx.admin = (await api('/auth/login', { method: 'POST', body: { email: 'admin@ridepact.com', password: 'Admin@12345' } })).json.accessToken;
});

test('auth: reject non-university domain', async () => {
  const r = await api('/auth/register', { method: 'POST', body: { email: `x_${stamp}@gmail.com`, password: 'Passw0rd!' } });
  assert.strictEqual(r.status, 400);
});

test('auth: register + verify + login', async () => {
  ctx.A = await makeStudent('a');
  assert.ok(ctx.A.token, 'student A has a token');
  const login = await api('/auth/login', { method: 'POST', body: { email: ctx.A.email, password: 'Passw0rd!' } });
  assert.strictEqual(login.status, 200);
});

test('ride creation returns candidates array', async () => {
  const r = await api('/rides', { method: 'POST', token: ctx.A.token, body: { direction: 'university_to_airport', airport: ctx.airport, travelDate: '2027-03-10', flightTime: '2027-03-10T22:00:00Z', checkedBags: 1, pickupLocation: 'Union', flightInfo: 'DL100' } });
  assert.strictEqual(r.status, 201);
  ctx.rideA = r.json.ride.id;
  assert.ok(Array.isArray(r.json.candidates));
});

test('group create → creator is booker', async () => {
  const r = await api('/groups', { method: 'POST', token: ctx.A.token, body: { rideId: ctx.rideA } });
  ctx.group = r.json.data.id;
  assert.strictEqual(r.json.data.memberCount, 1);
  assert.strictEqual(r.json.data.isCurrentUserBooker, true);
});

test('matching: 2nd rider sees the group as a candidate', async () => {
  ctx.B = await makeStudent('b');
  const r = await api('/rides', { method: 'POST', token: ctx.B.token, body: { direction: 'university_to_airport', airport: ctx.airport, travelDate: '2027-03-10', flightTime: '2027-03-10T22:20:00Z', checkedBags: 1, pickupLocation: 'Quad' } });
  ctx.rideB = r.json.ride.id;
  assert.ok(r.json.candidates.some((c) => c.id === ctx.group), 'group is a candidate');
});

test('join → member count 2, savings computed', async () => {
  const r = await api(`/groups/${ctx.group}/join`, { method: 'POST', token: ctx.B.token, body: { rideId: ctx.rideB } });
  assert.strictEqual(r.status, 200);
  assert.strictEqual(r.json.data.memberCount, 2);
  assert.ok(r.json.data.savingsPct > 0);
});

test('capacity: joining beyond capacity → 409', async () => {
  // Fill to capacity (4) then a 5th join fails.
  for (const tag of ['c', 'd']) {
    const s = await makeStudent(tag);
    const rd = await api('/rides', { method: 'POST', token: s.token, body: { direction: 'university_to_airport', airport: ctx.airport, travelDate: '2027-03-10', flightTime: '2027-03-10T22:10:00Z', checkedBags: 0 } });
    await api(`/groups/${ctx.group}/join`, { method: 'POST', token: s.token, body: { rideId: rd.json.ride.id } });
  }
  const e = await makeStudent('e');
  const rd = await api('/rides', { method: 'POST', token: e.token, body: { direction: 'university_to_airport', airport: ctx.airport, travelDate: '2027-03-10', flightTime: '2027-03-10T22:15:00Z', checkedBags: 0 } });
  const full = await api(`/groups/${ctx.group}/join`, { method: 'POST', token: e.token, body: { rideId: rd.json.ride.id } });
  assert.strictEqual(full.status, 409);
});

test('lifecycle: book → start → complete; fare split sums to total; ratings + duplicate blocked', async () => {
  const book = await api(`/groups/${ctx.group}/book`, { method: 'POST', token: ctx.A.token });
  assert.strictEqual(book.json.data.status, 'confirmed');
  const fare = await api(`/fares/${ctx.group}`, { method: 'POST', token: ctx.A.token, body: { totalCost: 60 } });
  const shares = fare.json.data.fare.shares;
  const sum = Math.round(shares.reduce((s, x) => s + x.amount, 0));
  assert.strictEqual(sum, 60, 'shares sum to total fare');
  const conf = await api(`/fares/${ctx.group}/confirm`, { method: 'POST', token: ctx.B.token });
  assert.strictEqual(conf.status, 200);
  const start = await api(`/groups/${ctx.group}/start`, { method: 'POST', token: ctx.A.token });
  assert.strictEqual(start.json.data.status, 'in_progress');
  const done = await api(`/groups/${ctx.group}/complete`, { method: 'POST', token: ctx.A.token });
  assert.strictEqual(done.json.data.status, 'completed');
  const rate1 = await api('/ratings', { method: 'POST', token: ctx.A.token, body: { groupId: ctx.group, toUser: ctx.B.id, reliabilityStars: 5, punctualityStars: 4, confirmed: true } });
  assert.strictEqual(rate1.status, 201);
  const dup = await api('/ratings', { method: 'POST', token: ctx.A.token, body: { groupId: ctx.group, toUser: ctx.B.id, reliabilityStars: 3, punctualityStars: 3 } });
  assert.ok(dup.status === 409 || dup.status === 400, 'duplicate rating rejected');
});

test('lifecycle guard: cannot complete a completed group', async () => {
  const r = await api(`/groups/${ctx.group}/complete`, { method: 'POST', token: ctx.A.token });
  assert.strictEqual(r.status, 409);
});

test('admin CRUD + RBAC', async () => {
  const denied = await api('/admin/dashboard', { token: ctx.A.token });
  assert.strictEqual(denied.status, 403);
  const dash = await api('/admin/dashboard', { token: ctx.admin });
  assert.strictEqual(dash.status, 200);
  assert.ok(typeof dash.json.totalUsers === 'number');
  const school = await api('/admin/schools', { method: 'POST', token: ctx.admin, body: { name: `Test U ${stamp}`, domain: `test${stamp}.edu`, shortName: 'TU', status: 'Live' } });
  assert.strictEqual(school.status, 201);
});
