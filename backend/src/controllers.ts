
import { Request as ExpressRequest, Response as ExpressResponse } from 'express';
import fs from 'fs';
import path from 'path';
import { PoolClient } from 'pg';
import { pool } from './db';
import { parseProfileText } from './services/geminiService';
import { UserProfile, ProfileRow, MediaRow, ParsedProfileData } from './types';

/**
 * Асинхронная фоновая задача для анализа текста с помощью ИИ и обновления записи в БД.
 * Не блокирует основной поток запроса.
 * @param profileId - ID созданной анкеты.
 * @param text - Исходный текст для анализа.
 */
const processTextWithAIAndUpdateDB = async (profileId: string, text: string) => {
    // Если текст пустой, нет смысла вызывать ИИ.
    if (!text || !text.trim()) {
        console.log(`[AI Task] Skipping AI processing for profile ${profileId} due to empty text.`);
        return;
    }

    console.log(`[AI Task] Starting AI processing for profile ${profileId}`);
    try {
        // Эта функция содержит собственную обработку ошибок и таймауты
        const parsedData: ParsedProfileData = await parseProfileText(text);

        const updateQuery = `
            UPDATE profiles
            SET name = $1, age = $2, height = $3, weight = $4, measurements = $5, about = $6, notes = $7
            WHERE id = $8;
        `;
        const updateValues = [
            parsedData.name,
            parsedData.age,
            parsedData.height,
            parsedData.weight,
            parsedData.measurements,
            parsedData.about,
            parsedData.notes, // Здесь могут быть детали ошибки от ИИ
            profileId
        ];
        await pool.query(updateQuery, updateValues);

        if (parsedData.notes?.includes('Ошибка анализа ИИ')) {
            console.log(`[AI Task] AI processing failed for profile ${profileId}. Notes updated with error.`);
        } else {
            console.log(`[AI Task] Successfully updated profile ${profileId} with AI data.`);
        }
    } catch (error) {
        console.error(`[AI Task] CRITICAL error during background AI processing for profile ${profileId}:`, error);
        // Попытка записать критическую ошибку в заметки анкеты
        try {
            const errorMessage = `Критическая ошибка фоновой обработки ИИ: ${error instanceof Error ? error.message : String(error)}`;
            await pool.query(`UPDATE profiles SET notes = $1 WHERE id = $2`, [errorMessage, profileId]);
        } catch (dbError) {
            console.error(`[AI Task] FAILED to write critical error to DB for profile ${profileId}:`, dbError);
        }
    }
};


// Получить все анкеты
export const getProfiles = async (req: ExpressRequest, res: ExpressResponse) => {
  try {
    const profilesResult = await pool.query<ProfileRow>('SELECT * FROM profiles ORDER BY date DESC');
    const mediaResult = await pool.query<MediaRow>('SELECT * FROM media_items');

    const profiles: UserProfile[] = profilesResult.rows.map(p => ({
      id: p.id,
      date: p.date,
      userName: p.user_name,
      chatId: p.chat_id ?? undefined,
      name: p.name,
      age: p.age,
      height: p.height,
      weight: p.weight,
      measurements: p.measurements,
      about: p.about,
      notes: p.notes ?? undefined,
      rawText: p.raw_text,
      media: mediaResult.rows
        .filter(m => m.profile_id === p.id)
        .map(m => ({
          type: m.type,
          url: `/${m.url}` // Путь, доступный с фронтенда
        }))
    }));

    res.status(200).json(profiles);
  } catch (error) {
    console.error('Error fetching profiles:', error);
    res.status(500).json({ message: 'Ошибка на сервере при получении анкет' });
  }
};

