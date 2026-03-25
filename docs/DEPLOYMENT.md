# Deployment checklist — النشر

Short reference for **Deal Car Rental**. Full upstream guide: [BookCars Wiki — Docker](https://github.com/aelassas/bookcars/wiki/Installing-(Docker)).

**مرجع واحد لـ Supabase الذاتي + BookCars (منافذ، env، أوامر npm، تدفقات، استكشاف أخطاء Windows):** [SUPABASE_EVERYTHING.md](SUPABASE_EVERYTHING.md).

## قاعدة المنافذ المحلية (Docker + Supabase على الجهاز)

| الخدمة | عنوان افتراضي |
|--------|-----------------|
| واجهة BookCars (nginx) | `http://localhost:13080` |
| API BookCars | `http://localhost:4002` |
| لوحة الأدمن | `http://localhost:3001` |
| MongoDB (المضيف) | `localhost:27018` |
| Supabase Kong | **`http://localhost:8010`** عند استخدام المكدس الموحّد مع BookCars (قيم `infra/supabase-bookcars-stack.fragment.env` يدمجها `npm run supabase:merge-gotrue`). بدون ذلك، القالب الرسمي غالبًا **8000** — غيّر `KONG_HTTP_PORT` و`SUPABASE_PUBLIC_URL` و`API_EXTERNAL_URL` معًا إن تعارض المنفذ |

ملف مرجعي واحد للقيم المنسّقة: `infra/supabase-self-host.defaults.env` — ولدمج إعادة توجيه GoTrue مع الويب: `infra/supabase-gotrue-bookcars.fragment.env` — وللمنافذ بجانب BookCars دون تعارض: **`infra/supabase-bookcars-stack.fragment.env`**.

**مكدس واحد (Compose):** **`npm run docker:up`** يدمج BookCars + Supabase (`-p bookcars`، ملفان) ويستنسخ `supabase/docker` عند أول تشغيل إن لزم. ثم **`npm run supabase:sync-bookcars`** لملء `backend/.env.docker` و`frontend/.env.docker`. الإيقاف: **`npm run docker:down`**. بدون Supabase: **`npm run docker:up:bookcars-only`**. تفاصيل: [supabase/README.md](../supabase/README.md).

**Windows + Supabase Docker:** إذا بقي حاوية `supabase-kong` غير صحية وتظهر في السجلات `exec /home/kong/kong-entrypoint.sh: no such file or directory`، فغالبًا الملف `supabase/docker/volumes/api/kong-entrypoint.sh` محفوظ بـ CRLF. حوّله إلى أسطر LF فقط (مثلاً عبر محرر أو `python` يستبدل `\r\n` بـ `\n`) ثم أعد تشغيل Kong. إن كان **`supabase-pooler`** يعيد التشغيل بخطأ Elixir **carriage return** في السجلات، طبّق نفس التطبيع على **`volumes/pooler/pooler.exs`** ثم **`docker compose restart supavisor`**. سكربت **`npm run supabase:merge-gotrue`** (على Windows أو مع **`--fix-kong-lf`**) يحاول تطبيع **كلا** الملفين تلقائيًا.

## Local / staging (Docker)

1. Copy env templates: `backend/.env.docker`, `frontend/.env.docker`, `admin/.env.docker` (adjust `VITE_BC_API_HOST`, CDN URLs, keys).
2. From repo root: **`npm run docker:up`** — BookCars + Supabase (يستنسخ `supabase/docker` تلقائياً عند الحاجة). بدون Supabase: **`npm run docker:up:bookcars-only`**.
3. **mongo-express** (اختياري): `docker compose --profile devtools up -d --build` أو `npm run docker:up:tools`.
4. **عزل الشبكة**: الخدمات على شبكة `bookcars_isolated` — لا تختلط مع مشاريع Compose أخرى على نفس الجهاز إلا إذا ربطتها يدوياً.
5. **تعارض المنافذ على VPS**: عرّف `BOOKCARS_HOST_PORT_*` في `.env` بجانب `docker-compose.yml` — مثال: `deploy/hostinger/ports-root-stack.env.example`.
6. Default ports (see `docker-compose.yml`): Mongo **27018**, API **4002**, Admin **3001**, Web **13080** → nginx.

## Mobile — Android مرتبط بنفس الـ API (Docker)

الويب والموبايل يستخدمان **نفس الـ backend** عبر `BC_API_HOST` ومسارات الـ CDN على نفس المنفذ.

1. من جذر المشروع: `docker compose up -d --build` (تأكد أن الـ API يعمل على **4002**).
2. في `mobile/`: انسخ `mobile/.env.docker.android.example` إلى **`mobile/.env`** (أو عدّل الموجود).
   - **محاكي Android:** `BC_API_HOST=http://10.0.2.2:4002` ونفس الـ host لكل `BC_CDN_*`.
   - **جهاز حقيقي (نفس الشبكة):** راجع **`mobile/.env.physical-device.example`** — استبدل `192.168.1.100` بعنوان IPv4 للكمبيوتر (`ipconfig` على Windows) وطابق منفذ Supabase مع `KONG_HTTP_PORT`.
3. الاتصال بـ HTTP محلي مسموح في التطبيق عبر الإضافة `plugins/usesCleartextTraffic` في `app.json`.
4. من `mobile/`: `npm i` ثم `npm run android` (Metro على المنفذ **8082** حسب `package.json`).
5. **MyFatoorah:** تدفق الدفع على الويب؛ تطبيق العميل ما زال يعتمد **Stripe** في شاشة الدفع — الربط المشترك هنا هو **API + CDN + الحجوزات**، وليس بالضرورة نفس بوابة الدفع على الموبايل.
6. لبناء Android يلزم **`mobile/google-services.json`** (من Firebase Console، حزمة `com.bookcars`). للتجربة المحلية فقط يمكن نسخ **`mobile/google-services.placeholder.json`** إلى `google-services.json` — استبدله بملفك الحقيقي قبل الإنتاج أو أي ميزة تعتمد على FCM/Google.

من جذر المستودع يمكنك استخدام: `npm run docker:up` و`npm run mobile:android`.

## Supabase Auth (اختياري — تسجيل دخول عبر Supabase + جلسة BookCars)

لا يستبدل MongoDB؛ يتحقق الـ backend من **JWT الصادر عن Supabase** ثم ينشئ أو يربط مستخدمًا في Mongo ويصدر نفس كوكي/توكن BookCars.

### سحابي (موصى به للبدء)

1. أنشئ مشروعًا في [Supabase](https://supabase.com) → **Authentication** → فعّل **Email** (أو المزودين الآخرين لاحقًا).
2. **Settings → API**: انسخ **Project URL** و**anon public** و**JWT Secret** (لا ترفع الـ Secret إلى الواجهة الأمامية).
3. **Backend** (`backend/.env` أو `.env.docker`):  
   `BC_SUPABASE_JWT_SECRET=<JWT Secret من لوحة Supabase>`
4. **Frontend** (`frontend/.env` أو `.env.docker`):  
   `VITE_BC_SUPABASE_URL=<Project URL>`  
   `VITE_BC_SUPABASE_ANON_KEY=<anon public key>`
5. **Mobile** (`mobile/.env`):  
   `BC_SUPABASE_URL=...`  
   `BC_SUPABASE_ANON_KEY=...`  
   (نفس القيم؛ الـ anon آمن للعميل، أما الـ JWT Secret فيبقى على السيرفر فقط.)
6. أعد بناء حاويات الواجهة بعد تغيير متغيرات `VITE_*`: `docker compose up -d --build`.
7. المستخدم يسجّل الدخول في Supabase (زر «Supabase» في شاشة تسجيل الدخول)، ثم يستدعي العميل `POST /api/supabase-sign-in/frontend` تلقائيًا. أول دخول ينشئ مستخدم **User** في Mongo إن لم يكن موجودًا (مثل تسجيل الدخول الاجتماعي).

### استضافة ذاتية على السيرفر

اتبع [دليل Docker الرسمي لـ Supabase](https://supabase.com/docs/guides/self-hosting/docker). بعد التشغيل، خذ **JWT Secret** من ملف البيئة الخاص بالنشر وضعه في `BC_SUPABASE_JWT_SECRET`، ووجّه `VITE_BC_SUPABASE_URL` / `BC_SUPABASE_URL` إلى عنوان الـ API العام لـ Kong/البوابة كما في وثائقهم. تأكد أن **Site URL** و**Redirect URLs** في إعدادات Auth تطابق نطاق الواجهة الحقيقية.

### Supabase Docker على نفس الجهاز + BookCars (Docker)

0. **اختياري — كل شيء تحت مشروع `bookcars`:** `npm run supabase:clone-docker` ثم `npm run docker:up:supabase` (يحمّل `docker-compose.yml` + `supabase/docker/docker-compose.yml` مع `-p bookcars`).
1. في مجلد **supabase/docker** لديك: `JWT_SECRET` و`ANON_KEY` و`SUPABASE_PUBLIC_URL` (مع المكدس الموحّد غالبًا **`http://localhost:8010`** وKong على المضيف **8010**؛ انظر `infra/supabase-bookcars-stack.fragment.env`).
2. **Backend** (`backend/.env.docker`): `BC_SUPABASE_JWT_SECRET` = نفس قيمة **`JWT_SECRET`** في Supabase (لا تستخدم `SERVICE_ROLE_KEY` هنا).
3. **Frontend** (`frontend/.env.docker`): `VITE_BC_SUPABASE_URL` يجب أن يطابق **`SUPABASE_PUBLIC_URL`** (مثلاً `http://localhost:8010` مع المكدس الموحّد، أو `http://localhost:8000` مع القالب الافتراضي) و`VITE_BC_SUPABASE_ANON_KEY=<ANON_KEY>`. ثم أعد بناء الواجهة: `docker compose build bc-frontend && docker compose up -d bc-frontend`.
4. **Mobile**: من المحاكي استخدم `BC_SUPABASE_URL=http://10.0.2.2:<منفذ_Kong>` (نفس رقم المنفذ في عنوان الـ host)؛ من هاتف على الشبكة استبدل بعنوان IP لجهاز الكمبيوتر. نفس **`ANON_KEY`**.
5. في **supabase/docker/.env** عدّل **`SITE_URL`** وإن لزم **`ADDITIONAL_REDIRECT_URLS`** لتشمل واجهة BookCars، مثلاً `http://localhost:13080` (وأعد تشغيل حاويات Supabase بعد التعديل).
6. مرجع سريع للقيم الافتراضية الرسمية (قبل `generate-keys.sh`): الملف **`infra/supabase-self-host.defaults.env`** في هذا المستودع.
7. دمج GoTrue مع واجهة BookCars: من جذر المستودع **`npm run supabase:merge-gotrue`** (يستهدف أولاً **`./supabase/docker`** إن وُجد فيه `.env`، وإلا **`%USERPROFILE%\supabase\docker`** — أو مرّر **`--dir`**). على **Windows** يحاول السكربت تلقائيًا تطبيع **`volumes/api/kong-entrypoint.sh`** إلى أسطر **LF**؛ أو نفّذ نفس الأمر مع **`--fix-kong-lf`** على أي نظام إن استنسخت المجلد من جهاز يستخدم CRLF.
8. مزامنة أسرار وعناوين Supabase → BookCars دفعة واحدة: **`npm run supabase:sync-bookcars`** (اختياري: **`--supabase-dir`** و**`--bookcars-root`**). يحدّث `backend/.env.docker` و`frontend/.env.docker` و`mobile/.env` من **`JWT_SECRET`**, **`ANON_KEY`**, **`SUPABASE_PUBLIC_URL`** في `supabase/docker/.env` (والموبايل يحوّل `localhost` إلى **`10.0.2.2`** للمحاكي). بعدها أعد تشغيل **`bc-backend`** وأعد بناء **`bc-frontend`** إن لزم.
9. **تطوير محلي بدون SMTP:** في `supabase/docker/.env` اجعل **`ENABLE_EMAIL_AUTOCONFIRM=true`** حتى يعمل تسجيل الدخول بالبريد/كلمة المرور بدون رسالة تأكيد (لا تستخدم ذلك في الإنتاج بدون مراجعة أمنية).
10. **أدوات من جذر المستودع:**  
    - **`npm run supabase:verify-local`** — يتحقق من `auth/v1/health` و`rest/v1/` عبر **`SUPABASE_PUBLIC_URL`**.  
    - **`npm run supabase:seed-user`** — ينشئ مستخدمًا تجريبيًا افتراضيًا **`dev@bookcars.local`** / **`BookcarsLocalDev1!`** (غيّر عبر **`--email`** و **`--password`**). آمن لإعادة التشغيل: إن وُجد المستخدم يطبع رسالة ولا يفشل.  
    - **`npm run supabase:apply-docker`** — يشغّل التحقق + **`supabase:sync-bookcars`** + **`docker compose restart bc-backend`** + بناء ورفع **`bc-frontend`** (خيارات: **`--no-docker`**, **`--no-frontend-rebuild`**, **`--supabase-dir`**).  
11. **Supabase Studio (لوحة ذاتية الاستضافة):** عادةً على نفس **`SUPABASE_PUBLIC_URL`** في المسار الجذر **`/`** مع **Basic Auth** — اسم المستخدم وكلمة المرور من **`DASHBOARD_USERNAME`** و **`DASHBOARD_PASSWORD`** في `supabase/docker/.env` (المثال الرسمي: `supabase` / كلمة مرور تجريبية).

#### قائمة تحقق سريعة (self-host + BookCars)

| # | ماذا تتحقق |
|---|------------|
| 1 | `JWT_SECRET` في `supabase/docker/.env` = `BC_SUPABASE_JWT_SECRET` في `backend/.env.docker` |
| 2 | `SUPABASE_PUBLIC_URL` يطابق منفذ **`KONG_HTTP_PORT`** (مثلاً `http://localhost:8010` إن غيّرت المنفذ) |
| 3 | `docker ps` يظهر للـ Kong نشر المضيف مثل `0.0.0.0:8010->8000/tcp` — إن لم يظهر، جرّب `docker compose up -d --force-recreate kong` داخل `supabase/docker` |
| 4 | `curl -s -o NUL -w "%{http_code}" http://127.0.0.1:<KONG_HTTP_PORT>/rest/v1/` يعيد **401** (بدون مفتاح؛ يعني البوابة تستجيب) |
| 5 | بعد أي تغيير في `VITE_BC_SUPABASE_*`: **`docker compose build bc-frontend && docker compose up -d bc-frontend`** |
| 6 | اختياري: **`npm run supabase:sync-bookcars`** لمزامنة `JWT_SECRET` / `ANON_KEY` / `SUPABASE_PUBLIC_URL` من `supabase/docker/.env` إلى ملفات BookCars |
| 7 | **`npm run supabase:verify-local`** للتأكد أن Kong + Auth + REST يستجيبان |
| 8 | **`npm run supabase:seed-user`** لإنشاء مستخدم تجريبي `dev@bookcars.local` (أو `--email` / `--password`) لتجربة زر Supabase في الواجهة |
| 9 | بعد تعديل `supabase/docker/.env`: **`npm run supabase:apply-docker`** (أو يدويًا: sync + إعادة تشغيل/بناء الحاويات كما في سكربت التطبيق) |

## الإشعارات — تفعيلها على السيرفر

| القناة | الوصف | التفعيل |
|--------|--------|---------|
| داخل التطبيق / الويب | سجلات في Mongo + عداد الإشعارات | يعمل تلقائيًا مع الحجوزات والتحديثات |
| البريد | رسائل للسائق/المستخدم عند `enableEmailNotifications` | اضبط `BC_SMTP_*` في الـ backend |
| دفع الجوال (Expo) | إشعار للسائق عند تحديث الحجز إن وُجد `PushToken` | ضع **`BC_EXPO_ACCESS_TOKEN`** في بيئة الـ backend (من حسابك في [expo.dev](https://expo.dev) → **Account settings** → **Access tokens**). بدون هذا المتغير تُحفظ الإشعارات في Mongo ويُرسل البريد إن وُجد، و**لن** تُرسل دفعات Expo. |

تسجيل الـ push token من التطبيق يتم عبر واجهات `/api/create-push-token/...` بعد تسجيل الدخول (كما في التدفق الحالي).

## MyFatoorah (hosted payment)

Use **one** public frontend URL for both the SPA and payment return — **`BC_FRONTEND_HOST`** (must match the origin visitors use in the browser so CORS and email links stay consistent).

1. **Backend** `BC_MYFATOORAH_API_URL` (e.g. test `https://apitest.myfatoorah.com`, Saudi prod `https://api-sa.myfatoorah.com`), `BC_MYFATOORAH_API_KEY`, `BC_MYFATOORAH_PAYMENT_METHOD_ID` (from [InitiatePayment](https://docs.myfatoorah.com/docs/initiate-payment) / portal — often `1` or `2`).
2. **Frontend** `VITE_BC_PAYMENT_GATEWAY=MyFatoorah` (or `MYFATOORAH`).
3. **`BC_FRONTEND_HOST`**: Set to the **same HTTPS URL** customers use to open the site (e.g. `https://rental.example.com/`). MyFatoorah rejects `localhost` in return URLs — for local testing, expose the frontend on a public tunnel (ngrok, etc.) and set `BC_FRONTEND_HOST` to that HTTPS base. Return path: `/checkout-myfatoorah?bookingId=…` (MyFatoorah appends `paymentId`).
4. **Currency**: `VITE_BC_BASE_CURRENCY` (e.g. `SAR`) should match `DisplayCurrencyIso` for your MyFatoorah country account.

## Hostinger VPS (Docker + Traefik)

For a **Hostinger VPS** that already runs **Traefik** with Let’s Encrypt (same label pattern as other sites on the server), use the compose file and steps in **[deploy/hostinger/README.md](../deploy/hostinger/README.md)** (`deploy/hostinger/docker-compose.yml`, `.env`, `secrets/backend.env`).

## Production — minimum

| Item | Note |
|------|------|
| MongoDB | Strong `MONGO_INITDB_*` passwords; do not expose **27018** publicly unless firewalled |
| Secrets | Stripe/PayPal/**MyFatoorah**, JWT, **Supabase JWT secret** (server only), reCAPTCHA, SMTP — never in git |
| HTTPS | Reverse proxy (nginx/Caddy) + valid certificates |
| CDN / uploads | Volume or object storage for `cdn` paths expected by backend |
| CORS / hosts | API must allow your real frontend/admin domains |

## CI (GitHub Actions)

Workflows `build.yml` and `test.yml` run on `main`. No extra secrets required for default build; add tokens only if you extend workflows (Codecov, deploy, etc.).

## i18n maintenance

```bash
npm run i18n:verify
npm run i18n:verify-mobile
```

## Sync from upstream BookCars

```bash
git fetch upstream
git merge upstream/main   # or rebase, resolve conflicts
```
