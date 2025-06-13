#!/bin/bash

# Це скрипт для побудови Docker контейнерів

# Побудова Docker образу
docker build -t literature-app .

# Запуск Docker Compose
docker compose up -d