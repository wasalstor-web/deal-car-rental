#!/usr/bin/env sh
# Dump BookCars MongoDB to ./backups/mongodb-YYYYMMDD-HHMM (gzip). Run on the VPS from repo root.
# Requires: docker compose stack running, mongo service name "mongo".
#
#   chmod +x scripts/vps/mongo-backup.sh
#   ./scripts/vps/mongo-backup.sh
#
set -e
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

STAMP="$(date +%Y%m%d-%H%M)"
OUT="$ROOT/backups/mongodb-$STAMP"
mkdir -p "$OUT"

# Credentials must match docker-compose mongo service (override with env if you changed them).
MONGO_USER="${MONGO_BACKUP_USER:-admin}"
MONGO_PASS="${MONGO_BACKUP_PASS:-admin}"

echo "[backup] dumping to $OUT …"
docker compose exec -T mongo mongodump \
  --username="$MONGO_USER" \
  --password="$MONGO_PASS" \
  --authenticationDatabase=admin \
  --db=bookcars \
  --archive --gzip > "$OUT/bookcars.archive.gz"

echo "[backup] size:"
ls -lh "$OUT/bookcars.archive.gz"
echo "[backup] done."
