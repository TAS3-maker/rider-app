# RidePact — Product Requirements & Build Log

## Original problem statement
Build a monorepo **ridepact** (backend, admin-web, mobile-app) for a Student Ride
Coordination Platform: verified university students coordinate shared airport rides via
a rule-based matching engine — create trips, form ride groups, designate a booker,
split fares (coordination only, no real payments), real-time group chat, ratings &
reliability, ride history, travel calendar, push notifications, and a web admin panel.
Scope is fixed to the 270-hour MVP in the SOW PDF; wireframes.html / admin-wireframes.html
are the literal visual spec. This build delivers **Phase 0** only.

## Stack / Architecture
- **backend** (`ridepact/backend` → `/app/backend`): Node.js + Express + Mongoose (MongoDB).
  Node listens on 127.0.0.1:8500; a thin FastAPI shim on :8001 (supervisor `backend`)
  reverse-proxies HTTP + WebSocket, so the public API is a single backend at `:8001/api`.
  Supervisor `node-backend` program runs the Node server.
- **mobile-app** (`ridepact/mobile-app` → `/app/frontend`): Expo Router + React Native (JS) +
  NativeWind (`className`). Metro on :3000 (preview + Expo Go). NOTE: runs Expo SDK 57
  (the platform image), not 54 — required to keep preview/deploy working.
- **admin-web** (`ridepact/admin-web` → `/app/admin-web`): existing React + Vite + Tailwind
  panel, preserved; wired to backend auth. Verified via internal screenshots (not live-previewed).
- Shared design tokens from wireframe `:root` vars registered in `mobile-app/tailwind.config.js`
  (NativeWind) and `admin-web/src/index.css` (`@theme`).

## User personas
- **Student / Rider**: registers with university email, creates/joins airport rides, chats,
  splits fare, rates riders, views reliability + history.
- **Administrator**: manages students/universities/airports/destinations/events, monitors
  rides & groups, configures platform settings, sends announcements (admin-web).

## Core requirements (static, from SOW)
Auth + university-email verification; profiles; ride creation; ride discovery; rule-based
matching; ride groups + booker workflow; fare split (no payment processing); real-time chat;
push notifications; ratings & reliability; ride history; travel calendar; admin panel;
event logging. Out of scope (all phases): real payments/Stripe, Uber/Lyft, GPS/route
optimization, AI/ML matching, referrals/rewards/subscriptions, advanced analytics/BI,
multi-language, external CRM.

## Implemented (2026-09-03) — Phase 0
- 14 Mongoose models: User, University, Airport, Destination, Ride, RideGroup, GroupMember,
  Message, Rating, FareRecord, Notification, TravelEvent, PlatformSetting, EventLog.
- Express route files for every resource (auth fully built; rides/matching/groups/chat/
  ratings/fares are guarded placeholders; universities/airports/destinations/calendar/
  notifications/users functional reads). Services + socket handlers scaffolded.
- Auth: register (university-domain verified against admin-configured universities),
  6-digit email verification (dev mode returns code), JWT login/logout, /auth/me,
  forgot/reset password, role-based access control (student|admin). Idempotent seed.
- admin-web: existing UI preserved; real backend login enforcing role==admin + route guard.
- mobile-app: Expo Router shell — every wireframe screen present under (auth)/(tabs);
  Welcome / Sign In / Sign Up / Verify pixel-matched; custom bottom tab bar with raised
  circular "+" create button; Profile shows user + logout.
- Verified: 22/22 backend API tests, 7/7 mobile flows.

### Seed / test credentials
- Admin: admin@ridepact.com / Admin@12345
- University: State University — domain `university.edu`
- Test student: jdoe@university.edu / Passw0rd! (verified)

## Implemented (2026-09-03) — Phase 2: Ride Coordination (backend + mobile)
- Models extended: Ride (student/flightInfo/passengerCount/flags), RideGroup (rides/members/
  vehicleCapacity/bookerId/fareRecord/pickupMode/times/edge-flags), GroupMember (overdue/
  leftAfterBooking), FareRecord (shares/percent/finalized/fareChanged); Airport.baseFare.
