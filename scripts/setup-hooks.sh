#!/usr/bin/env bash
# Install the shared git hooks into this clone.
# Run once after cloning: bash scripts/setup-hooks.sh
set -euo pipefail
cd "$(dirname "$0")/.."

HOOK_DIR=$(git rev-parse --git-path hooks)
cp scripts/commit-msg "$HOOK_DIR/commit-msg"
chmod +x "$HOOK_DIR/commit-msg"
echo "installed commit-msg hook -> $HOOK_DIR/commit-msg"
