import { 
  users, type User, type InsertUser,
  userProgress, type UserProgress, type InsertUserProgress,
  testResults, type TestResult, type InsertTestResult
} from "@shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";
import { MemStorage } from "./storage";
import pg from "pg";
import connectPg from "connect-pg-simple";
import dotenv from 'dotenv';

// Завантажуємо змінні середовища
dotenv.config();

const { Pool } = pg;
import session from "express-session";

// Функція для створення пулу підключень до бази даних
function createSessionPool() {
  // Якщо встановлено змінну DATABASE_URL, використовуємо її
  if (process.env.DATABASE_URL) {
    console.log("Створення сховища сесій через DATABASE_URL");
    return new Pool({
      connectionString: process.env.DATABASE_URL,
    });
  }

  // Інакше, використовуємо окремі параметри підключення
  console.log("Створення сховища сесій через параметри");
  return new Pool({
    user: process.env.POSTGRES_USER || 'postgres',
    password: process.env.POSTGRES_PASSWORD || 'postgres',
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5432'),
    database: process.env.POSTGRES_DB || 'literature',
  });
}

// Розширюємо клас MemStorage для зберігання даних користувачів в базі даних
export class DatabaseStorage extends MemStorage {
  public sessionStore: session.Store;

  constructor() {
    super();

    // Створюємо сховище сесій для PostgreSQL
    const PostgresSessionStore = connectPg(session);
    const sessionPool = createSessionPool();
    
    this.sessionStore = new PostgresSessionStore({
      pool: sessionPool,
      tableName: 'user_sessions',
      createTableIfMissing: true
    });
    
    console.log('Ініціалізовано сховище сесій PostgreSQL');
  }

  // Перевизначаємо методи для роботи з користувачами

  // Отримання користувача за ID
  async getUser(id: number): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.id, id));
      return user;
    } catch (error) {
      console.error("Error getting user by ID:", error);
      return undefined;
    }
  }

  // Отримання користувача за ім'ям
  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.username, username));
      return user;
    } catch (error) {
      console.error("Error getting user by username:", error);
      return undefined;
    }
  }

  // Отримання користувача за електронною поштою
  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.email, email));
      return user;
    } catch (error) {
      console.error("Error getting user by email:", error);
      return undefined;
    }
  }

  // Створення нового користувача
  async createUser(userData: InsertUser): Promise<User> {
    try {
      const [user] = await db.insert(users).values(userData).returning();
      return user;
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  }

  // Отримання прогресу користувача
  async getUserProgress(userId: number): Promise<UserProgress[]> {
    try {
      return await db.select().from(userProgress).where(eq(userProgress.userId, userId));
    } catch (error) {
      console.error("Error getting user progress:", error);
      return [];
    }
  }

  // Отримання прогресу читання конкретної книги
  async getUserBookProgress(userId: number, bookId: number): Promise<UserProgress | undefined> {
    try {
      const [progress] = await db.select().from(userProgress).where(
        and(
          eq(userProgress.userId, userId),
          eq(userProgress.bookId, bookId)
        )
      );
      return progress;
    } catch (error) {
      console.error("Error getting user book progress:", error);
      return undefined;
    }
  }

  // Створення запису про прогрес
  async createUserProgress(progress: InsertUserProgress): Promise<UserProgress> {
    try {
      const [newProgress] = await db.insert(userProgress).values(progress).returning();
      return newProgress;
    } catch (error) {
      console.error("Error creating user progress:", error);
      throw error;
    }
  }

  // Оновлення запису про прогрес
  async updateUserProgress(id: number, progress: Partial<UserProgress>): Promise<UserProgress> {
    try {
      const [updatedProgress] = await db
        .update(userProgress)
        .set(progress)
        .where(eq(userProgress.id, id))
        .returning();
      
      if (!updatedProgress) {
        throw new Error(`User progress with id ${id} not found`);
      }
      
      return updatedProgress;
    } catch (error) {
      console.error("Error updating user progress:", error);
      throw error;
    }
  }

  // Отримання результатів тестів користувача
  async getUserTestResults(userId: number): Promise<TestResult[]> {
    try {
      return await db.select().from(testResults).where(eq(testResults.userId, userId));
    } catch (error) {
      console.error("Error getting user test results:", error);
      return [];
    }
  }

  // Отримання результату конкретного тесту
  async getTestResult(userId: number, testId: number): Promise<TestResult | undefined> {
    try {
      const [result] = await db.select().from(testResults).where(
        and(
          eq(testResults.userId, userId),
          eq(testResults.testId, testId)
        )
      );
      return result;
    } catch (error) {
      console.error("Error getting test result:", error);
      return undefined;
    }
  }

  // Створення запису про результат тесту
  async createTestResult(result: InsertTestResult): Promise<TestResult> {
    try {
      const [newResult] = await db.insert(testResults).values(result).returning();
      return newResult;
    } catch (error) {
      console.error("Error creating test result:", error);
      throw error;
    }
  }

  // Оновлення запису про результат тесту
  async updateTestResult(id: number, result: Partial<TestResult>): Promise<TestResult> {
    try {
      const [updatedResult] = await db
        .update(testResults)
        .set(result)
        .where(eq(testResults.id, id))
        .returning();
      
      if (!updatedResult) {
        throw new Error(`Test result with id ${id} not found`);
      }
      
      return updatedResult;
    } catch (error) {
      console.error("Error updating test result:", error);
      throw error;
    }
  }
}