- Rule-based matching engine (matchingEngine.js): same university→direction→airport→travel
  date→flight-time window→capacity→luggage→open status, ranked; computes suggested departure
  & booking deadline; vehicle suggestion.
- groupService.js orchestration: create/join (capacity + status open→nearly_full→full),
  leave (booker transfer/vacancy flag, dissolve on empty), assign/transfer booker, book,
  enter fare (even split, fareChanged preserves confirmations), confirm payment, complete,
  cancel, cab-cancelled — each with EventLog + notifications. Booker-only pickup addresses.
- Edge cases as flags: overdue, leftAfterBooking, noBookerFlag, adminFlag, cabCancelled,
  rematchNeeded (flight/pickup change), full→409, no-match→own group, ranked multi-match.
- Endpoints: /rides (create/history/matches/update/cancel), /groups (browse/get/create/join/
  leave/booker/book/complete/cancel/cab-cancelled), /fares (get/enter/confirm), /matching.
  Browse + history paginated (page/limit/total/totalPages).
- Mobile screens (NativeWind, lucide icons, no emoji, safe-area, responsive): Create Ride
  (mode/direction/airport/time/date/bags/flexible/pickup + auto-calc box), Browse Rides
  (infinite scroll, status tags teal/yellow/red, full grayed), Group Details (live countdown,
  riders, booker pickups, join/leave-modal/book), Fare Split (enter fare, shares, copy-to-pay,
  paid/pending, complete), Ride History (summary + paginated cards, cancelled red border).
- Verified: 43/43 backend tests + all 5 mobile screens.

## Implemented (2026-09-03) — Phase 3: Communication, Ratings & Calendar (backend + mobile)
- Socket.IO at path `/api/socket.io` with JWT handshake auth; per-RideGroup chat rooms
  (membership-gated join) + per-user notification rooms; real-time delivery (polling transport
  through the ingress proxy; websocket upgrade blocked by ingress — expected).
- Chat: paginated history (newest-first, load-more on scroll-up), POST message, auto system
  messages on join/leave/book/complete; chatService persists + broadcasts + notifies members.
- Notifications: 11 types, paginated list with unread count, /unread-count, /:id/read, /read-all.
- Ratings: reliabilityStars + punctualityStars + confirmed/flaked, unique per (group,rater,ratee),
  ObjectId-validated; reliabilityService recomputes rolling reliabilityScore on submit.
- TravelEvent: paginated calendar with live demandCount (rides in the event date range) +
  highDemand flag; admin CRUD (admin-only, soft delete).
- Mobile (NativeWind, lucide icons, no emoji, safe-area, paginated): Group Chat (pinned info +
  countdown + gated Book Now, system messages, paginated), Notifications (per-type icons + status
  dots, mark-all-read), Rate Riders (dual star rows + confirmed/flaked, anonymous), Travel Calendar
  (date-badge cards, live demand, coral high-demand, Post-a-Ride CTA), Home (upcoming ride card,
  break preview with demand, bell + unread badge, rich empty state), Chat tab (group list).
- SocketContext reuses the single socket client + auth token; exposes unread count.
- Verified: 63/63 backend tests + all Phase 3 screens.

## Implemented (2026-09-03) — Phase 4: Admin business functionality (backend + wiring)
- New comprehensive `/api/admin/*` router (all admin-only via adminAuth) mapping real Mongo
  data to the admin-web's existing service shapes — no admin UI redesign; existing service
  layer already targeted these endpoints.
- Dashboard stats (real counts + derived), Users (search/filter/detail/rides/activate-deactivate),
  Trips, Groups, Event Logs (filterable), Schools CRUD (University), Destinations CRUD,
  Pickups/Airports CRUD, Break Calendar CRUD + trigger-notification (fan-out to students),
  Notifications broadcast + history aggregation, Settings get/patch/reset (syncs matching window
  + capacity PlatformSettings), and resolution flows (booker-needed queue, payment/fare disputes,
  missing-info) with assign/resolve actions + EventLog.
- Schema fills: University.shortName/address/notes, TravelEvent.notification14d/3dSent.
- Verified: 65/65 admin backend tests; live admin panel at /api/admin-panel renders real data.
- Note: admin lists return arrays (existing client-side pagination preserved) but accept
  ?page&limit and are capped; admin Sidebar icons are the pre-existing UI (untouched this phase).

