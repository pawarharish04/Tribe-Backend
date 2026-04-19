#!/bin/sh
# scripts/entrypoint.sh
#
# Container entrypoint for the Next.js standalone runner.
# Runs as the last CMD in the Dockerfile runner stage.
#
# Responsibilities:
#   1. Run pending Prisma migrations against the live DATABASE_URL.
#      Uses `migrate deploy` (not `migrate dev`) — safe for production:
#        - Never creates new migration files
#        - Never resets the database
#        - Idempotent: already-applied migrations are skipped
#   2. Start the Next.js standalone server.
#
# The script intentionally uses `set -e` so that a migration failure
# aborts startup immediately rather than launching a broken server.

set -e

echo "[entrypoint] Running prisma migrate deploy..."
npx prisma migrate deploy

echo "[entrypoint] Starting Next.js server..."
exec node server.js
