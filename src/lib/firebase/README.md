# Firebase Architecture & Data Schema

Цей документ описує структуру даних у Firestore та принципи взаємодії з Firebase.

## 1. Принципи
*   **SSoT (Single Source of Truth):** Firestore є джерелом правди для профілів, рекордів та налаштувань кімнат.
*   **Offline-first:** Рекорди та нагороди спочатку зберігаються в `localStorage`, а потім синхронізуються з хмарою.
*   **Scalability:** Структура даних розроблена для підтримки нових режимів гри без зміни схеми.

## 2. Схема Бази Даних (Firestore)

### Колекція `users`
Зберігає профілі гравців та їхні найкращі результати.

```json
{
  "uid": "user_123",
  "displayName": "PlayerOne",
  "isAnonymous": false,
  "createdAt": 1700000000000,
  "lastActive": 1700000000000,
  
  // Статистика (ключ = режим_розмір)
  "stats": {
    "timed_4": 53,
    "timed_8": 12,
    "survival_classic_4": 105
  },

  // Розблоковані нагороди
  "unlockedRewards": {
    "score_11_timed": {
      "id": "score_11_timed",
      "unlockedAt": 1700000000000
    }
  }
}