#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

cd "$ROOT_DIR"

echo "[desktop-dev] Starting Docker services (db, backend, pgadmin)..."
docker compose up --build -d db backend pgadmin

echo "[desktop-dev] Launching Tauri (this starts Next dev via beforeDevCommand)..."
cd "$ROOT_DIR/frontend"
npx tauri dev
