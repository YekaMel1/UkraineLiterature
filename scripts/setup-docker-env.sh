#!/bin/bash

# Створити файл .env, якщо він ще не існує
if [ ! -f .env ]; then
  touch .env
  echo "Створено новий файл .env"
fi

# Запитати про OPENAI_API_KEY, якщо він не встановлений
if ! grep -q "OPENAI_API_KEY=" .env; then
  echo -n "Введіть ваш OPENAI_API_KEY: "
  read api_key
  echo "OPENAI_API_KEY=$api_key" >> .env
  echo "OPENAI_API_KEY додано до .env"
else
  echo "OPENAI_API_KEY вже існує в .env"
fi

# Налаштування інших змінних середовища для Docker
if ! grep -q "DATABASE_URL=" .env; then
  echo "DATABASE_URL=postgres://postgres:postgres@postgres:5432/literature" >> .env
  echo "DATABASE_URL для Docker додано до .env"
fi

if ! grep -q "POSTGRES_USER=" .env; then
  echo "POSTGRES_USER=postgres" >> .env
  echo "POSTGRES_USER додано до .env"
fi

if ! grep -q "POSTGRES_PASSWORD=" .env; then
  echo "POSTGRES_PASSWORD=postgres" >> .env
  echo "POSTGRES_PASSWORD додано до .env"
fi

if ! grep -q "POSTGRES_DB=" .env; then
  echo "POSTGRES_DB=literature" >> .env
  echo "POSTGRES_DB додано до .env"
fi

if ! grep -q "POSTGRES_HOST=" .env; then
  echo "POSTGRES_HOST=postgres" >> .env
  echo "POSTGRES_HOST додано до .env"
fi

if ! grep -q "POSTGRES_PORT=" .env; then
  echo "POSTGRES_PORT=5432" >> .env
  echo "POSTGRES_PORT додано до .env"
fi

if ! grep -q "SESSION_SECRET=" .env; then
  # Створюємо випадковий рядок для SESSION_SECRET
  session_secret=$(openssl rand -hex 32)
  echo "SESSION_SECRET=$session_secret" >> .env
  echo "SESSION_SECRET додано до .env"
fi

echo "Налаштування змінних середовища для Docker завершено!"
