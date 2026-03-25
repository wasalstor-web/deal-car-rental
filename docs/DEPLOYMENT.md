# Deployment checklist — النشر

Short reference for **Deal Car Rental**. Full upstream guide: [BookCars Wiki — Docker](https://github.com/aelassas/bookcars/wiki/Installing-(Docker)).

## Local / staging (Docker)

1. Copy env templates: `backend/.env.docker`, `frontend/.env.docker`, `admin/.env.docker` (adjust `VITE_BC_API_HOST`, CDN URLs, keys).
2. From repo root: `docker compose up -d --build`
3. Default ports (see `docker-compose.yml`): Mongo **27018**, API **4002**, Admin **3001**, Web **13080** → nginx.

## Production — minimum

| Item | Note |
|------|------|
| MongoDB | Strong `MONGO_INITDB_*` passwords; do not expose **27018** publicly unless firewalled |
| Secrets | Stripe/PayPal, JWT, reCAPTCHA, SMTP — only in server env, never in git |
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
