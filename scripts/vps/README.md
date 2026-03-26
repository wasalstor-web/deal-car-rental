# VPS helpers (root `docker-compose.yml`)

## Update stack after `git pull`

```bash
chmod +x scripts/vps/update-dealcar.sh
./scripts/vps/update-dealcar.sh
```

If `scripts/vps/dealcar-vps.env` exists, it is passed to Compose as `--env-file` (see `dealcar-vps.env.example`).

## Lock Mongo & mongo-express to localhost

On a public VPS, copy the example and redeploy:

```bash
cp scripts/vps/dealcar-vps.env.example scripts/vps/dealcar-vps.env
./scripts/vps/update-dealcar.sh
```

After this, only processes on the server can reach host ports **27018** and **8084**; **13080**, **3001**, and **4002** stay public (until you put a reverse proxy / firewall in front).

If **mongo-express** was already running with the old bind address, recreate it once:

```bash
docker compose --env-file scripts/vps/dealcar-vps.env up -d --force-recreate mongo-express
```

## Mongo backup

```bash
chmod +x scripts/vps/mongo-backup.sh
./scripts/vps/mongo-backup.sh
```

Creates `backups/mongodb-<timestamp>/bookcars.archive.gz`. Add a cron job if you want daily dumps (and copy archives off-server).

## Optional: Hostinger Traefik + Supabase

See [deploy/hostinger/README.md](../../deploy/hostinger/README.md) — requires DNS, Node on the server (or running merge scripts locally), and extra `.env` files.
