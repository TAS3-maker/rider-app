# RidePact — Local Setup Guide

RidePact is a student airport ride‑coordination platform. This repo is a monorepo with three apps:

| Folder        | App                | Stack                                    | Local URL (default)        |
|---------------|--------------------|------------------------------------------|----------------------------|
| `backend/`    | API + realtime     | Node.js + Express + Mongoose + Socket.IO | http://localhost:8500      |
| `frontend/`   | Mobile app         | Expo (SDK 57) + expo-router + NativeWind | Expo dev server :8081      |
| `admin-web/`  | Admin dashboard    | React + Vite + Tailwind                  | http://localhost:5173      |

> The logical names from the spec map to these folders: `ridepact/backend → backend`,
> `ridepact/mobile-app → frontend`, `ridepact/admin-web → admin-web`.
> (In the hosted preview a proxy exposes the API on `/api`; **locally you talk to the Node server directly** on port `8500`.)

---

## 1. Prerequisites

- **Node.js 20+** (developed on Node 24)
- **Yarn 1.x** (the mobile app uses Yarn) and **npm** (backend + admin-web)
- **MongoDB 6+** running locally, or a MongoDB Atlas connection string
- **Expo Go** app on your phone (optional, to run the mobile app on a device)

Start MongoDB locally, e.g.:

```bash
# macOS (Homebrew)
brew services start mongodb-community
# or run it directly
mongod --dbpath ~/data/db
```

---

## 2. Backend (`backend/`)

```bash
cd backend
npm install

# create your env file from the template
cp .env.example .env
```

Edit `backend/.env` — the important values:

```ini
MONGO_URL="mongodb://localhost:27017"
MONGO_DB_NAME=ridepact
NODE_PORT=8500
JWT_SECRET="<paste a long random 48+ char string>"
DEV_MODE=true          # returns the 6-digit email code in the API response (no real emails)
ADMIN_EMAIL=admin@ridepact.com
ADMIN_PASSWORD=Admin@12345
SEED_UNIVERSITY_NAME=State University
SEED_UNIVERSITY_DOMAIN=university.edu
```

Seed the admin user + reference data (airports, campus destinations, break events), then start:

```bash
npm run seed      # idempotent — safe to re-run
npm start         # API on http://localhost:8500  (routes under /api)
```

Quick check:

```bash
curl http://localhost:8500/api/health          # -> {"status":"ok",...}
```

Run the automated tests (server must be running, or point BASE at it):

```bash
npm test                                        # Node test runner (10 suites)
# against a custom URL:
BASE=http://localhost:8500/api npm test
```

**Default logins** (created by the seed):
- Admin: `admin@ridepact.com` / `Admin@12345`
- Demo students (pre-verified — log straight into the mobile app): `student@university.edu` / `Student@12345` and `taylor@university.edu` / `Student@12345`
- Or register your own with any `@university.edu` email (the verification code is returned in the response while `DEV_MODE=true`).

> Re-seed anytime with `npm run seed` (backend) or `yarn seed` from the `frontend/` folder.

---

## 3. Admin web (`admin-web/`)

```bash
cd admin-web
npm install

# point it at your local backend API
echo 'VITE_API_BASE_URL=http://localhost:8500/api' > .env

npm run dev        # http://localhost:5173
```

Open http://localhost:5173 and log in with the admin credentials above.
Production build: `npm run build` → static files in `admin-web/dist/`.

---

## 4. Mobile app (`frontend/`)

```bash
cd frontend
yarn install
```

Set the API URL in `frontend/.env`:

```ini
# On the iOS Simulator / Android Emulator on the same machine:
EXPO_PUBLIC_BACKEND_URL=http://localhost:8500

# On a physical phone (Expo Go): use your computer's LAN IP instead of localhost, e.g.
# EXPO_PUBLIC_BACKEND_URL=http://192.168.1.20:8500
```

> The app appends `/api` automatically, so do **not** include `/api` here.
> A phone can't reach `localhost` — use your machine's LAN IP and make sure the phone is on the same Wi‑Fi.

Start Expo:

```bash
npx expo start
```

- Press `i` (iOS Simulator), `a` (Android Emulator), or scan the QR code with **Expo Go**.
- Press `w` to open the web build in a browser.

---

## 5. Start order (summary)

1. **MongoDB** running.
2. **Backend**: `cd backend && npm run seed && npm start` (port 8500).
3. **Admin web**: `cd admin-web && npm run dev` (port 5173).
4. **Mobile**: `cd frontend && npx expo start`.

---

## 6. Troubleshooting

- **API calls fail from the phone** → you used `localhost`; switch `EXPO_PUBLIC_BACKEND_URL` to your LAN IP and restart Expo.
- **`MongoServerError: connect ECONNREFUSED`** → MongoDB isn't running / wrong `MONGO_URL`.
- **Login works but nothing loads in admin** → `VITE_API_BASE_URL` must include `/api` and point at port 8500; restart `npm run dev` after changing `.env`.
- **Verification code** → while `DEV_MODE=true`, the register response includes `devVerificationCode` (no email is sent). Set `DEV_MODE=false` in production once you wire an email provider.
- **Change the matching window / group capacity** → Admin dashboard → Settings, or seed defaults in `backend/src/config/constants.js`.

For deployment/build details see `ridepact/DEPLOYMENT.md`.
