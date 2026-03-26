# Launch readiness — جاهزية التدشين (Deal Car Rental / BookCars)

Use this as a **go-live gate**: product, infrastructure, security, and quality. Check every box that applies to your deployment (local Docker, Hostinger VPS, or another host).

**Related:** [DEPLOYMENT.md](DEPLOYMENT.md) · [deploy/hostinger/README.md](../deploy/hostinger/README.md) · [SUPABASE_EVERYTHING.md](SUPABASE_EVERYTHING.md) · [locales/README.txt](../locales/README.txt)

---

## 1. Product & domains

- [ ] **Public URLs**: `BC_FRONTEND_HOST`, admin origin, and API base URL match what users type in the browser (HTTPS in production).
- [ ] **CORS / cookies**: `BC_AUTH_COOKIE_DOMAIN` and backend CORS allow those exact origins.
- [ ] **MyFatoorah** (if used): `BC_FRONTEND_HOST` is the same public SPA origin; return URL is not `localhost` in production.
- [ ] **Stripe / PayPal**: live keys only in production env; test keys never on production servers.

---

## 2. Data & backups

- [ ] **MongoDB**: strong credentials; port **not** exposed publicly unless strictly firewalled/VPN.
- [ ] **Backup strategy**: scheduled dumps or managed backup (document who restores and how).
- [ ] **CDN / uploads**: volumes or object storage for user/car assets; paths match `BC_CDN_*` in backend.

---

## 3. Auth (BookCars + optional Supabase)

- [ ] **JWT / cookie secrets**: `BC_JWT_SECRET`, `BC_COOKIE_SECRET` — unique per environment, never committed.
- [ ] **Supabase** (if enabled): `BC_SUPABASE_JWT_SECRET` equals self-hosted `JWT_SECRET` or cloud project secret; `VITE_BC_SUPABASE_*` / `BC_SUPABASE_*` on clients point to the **public** API URL.
- [ ] **Self-hosted Supabase**: `SITE_URL` / redirect URLs include your real web origin; `ENABLE_EMAIL_AUTOCONFIRM=true` **not** used in production without explicit risk acceptance.

---

## 4. Email & mobile push

- [ ] **SMTP** (`BC_SMTP_*`): working for sign-up, booking, and password flows.
- [ ] **Expo push** (optional): `BC_EXPO_ACCESS_TOKEN` set on backend if you need driver push notifications (see [DEPLOYMENT.md](DEPLOYMENT.md#الإشعارات--تفعيلها-على-السيرفر)).

---

## 5. Mobile (Android / iOS)

- [ ] **`google-services.json`** / iOS equivalents: real Firebase project for production builds (not placeholder).
- [ ] **`mobile/.env`**: `BC_API_HOST`, CDN URLs, and Supabase URL match production or staging endpoints.
- [ ] **Arabic + RTL**: smoke-test settings language → `ar` and main flows (search, checkout, profile).

---

## 6. i18n & content

- [ ] From repo root: `npm run i18n:verify` and `npm run i18n:verify-mobile` pass after any string changes.
- [ ] Arabic (and other locales): spot-check legal/footer copy and payment/error messages.

---

## 7. Quality & CI

- [ ] **Quick local gate** (from repo root): `npm run verify:all` — i18n parity (web + mobile), root ESLint, backend unit tests (`authHelper`, no Mongo required).
- [ ] **Full compile gate (no Mongo):** `npm run verify:complete` — same as above plus production builds for **frontend** and **admin**, and mobile `tsc`.
- [ ] **Build-only (all apps):** `npm run verify:build` — backend + frontend + admin + mobile TypeScript.
- [ ] **Integration tests:** `cd backend && npm test` requires **MongoDB** reachable at `BC_DB_URI` (e.g. `npm run docker:up:bookcars-only` with Docker Desktop running).
- [ ] **Build** (matches GitHub `build.yml`): backend, admin, frontend, mobile `ts:check` / lint as you use locally.
- [ ] **Backend tests**:
  - Full suite: `npm test` in `backend/` requires a **reachable MongoDB** matching `BC_DB_URI` (e.g. Docker on `27018`).
  - Fast auth/unit only (no DB global setup): `npm run test:unit` in `backend/` or from repo root: `npm run backend:test:unit`.
- [ ] **Sentry** (if enabled): DSN and environment tags verified in staging.

---

## 8. Hostinger / Traefik (if applicable)

- First-time deploy: [deploy/hostinger/README.md §7–§8](../deploy/hostinger/README.md).
- After code changes on the VPS: `git pull` then **`npm run hostinger:update-stack`** (Linux/VPS shell), or the manual flow in [deploy/hostinger/README.md — section 9](../deploy/hostinger/README.md).

---

## 9. Day-of-launch

- [ ] Smoke: sign-up, search, booking, payment (test amount if available), admin login, one cancellation path.
- [ ] Monitor: API logs, error rate, disk space on Mongo volume.
- [ ] Rollback plan: previous Docker image tags or git tag + env snapshot documented.

---

*Last aligned with repo scripts: root `package.json`, `backend/package.json`, and CI workflows `build.yml` / `test.yml`.*
