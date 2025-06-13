import express, { Express, Request, Response, NextFunction } from "express";
import { createServer } from "http";
import { log, setupVite, serveStatic } from "./vite";
import { registerRoutes } from './routes';
import { setupAuth } from './auth';
import { DatabaseStorage } from './database-storage';
import path from 'path';

// For storage
import { storage } from './storage';

const app: Express = express();

// Replace MemStorage with DatabaseStorage for user data
export const dbStorage = new DatabaseStorage();

// JSON request parsing middleware
app.use(express.json());

// Register API routes and get HTTP server
const httpServer = registerRoutes(app);

// Other global error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  log(`Error: ${err.message}`, 'express');
  console.error(err.stack);
  
  if (res.headersSent) {
    return;
  }
  
  res.status(500).json({
    message: "Помилка на сервері",
    error: process.env.NODE_ENV === 'production' ? undefined : err.message,
  });
});

const port = process.env.PORT || 5000;

// Handle static files and Vite
if (process.env.NODE_ENV === 'production') {
  serveStatic(app);
} else {
  setupVite(app, httpServer);
}

httpServer.listen(port, () => {
  log(`serving on port ${port}`, 'express');
});