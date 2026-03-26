#!/usr/bin/env sh
# Run on the Hostinger VPS (Linux) from repo root after SSH — not on Windows.
# Pulls latest code, re-merges GoTrue templates if WEB_FQDN is set, rebuilds & restarts the unified stack.
set -e
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

if [ ! -f deploy/hostinger/.env ]; then
  echo "[hostinger] missing deploy/hostinger/.env — copy from .env.example first"
  exit 1
fi

echo "[hostinger] git pull …"
git pull --ff-only

WEB_FQDN=$(grep -E '^[[:space:]]*WEB_FQDN=' deploy/hostinger/.env | head -1 | cut -d= -f2- | tr -d '"' | tr -d "'" | tr -d '\r')
if [ -z "$WEB_FQDN" ]; then
  echo "[hostinger] WEB_FQDN empty in deploy/hostinger/.env — set it, then re-run"
  exit 1
fi

export BOOKCARS_SITE_URL="https://${WEB_FQDN}"
echo "[hostinger] BOOKCARS_SITE_URL=${BOOKCARS_SITE_URL}"

echo "[hostinger] supabase:merge-gotrue …"
npm run supabase:merge-gotrue

echo "[hostinger] docker:up:hostinger (build + up) …"
npm run docker:up:hostinger

echo "[hostinger] done. Check: npm run docker:ps:hostinger"
