#!/usr/bin/env bash
# Notify: posts a message to Slack #agents channel.
# Usage: ./scripts/notify.sh "message"
# Requires: SLACK_WEBHOOK_URL env var. If unset, prints to stdout and exits 0
# (no-op so missions don't fail when the foreman hasn't configured Slack yet).

MESSAGE="${1:-}"
if [ -z "$MESSAGE" ]; then
  echo "Usage: $0 \"message\""
  exit 1
fi

if [ -z "${SLACK_WEBHOOK_URL:-}" ]; then
  echo "[notify — SLACK_WEBHOOK_URL not set, would have sent]: $MESSAGE"
  exit 0
fi

PAYLOAD=$(printf '{"text":"%s"}' "$(echo "$MESSAGE" | sed 's/"/\\"/g')")

if curl -s -X POST \
  -H 'Content-type: application/json' \
  --data "$PAYLOAD" \
  --max-time 5 \
  "$SLACK_WEBHOOK_URL" > /dev/null; then
  echo "[notify — sent]: $MESSAGE"
  exit 0
else
  echo "[notify — FAILED to send]: $MESSAGE"
  exit 0  # never block mission on notification failure
fi
