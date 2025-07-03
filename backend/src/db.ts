import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Создаем пул соединений с базой данных
// Vercel Postgres автоматически предоставит переменную окружения POSTGRES_URL
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
  // Добавляем таймауты для предотвращения зависаний
  connectionTimeoutMillis: 10000, // 10 секунд на подключение
  idleTimeoutMillis: 30000,       // 30 секунд на неактивное соединение в пуле
});

// Функция для инициализации базы данных (создания таблиц)
export const initDb = async () => {
  const client = await pool.connect();
  try {
    console.log('🐘 Connected to PostgreSQL database.');

    // Создаем расширение, если его нет (для gen_random_uuid())
    await client.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto";');

    // Создаем таблицу для анкет, если она не существует
    await client.query(`
      CREATE TABLE IF NOT EXISTS profiles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        user_name VARCHAR(255) NOT NULL,
        chat_id BIGINT,
        name VARCHAR(255),
        age INT,
        height INT,
        weight INT,
        measurements VARCHAR(255),
        about TEXT,
        notes TEXT,
        raw_text TEXT NOT NULL
      );
    `);

    // Создаем таблицу для медиафайлов, если она не существует
    await client.query(`
      CREATE TABLE IF NOT EXISTS media_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
        type VARCHAR(10) NOT NULL, -- 'image' или 'video'
        url TEXT NOT NULL -- URL из облачного хранилища (может быть длинным)
      );
    `);
    
    console.log('📖 Database tables are ready.');
  } catch (err) {
    console.error('❌ Error initializing database:', err);
    throw err;
  } finally {
    client.release();
  }
};
