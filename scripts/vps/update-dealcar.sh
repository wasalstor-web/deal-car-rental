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

ENV_FILE="$ROOT/scripts/vps/dealcar-vps.env"
ENV_OPT=""
if [ -f "$ENV_FILE" ]; then
  echo "[vps] using --env-file $ENV_FILE"
  ENV_OPT="--env-file $ENV_FILE"
fi

echo "[vps] docker compose up -d --build …"
docker compose $ENV_OPT up -d --build

echo "[vps] status:"
docker compose ps --format 'table {{.Name}}\t{{.Status}}\t{{.Ports}}'

echo "[vps] done."