## Implemented (2026-09-03) — Phase 5: Hardening, tests & prod prep
- Verified/hardened all 28 SOW side-flows. Added: group `start`(→in_progress at pickup time),
  `delay` (driver delayed), `remove-rider` (non-payment) endpoints; fare `dispute`
  (payment/fare) endpoint; flags RideGroup.delayed/bookingInfoMissing/startedAt,
  FareRecord.paymentDisputed/fareDisputed, GroupMember.removedForNonPayment; lifecycle
  transition guards (409 on illegal transitions, 403 non-booker); stale-fare flag on rejoin;
  booking-info-missing detection on book; admin resolutions clear the new flags; group DTOs
  surface flags for admin + mobile banners.
- Automated tests: /app/backend/tests/api.test.js (Node runner, `npm test`, 10/10) covering
  auth, ride creation, matching, capacity, join/leave, lifecycle, fare split, ratings, admin CRUD.
- Verified by testing agent: 21/21 (10 Node + 11 pytest edge-case scenarios).
- Prod config: backend/.env.example (full var list, rotate JWT_SECRET), ridepact/DEPLOYMENT.md
  (backend/mobile/admin build + env + Publish flow). Note: environment ships Expo SDK 57
  (not 54) to keep preview + EAS builds working; mobile source is JS (.jsx).
- Wireframe parity: mobile screens match design tokens/layout; admin panel matches its supplied
  wireframe. Known deviation: admin sidebar uses the pre-existing emoji glyphs from the supplied
  admin codebase (left untouched per "do not redesign admin UI").

