import OpenAI from "openai";
import dotenv from 'dotenv';

// Завантажуємо змінні середовища з .env файлу
dotenv.config();

// Створюємо екземпляр OpenAI з API ключем
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY 
});

// Функція для отримання рекомендацій літератури
export async function getLiteratureRecommendations(query: string): Promise<{
  recommendations: string[];
  explanation: string;
}> {
  try {
    // Найновіша модель OpenAI - "gpt-4o" (випущена 13 травня 2024 року)
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `Ти - літературний асистент, який допомагає порадити українську 
                    літературу. Проаналізуй запит користувача і порекомендуй книги, 
                    які можуть його зацікавити. Пріоритет - українська класична та сучасна 
                    література. Ти розумієш запити як українською, так і англійською мовами, 
                    але завжди відповідай українською мовою.
                    
                    Формат відповіді у JSON:
                    {
                      "recommendations": ["Назва книги 1 - Автор", "Назва книги 2 - Автор", ...],
                      "explanation": "Коротке пояснення чому ці книги рекомендовані"
                    }`
        },
        {
          role: "user",
          content: query
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 800
    });

    // Парсимо відповідь з JSON
    const content = response.choices[0].message.content;
    if (!content) {
      return {
        recommendations: [],
        explanation: "Не вдалося отримати відповідь від сервісу рекомендацій."
      };
    }
    
    const result = JSON.parse(content);
    
    return {
      recommendations: result.recommendations || [],
      explanation: result.explanation || "Не вдалося знайти пояснення до рекомендацій."
    };
  } catch (error) {
    console.error("Помилка при отриманні рекомендацій:", error);
    return {
      recommendations: [],
      explanation: "Виникла помилка при спробі отримати рекомендації. Будь ласка, спробуйте пізніше."
    };
  }
}

// Функція для аналізу тексту
export async function analyzeText(text: string): Promise<{
  summary: string;
  themes: string[];
  recommendation: string;
}> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `Ти - літературний аналітик. Проаналізуй наданий текст з 
                    точки зору української та світової літератури. 
                    Визнач основні теми, напрямки і рекомендуй схожі твори.
                    Ти розумієш тексти як українською, так і англійською мовами, 
                    але завжди відповідай українською мовою.
                    
                    Формат відповіді у JSON:
                    {
                      "summary": "Короткий зміст тексту",
                      "themes": ["Тема 1", "Тема 2", ...],
                      "recommendation": "Рекомендація схожих творів"
                    }`
        },
        {
          role: "user",
          content: text
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.5,
      max_tokens: 800
    });

    // Парсимо відповідь з JSON
    const content = response.choices[0].message.content;
    if (!content) {
      return {
        summary: "Не вдалося отримати відповідь від сервісу аналізу.",
        themes: [],
        recommendation: "Спробуйте пізніше або введіть інший текст."
      };
    }
    
    const result = JSON.parse(content);
    
    return {
      summary: result.summary || "Не вдалося створити резюме.",
      themes: result.themes || [],
      recommendation: result.recommendation || "Немає рекомендацій."
    };
  } catch (error) {
    console.error("Помилка при аналізі тексту:", error);
    return {
      summary: "Виникла помилка при аналізі тексту.",
      themes: [],
      recommendation: "Неможливо надати рекомендації через помилку."
    };
  }
}