#!/usr/bin/env bash
set -euo pipefail

# Миграции Alembic внутри контейнера api (стек уже должен быть запущен).

export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"

ROOT="${DEPAI_BACKEND_ROOT:-$HOME/depai-backend}"

if ! command -v docker >/dev/null 2>&1 || ! docker info >/dev/null 2>&1; then
  echo "Docker недоступен. Запусти colima start или Docker Desktop."
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
