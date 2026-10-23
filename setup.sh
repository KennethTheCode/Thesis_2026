#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

cd Backend
PY=$(command -v python3.12 || command -v python3)
"$PY" -m venv .venv
.venv/bin/python -m pip install --upgrade pip
.venv/bin/python -m pip install -r requirements.txt
[ -f .env ] || { cp .env.example .env; echo ">> Edit Backend/.env: set MONGODB_URL and DB_NAME"; }
cd ../Frontend
npm ci
echo "Setup done."