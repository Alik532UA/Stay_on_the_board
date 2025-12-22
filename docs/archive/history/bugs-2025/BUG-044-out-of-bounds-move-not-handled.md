# BUG-044: Хід за межі дошки не обробляється як поразка

## Опис проблеми

Ходи, які ведуть за межі дошки, ігнорувалися замість того, щоб оброблятися як поразка гравця. Гравець міг робити невалідні ходи без наслідків.

## Причина

Проблема полягала у передчасній перевірці валідності ходу в `gameOrchestrator.ts`. Функція `confirmPlayerMove` містила перевірку `gameLogicService.isValidMove()`, яка блокувала передачу "неправильного" ходу до `gameLogicService.performMove()`. Це означало, що `gameLogicService` не міг визначити причину поразки та правильно обробити невалідний хід.

## Виправлення

### Зміни в `src/lib/gameOrchestrator.ts`

Видалено передчасну перевірку валідності ходу з функції `confirmPlayerMove()`:

**Видалено:**
```typescript
// Перевіряємо валідність ходу
if (!gameLogicService.isValidMove(direction, distance)) {
  console.warn('confirmPlayerMove: невалідний хід');
  return;
}
```

**Результат:**
Тепер функція `confirmPlayerMove` одразу викликає `_processPlayerMove` після розрахунку координат, дозволяючи `gameLogicService.performMove()` бути єдиним джерелом правди щодо правил гри.

### Логіка обробки в `_processPlayerMove`

Функція `_processPlayerMove` вже правильно обробляє результати `performMove`:

```typescript
const moveResult = await gameLogicService.performMove(selectedDirection, selectedDistance, 0);

if (moveResult.success) {
  // Успішний хід - очищаємо ввід та запускаємо хід комп'ютера
  playerInputStore.set({
    selectedDirection: null,
    selectedDistance: null,
    distanceManuallySelected: false,
    isMoveInProgress: false
  });
  this._triggerComputerMove();
} else {
  // Обробка невдалих ходів
  if (moveResult.reason === 'out_of_bounds') {
    this.endGame('modal.gameOverReasonOut');
  } else if (moveResult.reason === 'blocked_cell') {
    this.endGame('modal.gameOverReasonBlocked');
  }
}
```

### Логіка в `gameLogicService.performMove`

Функція `performMove` правильно визначає причини невдач:

```typescript
// 1. Перевірка виходу за межі дошки
if (!piece.isValidPosition(newPosition.row, newPosition.col)) {
  console.log('❌ performMove: вихід за межі дошки');
  return { success: false, reason: 'out_of_bounds' };
}

// 2. Перевірка ходу на заблоковану клітинку
if (isCellBlocked(newPosition.row, newPosition.col, currentState.cellVisitCounts, settings)) {
  console.log('❌ performMove: хід на заблоковану клітинку');
  return { success: false, reason: 'blocked_cell' };
}
```

## Ключові зміни:

1. **Видалення дублювання логіки**: Прибрано передчасну перевірку валідності в `gameOrchestrator`
2. **Єдине джерело правди**: `gameLogicService.performMove` тепер є єдиним місцем визначення правил гри
3. **Правильна обробка поразки**: Невалідні ходи тепер правильно завершують гру з відповідною причиною

## Тестування

Створено тест `src/tests/out-of-bounds-move.test.js` для перевірки:

- ✅ Обробка ходу за межі дошки як поразка
- ✅ Обробка ходу на заблоковану клітинку як поразка  
- ✅ Нормальна обробка успішних ходів
- ✅ Правильне викликання `endGame` з відповідними причинами

## Результат

Тепер ходи, які ведуть за межі дошки:
1. Правильно визначаються як невалідні в `gameLogicService.performMove`
2. Повертають `{ success: false, reason: 'out_of_bounds' }`
3. Обробляються в `_processPlayerMove` як поразка
4. Викликають `endGame('modal.gameOverReasonOut')` для завершення гри

## Дата виправлення

2025-01-27

## Статус

✅ Виправлено 