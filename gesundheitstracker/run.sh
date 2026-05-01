#!/usr/bin/env bash
set -e

mkdir -p /data

export KINDGESUND_CONFIG="/data/options.json"
export KINDGESUND_DATA="/data/diary.json"

echo "[INFO] Starte KindGesund auf 0.0.0.0:8099"
exec uvicorn main:app --host 0.0.0.0 --port 8099 --proxy-headers --forwarded-allow-ips="*"
