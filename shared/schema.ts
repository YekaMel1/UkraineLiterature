import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  name: true,
});

// Books/Literature
export const authors = pgTable("authors", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
});

export const books = pgTable("books", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  authorId: integer("author_id").notNull(),
  description: text("description"),
  category: text("category"), // "zno", "modern", "classic", etc.
  coverType: text("cover_type"), // Describes the type of cover for UI display
  coverColor: text("cover_color"), // For UI display
  coverIcon: text("cover_icon"), // For icon-based covers
  year: integer("year"), // Publication year
  genre: text("genre"), // Literary genre
  fullText: text("full_text"), // Full text of the book
  summary: text("summary"), // Brief summary of the book
  characters: text("characters"), // Main characters
  themes: text("themes"), // Main themes of the book
  quotes: text("quotes").array(), // Notable quotes from the book
});

// Tests
export const tests = pgTable("tests", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  bookId: integer("book_id"),
  questionCount: integer("question_count").notNull(),
  difficulty: text("difficulty").notNull(), // "easy", "medium", "hard"
  testType: text("test_type").notNull(), // "book", "quote", "character"
  specialIcon: text("special_icon"), // For special tests
  questions: text("questions"), // Description of questions
  time: integer("time"), // Estimated time in minutes
});

// User Progress
export const userProgress = pgTable("user_progress", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  bookId: integer("book_id").notNull(),
  progress: integer("progress").notNull().default(0), // percentage
  currentPage: integer("current_page").notNull().default(0),
  totalPages: integer("total_pages").notNull().default(0),
  lastReadAt: timestamp("last_read_at").defaultNow(),
  completed: boolean("completed").notNull().default(false),
});

// Test Results
export const testResults = pgTable("test_results", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  testId: integer("test_id").notNull(),
  score: integer("score").notNull(),
  completed: boolean("completed").notNull().default(false),
  completedAt: timestamp("completed_at"),
  metadata: text("metadata"), // Додаткова інформація у форматі JSON
  testTitle: text("test_title"), // Назва тесту або гри
  maxScore: integer("max_score"), // Максимальний бал для тесту
});

// Schema for data operations
export const insertAuthorSchema = createInsertSchema(authors);
export const insertBookSchema = createInsertSchema(books);
export const insertTestSchema = createInsertSchema(tests);
export const insertUserProgressSchema = createInsertSchema(userProgress).omit({
  lastReadAt: true
}).extend({
  lastReadAt: z.string().or(z.date()).optional().transform(val => 
    val ? (typeof val === 'string' ? new Date(val) : val) : new Date()
  )
});
export const insertTestResultSchema = createInsertSchema(testResults).extend({
  completedAt: z.string().or(z.date()).optional().transform(val => 
    val ? (typeof val === 'string' ? new Date(val) : val) : undefined
  )
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertAuthor = z.infer<typeof insertAuthorSchema>;
export type Author = typeof authors.$inferSelect;

export type InsertBook = z.infer<typeof insertBookSchema>;
export type Book = typeof books.$inferSelect;

export type InsertTest = z.infer<typeof insertTestSchema>;
export type Test = typeof tests.$inferSelect;

export type InsertUserProgress = z.infer<typeof insertUserProgressSchema>;
export type UserProgress = typeof userProgress.$inferSelect;

export type InsertTestResult = z.infer<typeof insertTestResultSchema>;
export type TestResult = typeof testResults.$inferSelect;

// Extended types for frontend use
export type BookWithAuthor = Book & {
  author: Author;
};

export type TestWithBook = Test & {
  book?: BookWithAuthor;
};
