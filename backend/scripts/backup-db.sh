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

STAMP="$(date +%Y%m%d-%H%M%S)"
FILE="$BACKUP_DIR/naijahandy-$STAMP.sql"

echo "Backing up database to $FILE ..."
pg_dump --no-owner --no-privileges "$DATABASE_URL" > "$FILE"
echo "Backup complete: $FILE ($(wc -c < "$FILE") bytes)"

# Prune old backups, keeping the newest $BACKUP_KEEP.
ls -1t "$BACKUP_DIR"/naijahandy-*.sql 2>/dev/null | tail -n +$((BACKUP_KEEP + 1)) | while read -r old; do
  echo "Pruning old backup: $old"
  rm -f "$old"
done

echo "Done."
