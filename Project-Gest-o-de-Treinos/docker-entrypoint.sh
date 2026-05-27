#!/bin/sh
set -e

MAX_RETRIES=3
RETRY_DELAY=3

log() { printf "[%s] %s\n" "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$1"; }

# Retry helper
retry_cmd() {
  local n=0
  until [ "$n" -ge "$MAX_RETRIES" ]
  do
    if "$@"; then
      return 0
    fi
    n=$((n+1))
    log "Command failed - retry $n/$MAX_RETRIES: $*"
    sleep $RETRY_DELAY
  done
  log "Command failed after $MAX_RETRIES attempts: $*"
  return 1
}

cd /app

log "Pushing DB schema"
retry_cmd npx prisma db push || exit 1

# If build exists (dist), run start, else run tsx
if [ -f ./dist/src/index.js ]; then
  log "Starting compiled app"
  exec npm start
else
  log "Starting dev app via tsx"
  exec npx tsx src/index.ts
fi
