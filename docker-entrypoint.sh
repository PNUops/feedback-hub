#!/bin/sh
set -e

echo "[entrypoint] applying migrations..."
npx prisma migrate deploy

echo "[entrypoint] seeding (idempotent)..."
npx prisma db seed || echo "[entrypoint] seed skipped/failed (non-fatal)"

echo "[entrypoint] starting Next.js on :3000"
exec npm run start -- -p 3000 -H 0.0.0.0
