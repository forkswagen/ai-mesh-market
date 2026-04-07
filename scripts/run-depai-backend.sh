#!/usr/bin/env bash
set -euo pipefail

# Run depai-backend via Docker Compose.
# Docker options: Docker Desktop or Colima (`brew install colima docker docker-compose` → `colima start`).
# Default repo: ~/depai-backend (or DEPAI_BACKEND_ROOT).

export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"

ROOT="${DEPAI_BACKEND_ROOT:-$HOME/depai-backend}"

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker not found in PATH."
  echo "Install Colima: brew install colima docker docker-compose && colima start"
  echo "or Docker Desktop: https://www.docker.com/products/docker-desktop/"
  exit 1
fi

if docker info >/dev/null 2>&1; then
  :
else
  echo "Docker daemon unavailable. Start Colima: colima start"
  echo "or open Docker Desktop."
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
  echo "No repo at $ROOT"
  echo "Clone: git clone https://github.com/forkswagen/depai-backend.git $ROOT"
  exit 1
fi

cd "$ROOT"
if [[ ! -f .env ]]; then
  cp .env.example .env
  echo "Created .env from .env.example — edit if needed."
fi

compose_up "$@"
