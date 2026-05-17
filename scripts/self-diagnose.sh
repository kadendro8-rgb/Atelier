#!/usr/bin/env bash
# Self-diagnose: runs the foreman diagnostic protocol and dumps state.
# Called by an agent when its own work fails a gate.
# Output is meant to be pasted back to the foreman/planner.

echo "=== Atelier Factory Self-Diagnose ==="
echo "Timestamp: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
echo ""

echo "=== Git: Current Branch ==="
git rev-parse --abbrev-ref HEAD
echo ""

echo "=== Git: Status ==="
git status --short
echo ""

echo "=== Git: Last 10 Commits ==="
git log --oneline -10
echo ""

echo "=== Git: Unpushed Commits ==="
git log @{u}..HEAD --oneline 2>/dev/null || echo "(no upstream tracking)"
echo ""

echo "=== Git: Reflog (last 20) ==="
git reflog --date=iso | head -20
echo ""

echo "=== Node: Version ==="
node --version
echo ""

echo "=== Dependencies ==="
if [ -d node_modules ]; then
  echo "node_modules: present ($(ls node_modules | wc -l) packages)"
else
  echo "node_modules: MISSING — run npm install"
fi
echo ""

echo "=== Typecheck (last 40 lines) ==="
npm run typecheck 2>&1 | tail -40
TYPECHECK_EXIT=${PIPESTATUS[0]}
echo "Typecheck exit: $TYPECHECK_EXIT"
echo ""

echo "=== Lint (last 40 lines) ==="
npm run lint 2>&1 | tail -40
LINT_EXIT=${PIPESTATUS[0]}
echo "Lint exit: $LINT_EXIT"
echo ""

echo "=== Build (last 60 lines) ==="
npm run build 2>&1 | tail -60
BUILD_EXIT=${PIPESTATUS[0]}
echo "Build exit: $BUILD_EXIT"
echo ""

echo "=== Summary ==="
echo "typecheck: $TYPECHECK_EXIT"
echo "lint: $LINT_EXIT"
echo "build: $BUILD_EXIT"
echo ""
echo "=== End diagnose ==="
