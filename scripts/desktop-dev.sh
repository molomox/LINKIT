#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

cd "$ROOT_DIR"

echo "[desktop-dev] Starting Docker services (db, backend, pgadmin)..."
docker compose up --build -d db backend pgadmin

cd "$ROOT_DIR/frontend"
echo "[desktop-dev] Launching Tauri (this starts Next dev via beforeDevCommand)..."

BACKEND_PORT_VALUE="${BACKEND_PORT:-3000}"
LOCAL_API_URL="http://localhost:${BACKEND_PORT_VALUE}"
LOCAL_WS_URL="ws://localhost:${BACKEND_PORT_VALUE}"
LOCAL_FRONTEND_URL="http://localhost:3001"

echo "[desktop-dev] Forcing local API for dev: ${LOCAL_API_URL}"
NEXT_PUBLIC_API_URL="${LOCAL_API_URL}" \
NEXT_PUBLIC_WS_URL="${LOCAL_WS_URL}" \
NEXT_PUBLIC_FRONTEND_URL="${LOCAL_FRONTEND_URL}" \
npx tauri dev
