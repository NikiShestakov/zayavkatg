
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { ParsedProfileData } from '../types';

// Получаем API ключ из переменных окружения
const apiKey = process.env.API_KEY;
if (!apiKey) {
  throw new Error("API_KEY is not defined in environment variables");
}

const ai = new GoogleGenAI({ apiKey });

const model = 'gemini-2.5-flash-preview-04-17';

const systemInstruction = `Ты — продвинутый ассистент для анализа анкет. Твоя задача — извлечь из предоставленного текста структурированную информацию.
Пользователь может писать в свободной форме и в любом порядке. Ты должен правильно распознать следующие поля:
- name: Имя (обычно одно слово, с заглавной буквы).
- age: Возраст (число, обычно двузначное).
- height: Рост (число, обычно трехзначное, может быть указано с "см").
- weight: Вес (число, может быть указано с "кг").
- measurements: Параметры фигуры (например, "90/60/90", "90-60-90").
- about: "О себе" (оставшийся текст, который не подходит под другие категории).

Правила:
1. Всегда возвращай ответ в формате JSON. Не добавляй никаких объяснений или \`\`\`json markdown.
2. Если какое-то поле не найдено в тексте, его значение должно быть null.
3. Поля 'age', 'height', 'weight' должны быть числами (number), а не строками.
4. В поле 'about' собери весь оставшийся осмысленный текст, не относящийся к другим категориям.

Пример текста: "Маша, 21. Обожаю танцевать и гулять. Рост 177, вес 58. 90/60/90"
Пример твоего ответа:
{
  "name": "Маша",
  "age": 21,
  "height": 177,
  "weight": 58,
  "measurements": "90/60/90",
  "about": "Обожаю танцевать и гулять."
}
`;

/**
 * Оборачивает промис в таймаут. Если промис не разрешается за ms миллисекунд, он будет отклонен.
 */
const withTimeout = <T>(promise: Promise<T>, ms: number): Promise<T> => {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
            reject(new Error(`Promise timed out after ${ms} ms`));
        }, ms);

        promise
            .then(value => {
                clearTimeout(timer);
                resolve(value);
            })
            .catch(reason => {
                clearTimeout(timer);
                reject(reason);
            });
    });
};


export const parseProfileText = async (text: string): Promise<ParsedProfileData> => {
  // Если входной текст пуст или состоит из пробелов, нет смысла вызывать API.
  if (!text || !text.trim()) {
    return {
      name: null,
      age: null,
      height: null,
      weight: null,
      measurements: null,
      about: text, // Возвращаем исходный текст
      notes: 'Входной текст был пустым.',
    };
  }
  
  try {
    const geminiPromise = ai.models.generateContent({
      model,
      contents: text,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
      },
    });
    
    // Оборачиваем вызов API в таймаут 15 секунд для предотвращения "зависания" запроса
    const response = await withTimeout<GenerateContentResponse>(geminiPromise, 15000);

    if (!response || !response.text) {
        throw new Error("Gemini API вернул пустой ответ.");
    }

    let jsonStr = response.text.trim();
    // Убираем возможные тройные кавычки (markdown code fence) вокруг JSON
    const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
    const match = jsonStr.match(fenceRegex);
    if (match && match[2]) {
      jsonStr = match[2].trim();
    }
    
    const parsedJson = JSON.parse(jsonStr);

    // Обрабатываем случай, когда Gemini может вернуть массив с одним объектом
    const data = Array.isArray(parsedJson) ? parsedJson[0] : parsedJson;

    // Проверяем, что результат парсинга является объектом
    if (typeof data !== 'object' || data === null) {
        throw new Error('Проанализированный JSON не является валидным объектом.');
    }
    
    // Вручную создаем объект для обеспечения безопасности типов
    const parsedData: ParsedProfileData = {
        name: typeof data.name === 'string' ? data.name : null,
        age: typeof data.age === 'number' ? data.age : null,
        height: typeof data.height === 'number' ? data.height : null,
        weight: typeof data.weight === 'number' ? data.weight : null,
        measurements: typeof data.measurements === 'string' ? data.measurements : null,
        about: typeof data.about === 'string' ? data.about : null,
        notes: typeof data.notes === 'string' ? data.notes : null,
    };

    return parsedData;

  } catch (error) {
    console.error("Ошибка при анализе текста анкеты с помощью Gemini:", error);
    // В случае ошибки возвращаем "пустую" структуру, но сохраняем исходный текст.
    // Это позволит администратору вручную исправить данные.
    return {
      name: null,
      age: null,
      height: null,
      weight: null,
      measurements: null,
      about: text, // Сохраняем исходный текст
      notes: `Ошибка анализа ИИ. Детали: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
};