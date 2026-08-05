#!/usr/bin/env bash
# =============================================================================
# NaijaHandy — Database Snapshot / Backup (pre-RLS-change rollback point)
# -----------------------------------------------------------------------------
# Creates a logical dump of the current database so the RLS remediation can be
# safely reverted. Run this BEFORE applying rls-migration.sql
#
# Usage:
#   DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/naijahandy?sslmode=require" \
#     bash backend/supabase/backup-db.sh [--method auto|pgdump|supabase]
#
# Method selection:
#   auto      (default) use pg_dump if available, otherwise fall back to the
#             Supabase CLI (supabase db dump)
#   pgdump    force pg_dump (requires Postgres client tools)
#   supabase  force the Supabase CLI (npm i -g supabase; supabase login)
#
# NOTE: For pg_dump, use the DIRECT connection string (port 5432), not the
# connection pooler (port 6543) — pg_dump needs a direct session.
# =============================================================================
set -euo pipefail

# Parse optional --method flag (also accepts a bare auto|pgdump|supabase arg)
METHOD="auto"
if [ "${1:-}" = "--method" ]; then
  METHOD="${2:-auto}"
elif [ -n "${1:-}" ]; then
  METHOD="$1"
fi

if [ -z "${DATABASE_URL:-}" ]; then
  echo "ERROR: DATABASE_URL is not set." >&2
  echo "  Get it from: Supabase Dashboard -> Project Settings -> Database -> Connection string (URI)." >&2
  echo "  Example:" >&2
  echo "  DATABASE_URL=\"postgresql://postgres:PASSWORD@db.PROJECT_REF.supabase.co:5432/postgres\" bash $0" >&2
  exit 1
fi

STAMP=$(date +%Y%m%d_%H%M%S)
OUT_DIR="backend/supabase/backups"
mkdir -p "$OUT_DIR"
PREFIX="${OUT_DIR}/naijahandy_pre_rls_${STAMP}"

echo "Creating snapshot into: $OUT_DIR"
echo ""

# -----------------------------------------------------------------------------
# Decide which tool to use
# -----------------------------------------------------------------------------
use_pg_dump=false
use_supabase=false

case "$METHOD" in
  pgdump)
    use_pg_dump=true
    ;;
  supabase)
    use_supabase=true
    ;;
  auto)
    if command -v pg_dump >/dev/null 2>&1; then
      use_pg_dump=true
      echo "[method] pg_dump found on PATH."
    elif command -v supabase >/dev/null 2>&1; then
      use_supabase=true
      echo "[method] pg_dump not found, falling back to Supabase CLI."
    else
      echo "ERROR: Neither pg_dump nor the Supabase CLI was found." >&2
      echo "  Install one of:" >&2
      echo "    * Postgres client tools (pg_dump), or" >&2
      echo "    * Supabase CLI:  npm install -g supabase && supabase login" >&2
      exit 1
    fi
    ;;
  *)
    echo "ERROR: Unknown method '$METHOD' (expected: auto | pgdump | supabase)" >&2
    exit 1
    ;;
esac

# -----------------------------------------------------------------------------
# Backup using pg_dump
# -----------------------------------------------------------------------------
if $use_pg_dump; then
  echo "[backup] Running pg_dump (custom-format full dump)..."
  pg_dump --format=custom --no-owner --no-privileges \
    --dbname="$DATABASE_URL" --file="${PREFIX}.dump"

  echo "[backup] Running pg_dump (data-only SQL)..."
  pg_dump --format=plain --no-owner --no-privileges --data-only \
    --dbname="$DATABASE_URL" --file="${PREFIX}.sql"

  echo ""
  echo "Snapshot created:"
  echo "  ${PREFIX}.dump  (restore with: pg_restore --dbname=\"\$DATABASE_URL\" \"${PREFIX}.dump\")"
  echo "  ${PREFIX}.sql   (restore with: psql \"\$DATABASE_URL\" -f \"${PREFIX}.sql\")"
  exit 0
fi

# -----------------------------------------------------------------------------
# Backup using the Supabase CLI
# -----------------------------------------------------------------------------
if $use_supabase; then
  echo "[backup] Running: supabase db dump (roles + schema + data)..."

  supabase db dump --db-url "$DATABASE_URL" -f "${PREFIX}_roles.sql" --role-only
  supabase db dump --db-url "$DATABASE_URL" -f "${PREFIX}_schema.sql"
  supabase db dump --db-url "$DATABASE_URL" -f "${PREFIX}_data.sql" --use-copy --data-only

  echo ""
  echo "Snapshot created:"
  echo "  ${PREFIX}_roles.sql   (restore with: psql \"\$DATABASE_URL\" -f ...)"
  echo "  ${PREFIX}_schema.sql  (restore with: psql \"\$DATABASE_URL\" -f ...)"
  echo "  ${PREFIX}_data.sql    (restore with: psql \"\$DATABASE_URL\" -f ...)"
  echo ""
  echo "To restore all three in order:"
  echo "  psql --single-transaction --variable ON_ERROR_STOP=1 --dbname=\"\$DATABASE_URL\" \\"
  echo "    --file \"${PREFIX}_roles.sql\" --file \"${PREFIX}_schema.sql\" \\"
  echo "    --command 'SET session_replication_role = replica' --file \"${PREFIX}_data.sql\""
  exit 0
fi
