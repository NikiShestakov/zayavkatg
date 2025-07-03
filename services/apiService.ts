import { UserProfile } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

if (!API_BASE_URL) {
  throw new Error("VITE_API_BASE_URL is not defined. Please create a .env file with VITE_API_BASE_URL=http://localhost:3001/api for local development.");
}


/**
 * Получает все анкеты с бэкенда.
 */
export const getProfiles = async (): Promise<UserProfile[]> => {
  const response = await fetch(`${API_BASE_URL}/profiles`);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Не удалось получить анкеты' }));
    throw new Error(errorData.message);
  }
  return response.json();
};

/**
 * Создает новую анкету, отправляя данные формы на бэкенд.
 * Бэкенд будет обрабатывать парсинг с помощью ИИ и хранение файлов.
 */
export const createProfile = async (formData: FormData): Promise<UserProfile> => {
  const response = await fetch(`${API_BASE_URL}/profiles`, {
    method: 'POST',
    body: formData,
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Не удалось создать анкету' }));
    throw new Error(errorData.message);
  }
  return response.json();
};

/**
 * Обновляет существующую анкету.
 */
export const updateProfile = async (profileId: string, updatedData: UserProfile): Promise<UserProfile> => {
    const response = await fetch(`${API_BASE_URL}/profiles/${profileId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedData),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Не удалось обновить анкету' }));
        throw new Error(errorData.message);
    }
    return response.json();
};


/**
 * Удаляет анкету с бэкенда.
 */
export const deleteProfile = async (profileId: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/profiles/${profileId}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Не удалось удалить анкету' }));
    throw new Error(errorData.message);
  }
};
