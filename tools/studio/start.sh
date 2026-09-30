#!/usr/bin/env bash
# Studio-Dashboard starten (idempotent) oder stoppen: tools/studio/start.sh [stop]
set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
STUDIO_DIR="$(python3 "$DIR/paths.py")"
PORT="${STUDIO_PORT:-8765}"
URL="http://127.0.0.1:${PORT}/"
PID_FILE="$STUDIO_DIR/server.pid"
mkdir -p "$STUDIO_DIR"

running() {
  [ -f "$PID_FILE" ] && kill -0 "$(cat "$PID_FILE")" 2>/dev/null
}

if [ "${1:-}" = "stop" ]; then
  if running; then
    kill "$(cat "$PID_FILE")"
    rm -f "$PID_FILE"
    echo "Studio-Dashboard gestoppt."
  else
    rm -f "$PID_FILE"
    echo "Studio-Dashboard läuft nicht."
  fi
  exit 0
fi

if running; then
  echo "Studio-Dashboard läuft bereits: $URL"
  exit 0
fi

nohup python3 "$DIR/server.py" --port "$PORT" >"$STUDIO_DIR/server.log" 2>&1 &
echo $! >"$PID_FILE"
for _ in $(seq 1 20); do
  if python3 -c "import urllib.request; urllib.request.urlopen('${URL}api/state', timeout=1)" 2>/dev/null; then
    echo "Studio-Dashboard: $URL"
    exit 0
  fi
  sleep 0.25
done
echo "Studio-Dashboard startet nicht — siehe $STUDIO_DIR/server.log" >&2
exit 1
