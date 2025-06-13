#!/bin/sh
set -e

# Чекаємо, поки база даних буде доступна
echo "Waiting for PostgreSQL to start..."
until nc -z db 5432; do
  echo "PostgreSQL is unavailable - sleeping"
  sleep 1
done
echo "PostgreSQL is up - executing command"

# Запускаємо міграції бази даних
echo "Running database migrations..."
npm run db:push

# Запускаємо додаток
echo "Starting application..."
exec "$@"