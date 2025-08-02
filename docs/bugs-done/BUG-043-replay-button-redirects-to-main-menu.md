# BUG-043: Кнопка "Переглянути запис" перенаправляє на головне меню замість сторінки перегляду гри

## Опис проблеми

Кнопка "Переглянути запис" перенаправляла користувача на головне меню замість сторінки перегляду гри (`/replay`).

## Причина

Сторінка `/replay` очікує дані про гру (історію ходів та розмір дошки) у `sessionStorage` під ключем `'replayData'`. Функція `startReplay` в `gameOrchestrator.ts` не зберігала ці дані перед переходом на сторінку перегляду.

## Виправлення

### Зміни в `src/lib/gameOrchestrator.ts`

Оновлено функцію `startReplay()` для збереження даних гри в `sessionStorage` перед переходом:

```typescript
async startReplay(): Promise<void> {
  const state = get(gameState);
  
  if (state.moveHistory && state.moveHistory.length > 0) {
    // 1. Створюємо об'єкт з даними для перегляду
    const replayData = {
      moveHistory: state.moveHistory,
      boardSize: state.boardSize
    };

    // 2. Зберігаємо дані в sessionStorage
    try {
      sessionStorage.setItem('replayData', JSON.stringify(replayData));
      // 3. Переходимо на сторінку перегляду
      await goto(`${base}/replay`);
    } catch (error) {
      console.error("Failed to save replay data or navigate:", error);
    }
  } else {
    console.warn("startReplay called with no move history.");
  }
},
```

### Ключові зміни:

1. **Збереження даних**: Функція тепер створює об'єкт `replayData` з історією ходів та розміром дошки
2. **SessionStorage**: Дані зберігаються в `sessionStorage` під ключем `'replayData'`
3. **Обробка помилок**: Додано try-catch блок для обробки помилок при збереженні або навігації
4. **Валідація**: Перевірка наявності історії ходів перед збереженням

## Тестування

Створено тест `src/tests/replay-functionality.test.js` для перевірки:

- ✅ Збереження даних в sessionStorage
- ✅ Перехід на сторінку /replay
- ✅ Обробка випадку без історії ходів
- ✅ Обробка помилок при збереженні

## Результат

Тепер кнопка "Переглянути запис" правильно:
1. Зберігає дані гри в sessionStorage
2. Перенаправляє на сторінку `/replay`
3. Сторінка перегляду отримує необхідні дані та відображає запис гри

## Дата виправлення

2025-01-27

## Статус

✅ Виправлено 