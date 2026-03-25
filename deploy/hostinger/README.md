# Hostinger VPS (Docker + Traefik)

Traefik على الخادم: قواعد `Host(...)`، مدخل `websecure`، وشهادات TLS عبر `${TRAEFIK_CERT_RESOLVER:-letsencrypt}`.

---

## 1. What you edit first (ملفات التعديل المباشر)

| File | Action |
|------|--------|
| `deploy/hostinger/.env` | Copy from `.env.example`. Set `COMPOSE_PROJECT_NAME`, `WEB_FQDN`, `API_FQDN`, `ADMIN_FQDN`, `COOKIE_DOMAIN`, `MONGO_ROOT_PASSWORD`, `SUPABASE_FQDN` (host only, no `https://`), `SUPABASE_PUBLIC_URL` (`https://…` same host as Kong), `SUPABASE_ANON_KEY` (= `ANON_KEY` from Supabase env), `TRAEFIK_DOCKER_NETWORK`, `TRAEFIK_CERT_RESOLVER`. |
| `deploy/hostinger/secrets/backend.env` | Copy from `secrets/backend.env.example`. Set `BC_*` secrets; **`BC_SUPABASE_JWT_SECRET`** must equal **`JWT_SECRET`** in `supabase/docker/.env`. |
| `supabase/docker/.env` | After `npm run supabase:clone-docker` (once): set `JWT_SECRET`, keys, **`SUPABASE_PUBLIC_URL`** and **`API_EXTERNAL_URL`** to `https://<SUPABASE_FQDN>`. Run **`npm run supabase:merge-gotrue`** after URL changes (see commands below). |

Optional: `infra/supabase-bookcars-stack.fragment.env` — only if you customize the Supabase sidecar fragment merged by `supabase:merge-gotrue`.

---

## 2. Commands (بالترتيب على السيرفر)

From **repository root** after `git pull`:

```bash
cp deploy/hostinger/.env.example deploy/hostinger/.env
cp deploy/hostinger/secrets/backend.env.example deploy/hostinger/secrets/backend.env
# edit both files + supabase/docker/.env (see table above)

npm run supabase:clone-docker   # if supabase/docker is missing
export BOOKCARS_SITE_URL="https://<WEB_FQDN>"
npm run supabase:merge-gotrue

npm run docker:up:hostinger     # unified: BookCars + self-hosted Supabase + Traefik
```

Stop stack: `npm run docker:down:hostinger`.  
Shell entrypoint: `./deploy/hostinger/up-unified.sh` (same as `docker:up:hostinger`).

**BookCars only** (Supabase Cloud or external URL — no Supabase containers on VPS):

```bash
docker compose -f deploy/hostinger/docker-compose.yml --env-file deploy/hostinger/.env up -d --build
```

---

## 3. DNS

Point **four** A/AAAA records at the VPS IP:

- `WEB_FQDN`, `API_FQDN`, `ADMIN_FQDN` — same values as in `deploy/hostinger/.env`.
- **Supabase (Kong):** hostname = `SUPABASE_FQDN` (must match host inside `SUPABASE_PUBLIC_URL` / `API_EXTERNAL_URL` in `supabase/docker/.env`).

---

## 4. Compose files (مرجع تقني)

| Mode | Files (order matters for unified) |
|------|-------------------------------------|
| **Unified (recommended)** | Root `docker-compose.yml` + `supabase/docker/docker-compose.yml` + `infra/docker-compose.supabase-bookcars.override.yml` + `deploy/hostinger/docker-compose.traefik-overlay.yml` — invoked by `npm run docker:up:hostinger` with `--env-file supabase/docker/.env` and `--env-file deploy/hostinger/.env`, project `-p` = `COMPOSE_PROJECT_NAME`. |
| **BookCars only** | `deploy/hostinger/docker-compose.yml` + `deploy/hostinger/.env`. |

Requires an **external** Traefik network on the VPS (`TRAEFIK_DOCKER_NETWORK`, e.g. `traefik`). Unified stack attaches `bc-*` and `kong` to `traefik_edge`.

---

## 5. Isolation & collisions

- **`bookcars_isolated`**: `mongo`, `bc-backend`, `bc-admin`, `bc-frontend` (Mongo not published to host).
- **Unique `COMPOSE_PROJECT_NAME`**: Traefik routers are `${COMPOSE_PROJECT_NAME}-web|api|admin|kong`; avoids clashes with other stacks on the same VPS.
- **Volumes** are scoped by project name (e.g. `dealcarbk_cdn`).

If hPanel deploy uses **root** `docker-compose.yml`, use a unique directory name and optional `BOOKCARS_HOST_PORT_*` — see `ports-root-stack.env.example`.

---

## 6. After deploy

- Frontend / admin / API: `https://<WEB_FQDN>`, `https://<ADMIN_FQDN>`, `https://<API_FQDN>`.
- Self-hosted Supabase: `https://<SUPABASE_FQDN>/auth/v1/health` (via Kong).
- After changing public URLs or Supabase build-time vars: rebuild (`npm run docker:up:hostinger` with `--build` or rebuild affected services).

Default git branch: **`main`**.