## Rebrand — RidePact → Rovo (mobile, Part 1 of 4)
- tailwind.config.js repointed to Rovo palette (navy #2C3A4B, cream #F4EFE6, amber #E0913C,
  green #3E9E75) — legacy keys repointed so all screens adopt the rebrand; named tokens added.
- app.json name → "Rovo"; splash background → navy.
- Welcome screen redesigned (navy, car wordmark, tagline, amber .edu pill, cream/navy buttons).
- Sign In / Sign Up / Home auto-adopt new palette (Sign Up already captures paymentHandle +
  pickupAddress — both already on User model + register endpoint, no backend change).
- Pending: fine-tune Sign In/Sign Up/Home/empty exact layouts as remaining batch screens arrive.

## Backlog (next phases per SOW)
### Phase 1 (finish Foundation)
- P1: Profile edit screen (mobile) wired to PATCH /users/me; admin university/domain CRUD UI.
### Phase 2 — Ride Coordination (P0)
- Ride creation form + API; ride discovery/browse; rule-based matching engine; ride groups +
  join/leave + capacity; booker workflow; ride lifecycle transitions; fare split + payment
  confirmation; ride history.
### Phase 3 — Communication & Administration (P0/P1)
- Real-time group chat (Socket.IO); push notifications; ratings + reliability recompute;
  travel calendar UI; admin dashboards for users/rides/groups/events/settings/notifications.
### Phase 4 — Testing & Launch (P1)
- Full QA, edge cases, production config, store submission support.

## Rovo pixel-perfect redesign — Part 4 (DONE, verified — FINAL batch)
- UI-only (no backend changes) redesign of the last 4 screens, matched to mockups + screenshot-verified:
  - Travel Calendar (calendar.jsx): big heading + "{uni} · {term}" subtitle, date-badge cards (navy normal / amber high-demand "— Very High demand"), pinned "Post a Ride for a Break" CTA.
  - Ride History (ride-history.jsx): back + heading + "{n} completed · ${saved} saved total", cards w/ route, COMPLETED/CANCELLED pill, riders (Booker tag), fare/paid/saved(%)/payment(✓)/rating rows, red left-border for cancelled.
  - Profile (profile.jsx): heading + gear, avatar initials, name, "{uni} · Class of ...", 3-stat row (Rating/Rides/Saved), icon rows (Email/Payment/Pickup area/Address muted/Ride History View→/Terms View→), red Sign Out →.
  - Notifications (notifications.jsx): back + heading, dot (green unread / amber travel / gray read) + title + body + relative timestamp, no dividers.
- Display guard: headline "Saved" totals clamped to ≥ 0 (test data can go negative). Per-card values stay truthful.
- 'Your rating given' uses a 4.5 placeholder (no backing field) per the UI-only mock allowance.
- All 19 Rovo screens are now redesigned. admin-web / matching / lifecycle untouched throughout.

## Rovo pixel-perfect redesign — Part 3 (DONE, verified)
- UI-only (no backend changes) redesign of 5 screens, matched to mockups + E2E validated:
  - Rate Riders (rate.jsx): centered title, per-member card w/ avatar + BOOKER pill + RELIABILITY/PUNCTUALITY tap-to-select navy stars, Submit Ratings.
  - Fare Split RIDER (fare-split.jsx): dark navy "Ride Complete" hero (RovoCar/RovoCloud), FARE SPLIT card w/ per-rider %/amount, Copy-Pay button, PAYMENT STATUS PAID/PENDING, "I've Paid → Continue to Rating".
  - Fare Split BOOKER (fare-split.jsx): "← Fare Split", navy "Ride Complete" banner, big $ ENTER ACTUAL FARE input, rider rows, Confirm & Send Split, PAYMENT TRACKING w/ Mark Received.
  - Group Chat (group-chat.jsx): route+date header, collapsible pinned Ride Details card, left/right bubbles w/ avatars + BOOKER tag, red booking-deadline line, rounded input + navy ArrowUp send.
  - Group Details BOOKER (group.jsx): summary card, Pickup Mode toggle (local UI state), RIDERS w/ addresses + star, Copy All Addresses, Book Ride Now, "or Open Group Chat →".
- Fixes from test iteration 9: Rate BOOKER pill enriched client-side via groupsApi.get (no backend change); Home "YOUR UPCOMING RIDE" airport now uses airport.code (was rendering [object Object]).
- Chevron on Ride Details kept as ▼-when-expanded to match the mockup (intentional).
- Reused RovoCar/RovoCloud + existing endpoints (groupsApi, faresApi, ratingsApi, chatApi). admin-web/matching/lifecycle untouched.

## Rovo pixel-perfect redesign — Part 2 (DONE, verified)
- Screens rebuilt to match mockups: Create Ride (Path A UMich→DTW), Create Ride (Path B DTW→UMich
  with DTW Terminal selector), Private Group (Invite Friends: DTW vs Custom Destination),
  Browse Rides / Find Rides (filter bar + multi-rider cards + full/grayed state), Group Details.
- Additive backend (verified 14/14 by testing agent):
  - Ride: flexibleTiming, terminal (mcnamara|north), destinationType (airport|custom), customDestinationName
  - RideGroup: destinationType, customDestinationName
  - constants: TERMINAL, DESTINATION_TYPE enums
  - rideController.createRide accepts new fields; airport optional when custom
  - groupService.recomputeGroup skips auto-calc for custom (manual departure, no bookingDeadline);
    serializeGroup exposes new fields + member profileImage
  - groupController.browse: server-side timeWindow + minBags/maxBags filters (+ existing direction/date, pagination)
- NOTE: backend supervisor process is `node-backend` (must restart after backend edits — no auto-reload).
- Frontend-only elsewhere; admin-web, matching rules, lifecycle untouched.

## Rovo pixel-perfect redesign — Part 1 (DONE, verified via screenshots)
- Welcome, Sign In, Sign Up, Home (active-ride card + empty state) rewritten element-by-element
  to match the 5 Rovo mockups: navy/cream/amber palette, uppercase field labels, white
  rounded inputs w/ soft shadow, navy pill buttons w/ shadow.
- New reusable SVG marks: components/RovoCar.jsx (sleek car silhouette) and RovoCloud.jsx.
- TabBar.jsx restyled to icon-only tabs + raised navy "+" FAB (matches mockup).
- Home keeps real backend data (rides/history + calendar), only restyled.
- Frontend-only; no backend/admin/schema changes.
- Pending: Part 2-4 remaining screens await user uploads (Browse, Group, Chat, Fare, etc.).

## Next tasks
1. Phase 2 ride creation + rule-based matching (highest value — core journey).
2. Admin dashboard data wiring (replace remaining mock data with backend).
3. Real-time chat over the existing Socket.IO server.
