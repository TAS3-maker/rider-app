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

## Next tasks
1. Phase 2 ride creation + rule-based matching (highest value — core journey).
2. Admin dashboard data wiring (replace remaining mock data with backend).
3. Real-time chat over the existing Socket.IO server.
