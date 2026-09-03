# RidePact — Production Config & Deployment

Monorepo mapped to platform paths (see README.md): backend → `/app/backend`,
mobile-app → `/app/frontend`, admin-web → `/app/admin-web`.

## 1. Backend (Node/Express + Mongoose)
Runtime: Node 24. The platform's FastAPI edge process on `:8001` reverse-proxies
`/api/*` (and `/api/socket.io`) to the Node server on `127.0.0.1:8500`.

Required env vars (`backend/.env`, see `.env.example`):
- `MONGO_URL`, `MONGO_DB_NAME`
- `JWT_SECRET` (48+ random chars), `JWT_ISSUER`, `JWT_AUDIENCE`, `ACCESS_TOKEN_TTL`
- `NODE_PORT=8500`
- `DEV_MODE` (`false` in prod once real email is wired), seed vars.

On deploy, all new `.env` keys are copied to the platform secrets store; edit
production values under Publish → Secrets. **Rotate `JWT_SECRET` for production.**

Seed reference data + admin: `npm run seed` (idempotent).
Automated tests: `npm test` (Node built-in runner, hits a live server on :8001).

## 2. Mobile app (Expo + expo-router + NativeWind)
> Note: this environment ships **Expo SDK 57** (RN 0.81, React 19). The original
> brief said SDK 54; we use the environment's SDK so live preview + EAS builds work.
> JavaScript only (screens are `.jsx`; no TypeScript source).

`app.json` production settings already configured: `name`, `slug`, `scheme=ridepact`,
`ios.bundleIdentifier`, `android.package`, `userInterfaceStyle=light`, icons/splash,
and declared permissions/plugins. `EXPO_PUBLIC_BACKEND_URL` is read from `frontend/.env`.

Build via the Emergent **Publish** button → Deploy → Generate iOS/Android builds
(EAS is Emergent-managed; do not add `eas.json`).

## 3. Admin web (React + Vite + Tailwind)
- Dev/preview: served by the Node backend at `/api/admin-panel/` (single-backend rule).
- Production build: `cd admin-web && npm run build` → `dist/` (static SPA).
- `VITE_API_BASE_URL` (in `admin-web/.env`) points at the backend `/api` origin.
- After any admin-web source change, rebuild so the served `/api/admin-panel/` updates.

## 4. Standing rules honored
- All list endpoints support server-side pagination (`page`/`limit`/`total`).
- Icons only, no emojis in newly built UI (lucide-react-native / lucide-react).
- Mobile screens use flexible layout + safe-area insets (iOS/Android, small→large).
