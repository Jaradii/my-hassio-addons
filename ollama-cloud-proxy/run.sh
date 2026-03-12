#!/usr/bin/with-contenv bash
set -euo pipefail

echo "[INFO] Starte Ollama Cloud Proxy auf 0.0.0.0:11434"
exec python3 /app.py
