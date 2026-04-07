#!/usr/bin/env bash
set -euo pipefail

# Alembic migrations inside the api container (stack must already be running).

export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"

ROOT="${DEPAI_BACKEND_ROOT:-$HOME/depai-backend}"

if ! command -v docker >/dev/null 2>&1 || ! docker info >/dev/null 2>&1; then
  echo "Docker unavailable. Start colima start or Docker Desktop."
  exit 1
fi

compose_exec() {
  if docker compose version >/dev/null 2>&1; then
    docker compose exec "$@"
  else
    docker-compose exec "$@"
  fi
}

cd "$ROOT"
exec compose_exec api alembic upgrade head
