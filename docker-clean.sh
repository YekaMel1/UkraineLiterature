#!/bin/bash

# Остановить и удалить все контейнеры
docker compose down -v --remove-orphans 2>/dev/null || true
docker rm -f $(docker ps -aq) 2>/dev/null || true

# Удалить все неиспользуемые volumes (волюмы)
docker volume rm -f $(docker volume ls -q) 2>/dev/null || true
docker volume prune -f 2>/dev/null || true

# Удалить все неиспользуемые сети (networks)
docker network rm $(docker network ls -q) 2>/dev/null || true
docker network prune -f 2>/dev/null || true

# Удалить неиспользуемые образы (images)
docker image prune -a -f 2>/dev/null || true

echo "✅"