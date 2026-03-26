#!/usr/bin/env sh
# أفضل مسار تحديث على VPS عند استخدام docker-compose.yml من جذر المستودع
# (منافذ 13080 / 3001 / 4002 — بدون Traefik overlay وبدون supabase/docker محلياً).
#
# على السيرفر:
#   chmod +x scripts/vps/update-dealcar.sh
#   ./scripts/vps/update-dealcar.sh
#
set -e
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

echo "[vps] repo: $ROOT"
echo "[vps] git pull --ff-only …"
git pull --ff-only

echo "[vps] docker compose up -d --build …"
docker compose up -d --build

echo "[vps] status:"
docker compose ps --format 'table {{.Name}}\t{{.Status}}\t{{.Ports}}'

echo "[vps] done."
