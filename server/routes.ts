import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { dbStorage } from "./index";
import { setupAuth } from "./auth";
import { z } from "zod";
import { insertUserSchema, insertBookSchema, insertTestSchema, insertUserProgressSchema, insertTestResultSchema, type InsertTestResult } from "@shared/schema";
import { getLiteratureRecommendations, analyzeText } from "./openai";

export function registerRoutes(app: Express): Server {
  // Налаштування автентифікації
  setupAuth(app);
  // API routes
  app.get("/api/books", async (req: Request, res: Response) => {
    try {
      const category = req.query.category as string | undefined;
      let books;
      
      if (category) {
        books = await storage.getBooksByCategory(category);
      } else {
        books = await storage.getBooks();
      }
      
      res.json(books);
    } catch (error) {
      console.error("Error fetching books:", error);
      res.status(500).json({ message: "Failed to fetch books" });
    }
  });

  app.get("/api/books/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const book = await storage.getBook(id);
      
      if (!book) {
        return res.status(404).json({ message: "Book not found" });
      }
      
      res.json(book);
    } catch (error) {
      console.error("Error fetching book:", error);
      res.status(500).json({ message: "Failed to fetch book" });
    }
  });

  app.get("/api/tests", async (req: Request, res: Response) => {
    try {
      const type = req.query.type as string | undefined;
      const bookId = req.query.bookId ? parseInt(req.query.bookId as string) : undefined;
      
      let tests;
      
      if (type) {
        tests = await storage.getTestsByType(type);
      } else if (bookId) {
        tests = await storage.getTestsByBookId(bookId);
      } else {
        tests = await storage.getTests();
      }
      
      res.json(tests);
    } catch (error) {
      console.error("Error fetching tests:", error);
      res.status(500).json({ message: "Failed to fetch tests" });
    }
  });

  app.get("/api/tests/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const test = await storage.getTest(id);
      
      if (!test) {
        return res.status(404).json({ message: "Test not found" });
      }
      
      res.json(test);
    } catch (error) {
      console.error("Error fetching test:", error);
      res.status(500).json({ message: "Failed to fetch test" });
    }
  });

  app.get("/api/user/progress/:userId", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      const progress = await dbStorage.getUserProgress(userId);
      console.log(`Отримано прогрес для користувача ${userId}:`, progress);
      res.json(progress);
    } catch (error) {
      console.error("Error fetching user progress:", error);
      res.status(500).json({ message: "Failed to fetch user progress" });
    }
  });

  app.post("/api/user/progress", async (req: Request, res: Response) => {
    try {
      // Преобразуємо lastReadAt в об'єкт Date, якщо він є рядком
      const data = req.body;
      if (data.lastReadAt && typeof data.lastReadAt === 'string') {
        data.lastReadAt = new Date(data.lastReadAt);
      }
      
      const validatedData = insertUserProgressSchema.parse(data);
      
      // Перевіряємо, чи існує запис для цієї книги та користувача
      const existingProgress = await dbStorage.getUserBookProgress(
        validatedData.userId,
        validatedData.bookId
      );
      
      let progress;
      
      if (existingProgress) {
        // Якщо запис існує, оновлюємо його
        console.log(`Оновлюємо існуючий запис прогресу: ${existingProgress.id} для книги ${validatedData.bookId}`);
        progress = await dbStorage.updateUserProgress(existingProgress.id, {
          progress: validatedData.progress,
          currentPage: validatedData.currentPage,
          totalPages: validatedData.totalPages,
          lastReadAt: validatedData.lastReadAt,
          completed: validatedData.completed
        });
      } else {
        // Якщо запису немає, створюємо новий
        console.log(`Створюємо новий запис прогресу для книги ${validatedData.bookId}`);
        progress = await dbStorage.createUserProgress(validatedData);
      }
      
      res.status(201).json(progress);
    } catch (error) {
      console.error("Error creating/updating user progress:", error);
      res.status(500).json({ message: "Failed to create/update user progress" });
    }
  });

  app.patch("/api/user/progress/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      // Allow updating progress fields
      const schema = z.object({
        progress: z.number().optional(),
        currentPage: z.number().optional(),
        totalPages: z.number().optional(),
        lastReadAt: z.union([z.string(), z.date()]).optional().transform(val => 
          val ? (typeof val === 'string' ? new Date(val) : val) : new Date()
        ),
        completed: z.boolean().optional()
      });
      
      // Конвертуємо lastReadAt в Date, якщо це рядок
      const data = req.body;
      if (data.lastReadAt && typeof data.lastReadAt === 'string') {
        data.lastReadAt = new Date(data.lastReadAt);
      }
      
      const validatedData = schema.parse(data);
      const updatedProgress = await dbStorage.updateUserProgress(id, validatedData);
      res.json(updatedProgress);
    } catch (error) {
      console.error("Error updating user progress:", error);
      res.status(500).json({ message: "Failed to update user progress" });
    }
  });

  app.get("/api/user/test-results/:userId", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      const results = await dbStorage.getUserTestResults(userId);
      console.log(`Отримано результати тестів для користувача ${userId}:`, results);
      res.json(results);
    } catch (error) {
      console.error("Error fetching test results:", error);
      res.status(500).json({ message: "Failed to fetch test results" });
    }
  });

  app.post("/api/user/test-results", async (req: Request, res: Response) => {
    try {
      const validatedData = insertTestResultSchema.parse(req.body);
      const result = await dbStorage.createTestResult(validatedData);
      res.status(201).json(result);
    } catch (error) {
      console.error("Error creating test result:", error);
      res.status(500).json({ message: "Failed to create test result" });
    }
  });

  // API для збереження результатів ігор (використовуємо ту ж таблицю, що й для тестів)
  app.post("/api/user/game-results", async (req: Request, res: Response) => {
    try {
      // Визначаємо схему для валідації даних гри
      const gameResultSchema = z.object({
        userId: z.number(),
        gameType: z.string(),
        score: z.number(),
        completed: z.boolean().default(true),
        metadata: z.record(z.any()).optional() // будь-які додаткові дані гри
      });

      const validatedData = gameResultSchema.parse(req.body);
      
      // Конвертуємо дані в формат, який очікує createTestResult
      const testResultData: InsertTestResult = {
        userId: validatedData.userId,
        testId: 0, // використовуємо тестId 0 для ігор
        score: validatedData.score,
        completed: validatedData.completed,
        completedAt: new Date(),
        metadata: validatedData.metadata ? JSON.stringify(validatedData.metadata) : null,
        testTitle: validatedData.gameType === 'Пазл цитат' 
          ? 'Гра: Пазл цитат' 
          : validatedData.gameType === 'guess-author-game' 
            ? 'Гра: Вгадай автора' 
            : `Гра: ${validatedData.gameType}`, // зберігаємо тип гри в полі testTitle
        maxScore: 100 // максимальний бал для ігор завжди 100
      };
      
      const result = await dbStorage.createTestResult(testResultData);
      res.status(201).json(result);
    } catch (error) {
      console.error("Error creating game result:", error);
      res.status(500).json({ message: "Failed to create game result" });
    }
  });

  // API для отримання рекомендацій літератури за допомогою OpenAI
  app.post("/api/recommendations", async (req: Request, res: Response) => {
    try {
      // Схема для запиту на рекомендації
      const recommendationSchema = z.object({
        query: z.string().min(3, "Запит повинен містити щонайменше 3 символи")
      });

      const { query } = recommendationSchema.parse(req.body);
      
      // Викликаємо OpenAI для отримання рекомендацій
      const recommendations = await getLiteratureRecommendations(query);
      
      res.json(recommendations);
    } catch (error) {
      console.error("Помилка при отриманні рекомендацій:", error);
      res.status(500).json({ 
        message: "Не вдалося отримати рекомендації",
        recommendations: [],
        explanation: "Виникла помилка на сервері при спробі отримати рекомендації. Будь ласка, спробуйте пізніше."
      });
    }
  });

  // API для аналізу тексту за допомогою OpenAI
  app.post("/api/analyze-text", async (req: Request, res: Response) => {
    try {
      // Схема для запиту на аналіз тексту
      const textAnalysisSchema = z.object({
        text: z.string().min(10, "Текст повинен містити щонайменше 10 символів")
      });

      const { text } = textAnalysisSchema.parse(req.body);
      
      // Викликаємо OpenAI для аналізу тексту
      const analysis = await analyzeText(text);
      
      res.json(analysis);
    } catch (error) {
      console.error("Помилка при аналізі тексту:", error);
      res.status(500).json({ 
        message: "Не вдалося проаналізувати текст",
        summary: "Виникла помилка при аналізі тексту.",
        themes: [],
        recommendation: "Спробуйте пізніше або введіть інший текст."
      });
    }
  });

  // Create HTTP server
  const httpServer = createServer(app);
  return httpServer;
}
