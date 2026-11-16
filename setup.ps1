$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

Set-Location Backend
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install --upgrade pip
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
if (-not (Test-Path .env)) { Copy-Item .env.example .env; Write-Host ">> Edit Backend\.env: set MONGODB_URL and DB_NAME" }
Set-Location ..\Frontend
npm ci
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
Set-Location ..
Write-Host "Setup done."