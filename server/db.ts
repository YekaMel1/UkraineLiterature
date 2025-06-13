import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";
import dotenv from 'dotenv';

// Завантажуємо змінні середовища
dotenv.config();

const { Pool } = pg;

// Функція для створення пулу підключень до бази даних
function createDbPool() {
  // Якщо встановлено змінну DATABASE_URL, використовуємо її
  if (process.env.DATABASE_URL) {
    console.log("Підключення до бази даних через DATABASE_URL");
    return new Pool({
      connectionString: process.env.DATABASE_URL,
    });
  }

  // Інакше, використовуємо окремі параметри підключення
  console.log("Підключення до бази даних через параметри");
  return new Pool({
    user: process.env.POSTGRES_USER || 'postgres',
    password: process.env.POSTGRES_PASSWORD || 'postgres',
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5432'),
    database: process.env.POSTGRES_DB || 'literature',
  });
}

// Створюємо пул підключень
const pool = createDbPool();

// Перевіряємо підключення до бази даних при запуску
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Помилка підключення до бази даних:', err);
  } else {
    console.log('Успішне підключення до бази даних PostgreSQL');
  }
});

export const db = drizzle(pool, { schema });