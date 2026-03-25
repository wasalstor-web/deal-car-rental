# Deployment checklist — النشر

Short reference for **Deal Car Rental**. Full upstream guide: [BookCars Wiki — Docker](https://github.com/aelassas/bookcars/wiki/Installing-(Docker)).

## Local / staging (Docker)

1. Copy env templates: `backend/.env.docker`, `frontend/.env.docker`, `admin/.env.docker` (adjust `VITE_BC_API_HOST`, CDN URLs, keys).
2. From repo root: `docker compose up -d --build`
3. Default ports (see `docker-compose.yml`): Mongo **27018**, API **4002**, Admin **3001**, Web **13080** → nginx.

## MyFatoorah (hosted payment)

1. **Backend** `BC_MYFATOORAH_API_URL` (e.g. test `https://apitest.myfatoorah.com`, Saudi prod `https://api-sa.myfatoorah.com`), `BC_MYFATOORAH_API_KEY` (Bearer token from portal), `BC_MYFATOORAH_PAYMENT_METHOD_ID` (from [InitiatePayment](https://docs.myfatoorah.com/docs/initiate-payment) / your account — often `1` or `2`).
2. **Frontend** `VITE_BC_PAYMENT_GATEWAY=MyFatoorah` (or `MYFATOORAH`).
3. **Callback**: `BC_FRONTEND_HOST` must be a **public HTTPS** URL (MyFatoorah rejects localhost). Return path: `/checkout-myfatoorah?bookingId=…` — MyFatoorah appends `paymentId`.
4. **Currency**: `DisplayCurrencyIso` must be supported for your portal country (e.g. SAR, KWD, AED).

## Production — minimum

| Item | Note |
|------|------|
| MongoDB | Strong `MONGO_INITDB_*` passwords; do not expose **27018** publicly unless firewalled |
| Secrets | Stripe/PayPal/**MyFatoorah**, JWT, reCAPTCHA, SMTP — only in server env, never in git |
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
