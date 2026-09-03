# RidePact — Student Ride Coordination Platform

A monorepo for RidePact: verified university students coordinate shared airport rides —
create trips, get matched by a rule-based engine into ride groups, coordinate a booker,
split the fare, chat, and rate each other. Rule-based matching only (no AI), no real
payment processing, no Uber/Lyft, no GPS tracking (per the Scope of Work MVP).

## Structure

```
ridepact/
├── backend/      → Node.js + Express + Mongoose (single API for both apps)
├── admin-web/    → React (Vite, JS) + Tailwind CSS admin panel
└── mobile-app/   → Expo + React Native (JS) + NativeWind student app
```

> Platform note: this repo runs inside Emergent's managed environment, whose preview /
> deploy pipeline is wired to fixed paths. To keep preview + deploy working, the real
> code lives at the platform paths and this folder exposes the logical monorepo layout
> via symlinks:
>
> | Logical            | Physical path      | Runs as |
> |--------------------|--------------------|---------|
> | `ridepact/backend`   | `/app/backend`     | Node backend on `127.0.0.1:8500`, reverse-proxied by a thin FastAPI shim on `:8001` (supervisor-managed) so the public API is a single backend at `:8001/api`. |
> | `ridepact/mobile-app`| `/app/frontend`    | Expo Metro on `:3000` (live preview + Expo Go QR). |
> | `ridepact/admin-web` | `/app/admin-web`   | Vite dev server (verified via internal screenshots in Phase 0). |

## Design tokens

Colors/typography/spacing come from the attached `wireframes.html` /
`admin-wireframes.html` `:root` variables. They are registered as named tokens in
`mobile-app/tailwind.config.js` (NativeWind) and `admin-web/src/index.css`
(`@theme`), so both apps reference the same names (`bg-primary`, `text-text-2`, …).

| Token | Hex |
|-------|-----|
| bg | #F5F5F0 |
| primary | #3AAFA9 |
| primary-light | #E8F6F5 |
| primary-dark | #2B8A85 |
| accent | #FF6B6B |
| maize | #F5C842 |
| text | #1A1A2E |
| text-2 | #4A4A5A |
| text-3 | #8A8A9A |
| border | #E8E8E8 |
| sidebar | #1A1A2E |

## Phase 0 (this build)

- **Backend core**: 14 Mongoose models (User, University, Airport, Destination, Ride,
  RideGroup, GroupMember, Message, Rating, FareRecord, Notification, TravelEvent,
  PlatformSetting, EventLog). Express route files for every resource (auth fully
  implemented; the rest are guarded placeholders filled in later phases). Services and
  socket handlers scaffolded.
- **Auth**: register with university email → domain verified against admin-configured
  universities → 6-digit email verification (dev mode returns the code) → JWT login,
  logout, password reset, `role` (student | admin), role-based access control.
- **admin-web**: existing UI preserved; wired to the backend auth API (admin role
  enforced) with a login/session guard.
- **mobile-app**: Expo Router shell with every wireframe screen grouped into `(auth)`
  and `(tabs)`; Welcome / Sign In / Sign Up (+ email verify) built to match the
  wireframe; bottom tab bar with the raised circular "+" create button.

### Seed / test credentials

Run `cd backend && npm run seed` (already run once). Defaults:
- Admin: `admin@ridepact.com` / `Admin@12345`
- Allowed university: **State University** — domain `university.edu`
  (so student signups use e.g. `you@university.edu`)

## Out of scope (all phases)

Real payments/Stripe, Uber/Lyft, live GPS / route optimization, AI/ML matching,
referral/rewards/subscriptions, advanced analytics/BI, multi-language, external CRM.
