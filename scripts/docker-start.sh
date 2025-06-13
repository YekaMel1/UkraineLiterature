#!/bin/bash

# Налаштувати змінні середовища для Docker
echo "Налаштування змінних середовища для Docker..."
./scripts/setup-docker-env.sh

# Запустити контейнери
echo "Запуск Docker контейнерів"
docker compose up -d

# Почекати, поки PostgreSQL буде готовий
echo "Очікування готовності PostgreSQL..."
sleep 5

# Застосувати міграції до бази даних
echo "Застосування міграцій до бази даних..."
docker compose exec app npm run db:push

echo "Застосунок запущено і доступний на http://localhost:5000"
