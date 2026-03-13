#!/usr/bin/with-contenv bashio
set -euo pipefail

export UPSTREAM_BASE_URL="$(bashio::config 'upstream_base_url')"
export REQUEST_TIMEOUT="$(bashio::config 'request_timeout')"

echo "[INFO] Starte Ollama Cloud Proxy auf 0.0.0.0:11434"
echo "[INFO] UPSTREAM_BASE_URL=${UPSTREAM_BASE_URL}"
echo "[INFO] REQUEST_TIMEOUT=${REQUEST_TIMEOUT}"

exec /opt/venv/bin/python -m uvicorn app:app --host 0.0.0.0 --port 11434
