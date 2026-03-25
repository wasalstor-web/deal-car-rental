# Supabase + BookCars — مشروع Docker موحّد

مجلد **`supabase/docker/`** لا يُرفع إلى Git. يُنشأ تلقائياً عند أول **`npm run docker:up`** (يستدعي `supabase:clone-docker` إن لزم)، أو يدوياً:

```bash
npm run supabase:clone-docker
```

يتطلب **Git** في PATH. **`--force`** مع سكربت الاستنساخ يستبدل المجلد بالكامل.

## التشغيل الافتراضي (BookCars + Supabase)

```bash
npm run docker:up
```

يستخدم `docker compose -p bookcars` مع **`--env-file supabase/docker/.env`** وملفات: `docker-compose.yml` + `supabase/docker/docker-compose.yml` + `infra/docker-compose.supabase-bookcars.override.yml` (أسماء حاويات `bookcars-supabase-*`).

بعد أول تشغيل أو تعديل مفاتيح Supabase:

```bash
npm run supabase:sync-bookcars
npm run docker:up
```

**بدون Supabase:**

```bash
npm run docker:up:bookcars-only
```

**mongo-express:**

```bash
npm run docker:up:tools
```

**الإيقاف:**

```bash
npm run docker:down
```

## مسارات الحاويات

`npm run supabase:merge-gotrue` يعدّل `supabase/docker/docker-compose.yml`: يستبدل `./volumes/` بـ **`./supabase/docker/volumes/`** لأن المسارات تُحسب من جذر المستودع عند دمج الملفين.

## تعارض المنفذ 8010

أوقف أي **`supabase-kong`** قديم على 8010، أو غيّر المنافذ في `infra/supabase-bookcars-stack.fragment.env` ثم `npm run supabase:merge-gotrue`.

## المنافذ

| الخدمة | عنوان |
|--------|--------|
| Kong | `http://localhost:8010` |
| BookCars ويب | `http://localhost:13080` |
| API | `http://localhost:4002` |

## مفاتيح إنتاج

[Supabase self-hosting](https://supabase.com/docs/guides/self-hosting/docker#configuring-and-securing-supabase) و`generate-keys.sh` داخل `supabase/docker`.
