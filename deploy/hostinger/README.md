# Hostinger VPS (Docker + Traefik)

This stack matches the Traefik setup on VPS `srv1125123.hstgr.cloud`: routers use `Host(\`…\`)`, `websecure`, and `letsencrypt`.

## 1. DNS

Point three hostnames (or your own domain) to the VPS public IP, for example:

- `dealcar-web.srv1125123.hstgr.cloud` → A record → `147.93.120.99`
- `dealcar-api.srv1125123.hstgr.cloud` → A record → `147.93.120.99`
- `dealcar-admin.srv1125123.hstgr.cloud` → A record → `147.93.120.99`

Use the same values in `.env` as `WEB_FQDN`, `API_FQDN`, `ADMIN_FQDN`.

## 2. Config files on the server

```bash
cd /path/to/deal-car-rental
cp deploy/hostinger/.env.example deploy/hostinger/.env
cp deploy/hostinger/secrets/backend.env.example deploy/hostinger/secrets/backend.env
nano deploy/hostinger/.env
nano deploy/hostinger/secrets/backend.env
```

Set strong `MONGO_ROOT_PASSWORD`, `BC_COOKIE_SECRET`, `BC_JWT_SECRET`, `BC_SUPABASE_JWT_SECRET`, and SMTP/payment keys as needed.

`COOKIE_DOMAIN` should be a parent domain shared by the three hosts (e.g. `.srv1125123.hstgr.cloud`).

## 3. Build and run

From the **repository root**:

```bash
docker compose -f deploy/hostinger/docker-compose.yml --env-file deploy/hostinger/.env up -d --build
```

## 4. Hostinger API (optional)

`VPS_createNewProjectV1` can pull compose from a **raw** URL, for example:

`https://raw.githubusercontent.com/wasalstor-web/deal-car-rental/main/deploy/hostinger/docker-compose.yml`

You must still create `.env` and `secrets/backend.env` on the VM (or inject equivalent variables via your deployment process). The default BookCars GitHub branch is `main`, not `master`.

## 5. After deploy

- Open `https://<WEB_FQDN>` (frontend), `https://<ADMIN_FQDN>` (admin), API at `https://<API_FQDN>`.
- If you change public URLs or Supabase keys, rebuild `bc-frontend` / `bc-admin` so Vite picks up build-time env.
