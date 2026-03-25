#!/usr/bin/env sh
set -e
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"
exec npm run docker:up:hostinger -- "$@"
