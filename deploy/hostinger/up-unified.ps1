# Mirror of up-unified.sh — run from repo root on Windows (PowerShell).
# Starts the unified Hostinger stack (BookCars + Supabase + Traefik overlay).
Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
Set-Location $Root
if ($args.Count -gt 0) {
  npm run docker:up:hostinger -- @args
} else {
  npm run docker:up:hostinger
}
