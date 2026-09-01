#!/bin/sh
# docker-entrypoint.sh — GameHost first-run bootstrap
# Initializes db.json from seed if no persistent volume data exists yet

set -e

DATA_DIR="/app/data"
DB_FILE="$DATA_DIR/db.json"
SEED_FILE="$DATA_DIR/db.seed.json"

# Ensure data directories exist (in case volume was mounted but dirs not pre-created)
mkdir -p "$DATA_DIR/volumes" "$DATA_DIR/backups"

# First-run: seed db.json from template if it does not exist
if [ ! -f "$DB_FILE" ]; then
  if [ -f "$SEED_FILE" ]; then
    cp "$SEED_FILE" "$DB_FILE"
    echo "[Entrypoint] Initialized fresh db.json from seed template."
  else
    echo "[Entrypoint] WARNING: No seed file found. Server will initialize empty database."
  fi
else
  echo "[Entrypoint] Existing db.json found — preserving live data."
fi

# Execute the main server command
exec "$@"
