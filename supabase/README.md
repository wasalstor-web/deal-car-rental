# Supabase + BookCars (نفس مشروع Docker Compose)

مجلد **`supabase/docker/`** لا يُرفع إلى Git (يُنشأ محلياً). هو نسخة من [Supabase Docker الرسمي](https://github.com/supabase/supabase/tree/master/docker).

## التثبيت مرة واحدة

من **جذر المستودع**:

```bash
npm run supabase:clone-docker
```

يتطلب **Git** في PATH. الخيار `--force` يستبدل المجلد بالكامل.

## التشغيل الموحّد (BookCars + Supabase)

```bash
npm run supabase:sync-bookcars
npm run docker:up:supabase
```

- اسم المشروع: **`bookcars`** (`docker compose -p bookcars`) حتى تبقى كل الحاويات تحت بادئة واحدة.
- شبكة BookCars: **`bookcars_isolated`** — خدمات Supabase تستخدم الشبكة الافتراضية للمشروع (`bookcars_default`)؛ المتصفح يصل إلى Kong على المضيف، ولا حاجة لربط الشبكتين لمسار تسجيل الدخول الحالي.

## المنافذ (بعد دمج `infra/supabase-bookcars-stack.fragment.env`)

| الخدمة | عنوان |
|--------|--------|
| Kong (Supabase API + Studio) | `http://localhost:8010` |
| BookCars ويب | `http://localhost:13080` |
| BookCars API | `http://localhost:4002` |

غيّر القيم في **`infra/supabase-bookcars-stack.fragment.env`** ثم نفّذ `npm run supabase:merge-gotrue` (أو أعد تشغيل الدمج يدوياً في `supabase/docker/.env`).

## مفاتيح وأسرار

قبل الإنتاج: اتبع [توثيق Supabase](https://supabase.com/docs/guides/self-hosting/docker#configuring-and-securing-supabase) و`./utils/generate-keys.sh` داخل `supabase/docker` إن لزم.

## إيقاف المكدس

```bash
npm run docker:down:supabase
```
