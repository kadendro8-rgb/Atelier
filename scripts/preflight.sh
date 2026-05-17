#!/usr/bin/env bash
# Pre-flight check: verifies tree is in a state where new agent work is safe.
# Exit 0 = safe to proceed. Exit non-zero = abort mission.
set -e

echo "=== Atelier Factory Pre-flight ==="

BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$BRANCH" != "main" ]; then
  echo "❌ Not on main (currently on: $BRANCH)"
  echo "   Fix: git checkout main"
  exit 1
fi
echo "✅ On main"

if [ -n "$(git status --porcelain)" ]; then
  echo "❌ Working tree is dirty:"
  git status --short
  echo "   Fix: commit or stash before dispatching new work"
  exit 1
fi
echo "✅ Working tree clean"

git fetch origin main --quiet
LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse origin/main)
if [ "$LOCAL" != "$REMOTE" ]; then
  echo "❌ Local main not in sync with origin/main"
  echo "   Local:  $LOCAL"
  echo "   Remote: $REMOTE"
  echo "   Fix: git pull origin main  (or push if you have unpushed commits)"
  exit 1
fi
echo "✅ Local main in sync with origin"

echo "Running typecheck..."
if ! npm run typecheck > /tmp/preflight-typecheck.log 2>&1; then
  echo "❌ Typecheck failed on main. See /tmp/preflight-typecheck.log"
  tail -30 /tmp/preflight-typecheck.log
  exit 1
fi
echo "✅ Typecheck clean"

echo "Running lint..."
if ! npm run lint > /tmp/preflight-lint.log 2>&1; then
  echo "❌ Lint failed on main. See /tmp/preflight-lint.log"
  tail -30 /tmp/preflight-lint.log
  exit 1
fi
echo "✅ Lint clean"

echo "Running build..."
if ! npm run build > /tmp/preflight-build.log 2>&1; then
  echo "❌ Build failed on main. See /tmp/preflight-build.log"
  tail -50 /tmp/preflight-build.log
  exit 1
fi
echo "✅ Build clean"

echo ""
echo "=== ✅ Pre-flight passed. Safe to dispatch. ==="
exit 0
