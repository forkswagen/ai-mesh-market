#!/usr/bin/env bash
set -euo pipefail

# Запуск depai-backend через Docker Compose.
# Варианты Docker: Docker Desktop или Colima (`brew install colima docker docker-compose` → `colima start`).
# Репо по умолчанию: ~/depai-backend (или DEPAI_BACKEND_ROOT).

export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"

ROOT="${DEPAI_BACKEND_ROOT:-$HOME/depai-backend}"

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker не найден в PATH."
  echo "Установи Colima: brew install colima docker docker-compose && colima start"
  echo "или Docker Desktop: https://www.docker.com/products/docker-desktop/"
  exit 1
fi

if docker info >/dev/null 2>&1; then
  :
else
  echo "Docker daemon недоступен. Запусти Colima: colima start"
  echo "или открой Docker Desktop."
  exit 1
fi

compose_up() {
  if docker compose version >/dev/null 2>&1; then
    docker compose up --build "$@"
  else
    docker-compose up --build "$@"
  fi
}

if [[ ! -f "$ROOT/docker-compose.yml" ]]; then
  echo "Нет репозитория в $ROOT"
  echo "Клонируй: git clone https://github.com/forkswagen/depai-backend.git $ROOT"
  exit 1
fi

cd "$ROOT"
if [[ ! -f .env ]]; then
  cp .env.example .env
  echo "Создан .env из .env.example — при необходимости отредактируй."
fi

compose_up "$@"