// Создать новую анкету
export const createProfile = async (req: ExpressRequest, res: ExpressResponse) => {
  const { rawText, userName, chatId } = req.body;
  const mediaFiles = req.files as Express.Multer.File[];

  // Проверяем, есть ли хотя бы текст или медиафайлы
  if ((!rawText || !rawText.trim()) && (!mediaFiles || mediaFiles.length === 0)) {
    return res.status(400).json({ message: 'Необходимо предоставить текст анкеты или прикрепить медиафайлы.' });
  }
  
  if (!userName) {
    return res.status(400).json({ message: 'Отсутствует обязательное поле: userName' });
  }

  let client: PoolClient | undefined;
  try {
    client = await pool.connect();
    await client.query('BEGIN'); // Начало транзакции

    // 1. Мгновенно вставляем анкету с сырыми данными. Поля от ИИ будут null.
    // Поле "about" по умолчанию равно всему тексту.
    const profileInsertQuery = `
      INSERT INTO profiles (user_name, chat_id, raw_text, about)
      VALUES ($1, $2, $3, $3)
      RETURNING *;
    `;
    const profileValues = [
      userName,
      chatId ? parseInt(chatId, 10) : null,
      rawText
    ];
    const newProfileResult = await client.query<ProfileRow>(profileInsertQuery, profileValues);

    if (newProfileResult.rows.length === 0) {
        throw new Error("Не удалось создать запись в БД.");
    }
    const newProfile = newProfileResult.rows[0];

    // 2. Обработка и вставка медиафайлов
    const savedMediaItems = [];
    if (mediaFiles && mediaFiles.length > 0) {
      for (const file of mediaFiles) {
        const mediaInsertQuery = `
          INSERT INTO media_items (profile_id, type, url)
          VALUES ($1, $2, $3)
          RETURNING *;
        `;
        const mediaType = file.mimetype.startsWith('image') ? 'image' : 'video';
        const filePath = `uploads/${file.filename}`; 
        const mediaValues = [newProfile.id, mediaType, filePath];
        const newMediaResult = await client.query<MediaRow>(mediaInsertQuery, mediaValues);
        savedMediaItems.push({
            type: newMediaResult.rows[0].type,
            url: `/${newMediaResult.rows[0].url}`
        });
      }
    }

    await client.query('COMMIT'); // Фиксация транзакции

    // 3. Отправка полного объекта анкеты обратно на фронтенд НЕМЕДЛЕННО
    const finalProfile: UserProfile = {
        id: newProfile.id,
        date: newProfile.date,
        userName: newProfile.user_name,
        chatId: newProfile.chat_id ?? undefined,
        name: newProfile.name, // будет null
        age: newProfile.age, // будет null
        height: newProfile.height, // будет null
        weight: newProfile.weight, // будет null
        measurements: newProfile.measurements, // будет null
        about: newProfile.about, // будет равен rawText
        rawText: newProfile.raw_text,
        notes: newProfile.notes ?? undefined,
        media: savedMediaItems,
    };

    res.status(201).json(finalProfile);

    // 4. Запускаем обработку ИИ в фоновом режиме. НЕ ждем ее завершения.
    processTextWithAIAndUpdateDB(newProfile.id, newProfile.raw_text);

  } catch (error) {
    if (client) {
        await client.query('ROLLBACK'); // Откат транзакции в случае ошибки
    }
    console.error('Error creating profile:', error);
    res.status(500).json({ message: 'Ошибка на сервере при создании анкеты' });
  } finally {
    if (client) {
        client.release();
    }
  }
};

// Обновить анкету
export const updateProfile = async (req: ExpressRequest, res: ExpressResponse) => {
    const { id } = req.params;
    const { name, age, height, weight, measurements, about, notes } = req.body as UserProfile;

    try {
        const query = `
            UPDATE profiles
            SET name = $1, age = $2, height = $3, weight = $4, measurements = $5, about = $6, notes = $7
            WHERE id = $8
            RETURNING *;
        `;
        const values = [name, age, height, weight, measurements, about, notes, id];
        const result = await pool.query<ProfileRow>(query, values);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Анкета не найдена' });
        }
        
        const mediaResult = await pool.query<MediaRow>('SELECT * FROM media_items WHERE profile_id = $1', [id]);
        const updatedProfileData = result.rows[0];

        const finalProfile: UserProfile = {
            id: updatedProfileData.id,
            date: updatedProfileData.date,
            userName: updatedProfileData.user_name,
            chatId: updatedProfileData.chat_id ?? undefined,
            rawText: updatedProfileData.raw_text,
            name: updatedProfileData.name,
            age: updatedProfileData.age,
            height: updatedProfileData.height,
            weight: updatedProfileData.weight,
            measurements: updatedProfileData.measurements,
            about: updatedProfileData.about,
            notes: updatedProfileData.notes ?? undefined,
            media: mediaResult.rows.map(m => ({ type: m.type, url: `/${m.url}` }))
        };

        res.status(200).json(finalProfile);
    } catch (error) {
        console.error(`Error updating profile ${id}:`, error);
        res.status(500).json({ message: 'Ошибка на сервере при обновлении анкеты' });
    }
};


// Удалить анкету
export const deleteProfile = async (req: ExpressRequest, res: ExpressResponse) => {
    const { id } = req.params;
    let client: PoolClient | undefined;

    try {
        client = await pool.connect();
        await client.query('BEGIN');

        // 1. Найти медиафайлы, связанные с анкетой, перед удалением записи из БД
        const mediaResult = await client.query<{ url: string }>('SELECT url FROM media_items WHERE profile_id = $1', [id]);
        const filesToDelete = mediaResult.rows;

        // 2. Удалить анкету из базы данных.
        // ON DELETE CASCADE автоматически удалит связанные записи из media_items.
        const deleteResult = await client.query('DELETE FROM profiles WHERE id = $1', [id]);

        if (deleteResult.rowCount === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Анкета не найдена' });
        }

        await client.query('COMMIT');

        // 3. После успешной транзакции в БД, удаляем файлы из файловой системы.
        if (filesToDelete.length > 0) {
            console.log(`Deleting ${filesToDelete.length} associated files...`);
            for (const file of filesToDelete) {
                // URL имеет вид 'uploads/media-12345.jpg'
                const filePath = path.join(__dirname, '..', file.url);
                fs.unlink(filePath, (err) => {
                    if (err) {
                        // Логируем ошибку, но не прерываем запрос, так как запись в БД уже удалена.
                        console.error(`Failed to delete file: ${filePath}`, err);
                    } else {
                        console.log(`Successfully deleted file: ${filePath}`);
                    }
                });
            }
        }

        res.status(204).send(); // 204 No Content
    } catch (error) {
        if (client) {
            await client.query('ROLLBACK');
        }
        console.error(`Error deleting profile ${id}:`, error);
        res.status(500).json({ message: 'Ошибка на сервере при удалении анкеты' });
    } finally {
        if (client) {
            client.release();
        }
    }
};
