#!/usr/bin/env bash
# Pre-merge verification for the feedback-hub code repo.
# Runs lint, type check, Prisma schema validation, and a production build.
# The build needs no database (Prisma generate reads the schema only), so this
# runs unchanged in CI and locally.
set -uo pipefail
cd "$(dirname "$0")/.."
FAIL=0

note() { echo "[verify] $*"; }
step() { # $1=label  $2..=command
  local label=$1; shift
  note "$label"
  if ! "$@"; then
    echo "[verify] FAIL: $label"
    FAIL=1
  fi
}

step "1/4 lint"              npx eslint src
step "2/4 typecheck"         npx tsc --noEmit
step "3/4 prisma validate"   npx prisma validate
step "4/4 build"             npm run build

if [ "$FAIL" -eq 0 ]; then
  note "OK — all checks passed."
else
  note "FAILED — fix the findings above, then re-run."
fi
exit $FAIL
