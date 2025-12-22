---
status: done
---

# BUG-070: Неправильна навігація після виходу з режиму "Переглянути запис"

## Опис багу

**Сценарій відтворення:**
1. Грати в `/game/vs-computer`
2. Модальне вікно: "Гра завершено!"
3. Натиснути "Переглянути запис"
4. Вийти з "Переглянути запис"

**Актуальний результат:** сторінка гри в `/game/local`
**Очікуваний результат:** сторінка гри в `/game/vs-computer` та вікно та дані які були до відкриття "Переглянути запис"

## Причина багу

Проблема була в логіці визначення типу гри. Функція `_determineGameType()` в `gameOrchestrator.ts` використовувала неправильний підхід:

```typescript
// НЕПРАВИЛЬНО:
const isLocalGame = localGameState.players.length > 1;
```

`localGameStore` завжди містить 4 гравців, навіть для гри проти комп'ютера, тому функція завжди повертала `'local'` замість `'vs-computer'`.

## Виправлення

Замінив логіку визначення типу гри на основі поточного URL:

```typescript
// ПРАВИЛЬНО:
const currentPath = window.location.pathname;
if (currentPath.includes('/game/local')) {
  return 'local';
} else if (currentPath.includes('/game/vs-computer')) {
  return 'vs-computer';
}
return 'vs-computer'; // fallback
```

## Змінені файли

1. **`src/lib/gameOrchestrator.ts`**
   - Виправлено функцію `_determineGameType()`
   - Виправлено логіку в `endGame()`
   - Виправлено логіку в `startReplay()`

2. **`src/lib/components/FloatingBackButton.svelte`**
   - Виправлено логіку визначення типу гри в `handleBackClick()`

3. **`src/lib/stores/derivedState.ts`**
   - Виправлено логіку в `currentPlayerColor`
   - Виправлено логіку в `previousPlayerColor`

## Тестування

Для тестування виправлення:

1. Запустити гру в режимі `/game/vs-computer`
2. Завершити гру (вийти за межі дошки)
3. Натиснути "Переглянути запис"
4. Натиснути кнопку "Назад" (←)
5. Перевірити, що повертаємося на `/game/vs-computer` з правильним модальним вікном

## Статус

✅ **ВИПРАВЛЕНО** - 2025-01-XX

## Додаткові нотатки

Цей баг вказує на проблему з архітектурою: `localGameStore` використовується як для локальних ігор, так і для ігор проти комп'ютера, що призводить до плутанини. В майбутньому варто розглянути розділення цих стейтів. 