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

## Progress checkpoint — أين وصلنا (يُحدَّث يدويًا)

**آخر تحديث:** 2026-03-26.

| البند | الحالة |
|--------|--------|
| **المستودع** | `main` على [wasalstor-web/deal-car-rental](https://github.com/wasalstor-web/deal-car-rental) — آخر دفعة معروفة: `c5455d7` (جاهزية التدشين، سكربتات VPS، QA، وثائق Hostinger). |
| **VPS (Hostinger)** | مسار النشر: `/docker/dealcar-rental` — مكدس **جذر** `docker-compose.yml` (بدون Traefik موحّد وبدون Supabase ذاتي على نفس المكدس حتى إشعار آخر). |
| **تحديث السيرفر بعد تغيير الكود** | من المجلد أعلاه: `./scripts/vps/update-dealcar.sh` (أو `git pull --ff-only` ثم `docker compose up -d --build`). |
| **منافذ عامة (IP)** | واجهة **13080** → HTTP **200**؛ أدمن **3001** → **200**؛ API **4002** → **404** على `/` (طبيعي إن لم يكن هناك مسار جذر). |
| **ما اكتمل تقريبًا** | سكربتات التحقق `verify:all` / `verify:complete` / `verify:build`؛ اختبارات وحدات `authHelper` بدون Mongo؛ توثيق النشر و Hostinger؛ سحب وبناء على VPS بعد الدفع. |

### ما يبقى قبل/بعد الإنتاج «الكامل»

1. **نطاق و HTTPS:** ربط دومين حقيقي، شهادة TLS (أو وكيل عكسي)، وتطابق `BC_FRONTEND_HOST` / CORS / كوكي النطاق مع الأصول العامة.
2. **أمان البيانات:** تقييد أو إزالة تعريض **Mongo** (`27018`) و **mongo-express** (`8084`) للإنترنت؛ نسخ احتياطي مجدول.
3. **بريد ودفع:** التأكد من `BC_SMTP_*`؛ مفاتيح **MyFatoorah** / Stripe حسب البيئة؛ عدم بقاء `localhost` في روابط الإرجاع.
4. **مكدس Hostinger «الموحّد» (اختياري):** يتطلب `deploy/hostinger/.env` + `supabase/docker/.env` و DNS؛ على الـ VPS الحالي **لا يوجد Node** — مسار `npm run hostinger:update-stack` يحتاج تثبيت Node أو تشغيله من جهازك.
5. **اختبارات تكامل:** `cd backend && npm test` مع Mongo قيد التشغيل (Docker محلي أو نفس المنفذ على السيرفر).
6. **يوم التدشين:** اختبار دخان (تسجيل، بحث، حجز، دفع تجريبي، أدمن) + مراقبة السجلات وخطة تراجع.

*Last aligned with repo scripts: root `package.json`, `backend/package.json`, and CI workflows `build.yml` / `test.yml`.*
