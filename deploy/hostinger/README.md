# Hostinger VPS (Docker + Traefik)

This stack matches the Traefik setup on VPS `srv1125123.hstgr.cloud`: routers use `Host(\`…\`)`, `websecure`, and `letsencrypt`.

## Isolation from other Docker projects

- **Dedicated bridge network** `bookcars_isolated`: only `mongo`, `bc-backend`, `bc-admin`, and `bc-frontend` are attached. They do not join other projects’ default networks.
- **No Mongo on the host**: MongoDB is not published to a host port; only app containers reach it.
- **No mongo-express** in this file (avoid exposing a DB UI on the internet).
- **Unique `COMPOSE_PROJECT_NAME`**: Traefik router names are `${COMPOSE_PROJECT_NAME}-web|api|admin`. Pick a value that does not collide with other apps on the same VPS.
- **Volumes** are still scoped by the Compose project name (e.g. `dealcarbk_cdn`), so data stays separate from other stacks.

If you deploy the **root** `docker-compose.yml` from hPanel instead, use a unique project directory name and optional port overrides — see `ports-root-stack.env.example` (copy variables into a `.env` next to the root compose file).

## 1. DNS

Point three hostnames (or your own domain) to the VPS public IP, for example:

- `dealcar-web.srv1125123.hstgr.cloud` → A record → `147.93.120.99`
- `dealcar-api.srv1125123.hstgr.cloud` → A record → `147.93.120.99`
- `dealcar-admin.srv1125123.hstgr.cloud` → A record → `147.93.120.99`

Use the same values in `.env` as `WEB_FQDN`, `API_FQDN`, `ADMIN_FQDN`.

Add a **fourth** hostname for **Supabase (Kong)** and set `SUPABASE_FQDN` in `deploy/hostinger/.env` (must match `SUPABASE_PUBLIC_URL` / `API_EXTERNAL_URL` in `supabase/docker/.env`, e.g. `https://<SUPABASE_FQDN>`).

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

For **self-hosted Supabase** on the same VPS, you also need `supabase/docker/.env` (run `npm run supabase:clone-docker` once). Set `SUPABASE_PUBLIC_URL` and `API_EXTERNAL_URL` to `https://<SUPABASE_FQDN>`, and copy `ANON_KEY` into `SUPABASE_ANON_KEY` in `deploy/hostinger/.env`. `BC_SUPABASE_JWT_SECRET` in `secrets/backend.env` must match Supabase `JWT_SECRET`.

Before merge on the server, point GoTrue at the public web URL:

```bash
export BOOKCARS_SITE_URL="https://<WEB_FQDN>"
npm run supabase:merge-gotrue
```

## 3. Build and run

### Option A — **Recommended:** BookCars + Supabase + Traefik (unified)

Requires an **external Docker network** used by Traefik on this VPS (see `TRAEFIK_DOCKER_NETWORK` in `.env.example`, often `traefik`). The **first** compose file must stay the repo-root `docker-compose.yml` so Supabase volume paths resolve correctly.

From the **repository root**:

```bash
npm run docker:up:hostinger
```

Equivalent to merging: `docker-compose.yml` + `supabase/docker/docker-compose.yml` + `infra/docker-compose.supabase-bookcars.override.yml` + `deploy/hostinger/docker-compose.traefik-overlay.yml`, with `--env-file supabase/docker/.env` and `--env-file deploy/hostinger/.env`, and project name `COMPOSE_PROJECT_NAME` from `deploy/hostinger/.env`.

Shell shortcut: `deploy/hostinger/up-unified.sh`.

### Option B — BookCars only (no self-hosted Supabase)

Use Supabase Cloud or another URL: fill `SUPABASE_PUBLIC_URL` / `SUPABASE_ANON_KEY` in `deploy/hostinger/.env`, then from the **repository root**:

```bash
docker compose -f deploy/hostinger/docker-compose.yml --env-file deploy/hostinger/.env up -d --build
```

## 4. Hostinger “Docker Compose” from GitHub

When the panel **clones the full repository**, it currently uses the **root** `docker-compose.yml` (not this folder’s file). That is fine after the repo change to build from **`.env.docker.example`** and to load backend env from the example plus optional `.env.docker`.

For **Traefik + HTTPS** on the VPS, prefer SSH from the repo root:

- **With self-hosted Supabase:** `npm run docker:up:hostinger` (see option A above).
- **Without Supabase stack:** `docker compose -f deploy/hostinger/docker-compose.yml --env-file deploy/hostinger/.env up -d --build`

Keep `deploy/hostinger/secrets/backend.env` on the server (see above).

The default branch is **`main`**, not `master`.

## 5. After deploy

- Open `https://<WEB_FQDN>` (frontend), `https://<ADMIN_FQDN>` (admin), API at `https://<API_FQDN>`.
- If you use self-hosted Supabase: check `https://<SUPABASE_FQDN>/auth/v1/health` (via Kong).
- If you change public URLs or Supabase keys, rebuild (`npm run docker:up:hostinger` with `--build`, or rebuild the affected services) so Vite picks up build-time env.
