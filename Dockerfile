FROM node:20-alpine

# Встановлюємо необхідні залежності та сетап системи
RUN apk add --no-cache bash netcat-openbsd

WORKDIR /app

# Копіюємо файли package.json та package-lock.json
COPY package*.json ./

# Встановлюємо залежності
RUN npm ci

# Копіюємо entrypoint скрипт окремо і встановлюємо права
COPY docker-entrypoint.sh .
RUN chmod +x docker-entrypoint.sh
# Також вказуємо завершення рядків для Linux
RUN sed -i 's/\r$//' docker-entrypoint.sh

# Копіюємо всі інші файли проекту
COPY . .

# Збираємо клієнтський застосунок
RUN npm run build

# Виставляємо порт
EXPOSE 5000

# Налаштовуємо entrypoint з використанням shell форми для додаткової надійності
ENTRYPOINT ["sh", "/app/docker-entrypoint.sh"]

# Запускаємо сервер
CMD ["npm", "run", "start"]