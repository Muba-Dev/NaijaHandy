#!/usr/bin/env bash
#
# NaijaHandy PostgreSQL backup script.
#
# Creates a timestamped pg_dump of the database referenced by DATABASE_URL and
# keeps the newest BACKUP_KEEP (default 14) dumps, deleting the rest.
#
# Usage:
#   DATABASE_URL="postgresql://user:pass@host:5432/naijahandy?sslmode=require" \
#   BACKUP_DIR="./backups" \
#   ./scripts/backup-db.sh
#
# For scheduled backups (server-side, e.g. on the host running the API):
#   crontab -e
#   0 2 * * * cd /srv/naijahandy && DATABASE_URL="..." ./backend/scripts/backup-db.sh
#
set -euo pipefail

: "${DATABASE_URL:?DATABASE_URL is required (postgresql://...)}"
BACKUP_DIR="${BACKUP_DIR:-./backups}"
BACKUP_KEEP="${BACKUP_KEEP:-14}"

mkdir -p "$BACKUP_DIR"

# Prefer a versioned pg_dump binary (e.g. /usr/lib/postgresql/18/bin/pg_dump)
# over whatever is on PATH, so the newest available client is used.
PGDUMP="$(command -v pg_dump || true)"
for v in 18 17 16 15; do
  if [ -x "/usr/lib/postgresql/$v/bin/pg_dump" ]; then
    PGDUMP="/usr/lib/postgresql/$v/bin/pg_dump"
    break
  fi
done
if [ -z "$PGDUMP" ]; then
  echo "Error: pg_dump not found. Install the PostgreSQL client (e.g. postgresql-client-18)." >&2
  exit 1
fi

# pg_dump refuses to dump a server newer than itself, so fail early with a clear
# message instead of the cryptic "server version mismatch" error.
SERVER_MAJOR=""
if command -v psql >/dev/null 2>&1; then
  SERVER_MAJOR="$(psql -d "$DATABASE_URL" -tAc 'SHOW server_version_num' | cut -c1-2)"
fi
PGDUMP_MAJOR="$("$PGDUMP" --version | sed -E 's/^pg_dump \(PostgreSQL\) ([0-9]+)\..*/\1/')"
if [ -n "$SERVER_MAJOR" ] && [ -n "$PGDUMP_MAJOR" ] && [ "$SERVER_MAJOR" -gt "$PGDUMP_MAJOR" ]; then
  echo "Error: pg_dump $PGDUMP_MAJOR is older than the server (PostgreSQL $SERVER_MAJOR)." >&2
  echo "  Install a matching client (e.g. sudo apt-get install postgresql-client-$SERVER_MAJOR)." >&2
  exit 1
fi

STAMP="$(date +%Y%m%d-%H%M%S)"
FILE="$BACKUP_DIR/naijahandy-$STAMP.sql"

echo "Backing up database to $FILE ..."
"$PGDUMP" --no-owner --no-privileges "$DATABASE_URL" > "$FILE"
echo "Backup complete: $FILE ($(wc -c < "$FILE") bytes)"

# Prune old backups, keeping the newest $BACKUP_KEEP.
ls -1t "$BACKUP_DIR"/naijahandy-*.sql 2>/dev/null | tail -n +$((BACKUP_KEEP + 1)) | while read -r old; do
  echo "Pruning old backup: $old"
  rm -f "$old"
done

echo "Done."
