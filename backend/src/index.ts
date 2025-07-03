import express, { Express } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDb } from './db';
import apiRoutes from './routes';

// Загружаем переменные окружения из .env файла
dotenv.config();

const app: Express = express();

// Инициализируем БД при "холодном старте" серверной функции.
// Это гарантирует, что таблицы будут созданы.
initDb().catch(err => {
    console.error("Failed to initialize database on cold start:", err);
    // В серверной среде мы не можем остановить процесс, но логируем критическую ошибку.
});

// Middleware
app.use(cors()); // Включаем CORS для всех запросов
app.use(express.json()); // Парсим JSON-тела запросов

// Подключаем API роуты. Все они будут доступны по пути /api/....
app.use('/api', apiRoutes);

// Экспортируем приложение `app` для Vercel.
// Vercel подхватит этот экспорт и создаст из него серверную функцию.
export default app;
