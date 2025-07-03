
import express, { Express, Request as ExpressRequest, Response as ExpressResponse } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { initDb } from './db';
import apiRoutes from './routes';

// Загружаем переменные окружения из .env файла
dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors()); // Включаем CORS для всех запросов
app.use(express.json()); // Парсим JSON-тела запросов

// Создаем директорию для загрузок, если она не существует
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log(`✅ Created uploads directory at ${uploadsDir}`);
}

// Обслуживаем загруженные файлы статически
app.use('/uploads', express.static(uploadsDir));

// Подключаем API роуты
app.use('/api', apiRoutes);

// В продакшене отдаем статичные файлы фронтенда
if (process.env.NODE_ENV === 'production') {
  // Указываем путь к собранному фронтенду
  const frontendPath = path.join(__dirname, '..', '..', 'dist');
  app.use(express.static(frontendPath));

  // Для всех остальных запросов отдаем index.html
  app.get('*', (req: ExpressRequest, res: ExpressResponse) => {
    res.sendFile(path.resolve(frontendPath, 'index.html'));
  });
}

// Запускаем сервер
app.listen(port, async () => {
  try {
    // Инициализируем базу данных при старте
    await initDb();
    console.log(`✅ Backend server is running at http://localhost:${port}`);
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    throw error;
  }
});
