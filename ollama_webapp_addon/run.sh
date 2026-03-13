#!/usr/bin/with-contenv bashio
set -euo pipefail

export OLLAMA_BASE_URL="$(bashio::config 'ollama_base_url')"
export DEFAULT_MODEL="$(bashio::config 'default_model')"
export DEFAULT_KEEP_ALIVE="$(bashio::config 'keep_alive')"
export REQUEST_TIMEOUT="$(bashio::config 'request_timeout')"

echo "Starte Ollama iPhone Webapp"
echo "OLLAMA_BASE_URL=${OLLAMA_BASE_URL}"
echo "DEFAULT_MODEL=${DEFAULT_MODEL}"
echo "REQUEST_TIMEOUT=${REQUEST_TIMEOUT}"

exec /opt/venv/bin/python -m uvicorn app:app --host 0.0.0.0 --port 8099
