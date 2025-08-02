# BUG-045: Виправлення розрахунку бонусу за "Ходів немає"

## Опис проблеми
Бонус за "Ходів немає" не коректно розраховувався та відображався у модальному вікні "Блискучий аналіз!". Проблема полягала в тому, що `calculateFinalScore` викликався зі старим станом, а не з оновленим після додавання бонусу.

## Причина
У функціях `claimNoMoves` та `_triggerComputerMove` в `gameOrchestrator.ts`:
1. Спочатку додавався бонус до стану через `stateManager.applyChanges`
2. Але потім `calculateFinalScore` викликався зі старим станом, який не містив оновленого бонусу

## Рішення

### Крок 1: Оновлення `gameOrchestrator.ts`

#### Функція `claimNoMoves`
- ✅ Гарантоване очікування оновлення стану через `await`
- ✅ Отримання оновленого стану після застосування змін
- ✅ Використання актуального стану для розрахунку рахунку

#### Функція `_triggerComputerMove`
- ✅ Виправлено обидва блоки `else` (коли комп'ютер не може зробити хід)
- ✅ Гарантоване очікування оновлення стану через `await`
- ✅ Використання актуального стану для розрахунку рахунку

### Крок 2: Спрощення `calculateFinalScore`

#### Функція `calculateFinalScore` в `gameLogicService.ts`
- ✅ Спрощено логіку розрахунку бонусу
- ✅ Прибрано зайві коментарі та змінні
- ✅ Використання прямого доступу до `noMovesBonus` зі стану

## Зміни в коді

### `src/lib/gameOrchestrator.ts`
```typescript
// Було:
stateManager.applyChanges(...);
const updatedState = get(gameState);
const potentialScoreDetails = gameLogicService.calculateFinalScore(updatedState as any);

// Стало:
await stateManager.applyChanges(
  'SUCCESSFUL_NO_MOVES_CLAIM', 
  { 
    noMovesClaimed: true,
    noMovesBonus: state.noMovesBonus + state.boardSize
  }, 
  'Player successfully claimed no moves and bonus is awarded'
);
const updatedState = get(gameState);
const potentialScoreDetails = gameLogicService.calculateFinalScore(updatedState as any);
```

### `src/lib/services/gameLogicService.ts`
```typescript
// Було:
const { score, penaltyPoints, boardSize, movesInBlockMode, jumpedBlockedCells, finishedByFinishButton, noMovesBonus: accumulatedNoMovesBonus } = state;
const noMovesBonus = accumulatedNoMovesBonus || 0;

// Стало:
const { score, penaltyPoints, boardSize, movesInBlockMode, jumpedBlockedCells, finishedByFinishButton, noMovesBonus } = state;
const totalScore = baseScore + sizeBonus + blockModeBonus + jumpBonus - totalPenalty + (noMovesBonus || 0) + finishBonus;
```

## Результат
- ✅ Бонус за "Ходів немає" тепер коректно розраховується
- ✅ Правильне відображення в модальному вікні "Блискучий аналіз!"
- ✅ Збережено архітектурні принципи (SSoT, UDF, SoC)
- ✅ Гарантоване оновлення стану перед розрахунком рахунку
- ✅ Код став простішим та читабельнішим

## Тестування
Логіка тепер працює наступним чином:
1. Гравець або комп'ютер заявляє "Ходів немає"
2. Чекаємо, поки стан ГАРАНТОВАНО оновиться через `await`
3. Отримуємо оновлений стан зі store
4. Розраховуємо фінальний рахунок на основі актуального стану
5. Відображається коректна інформація в модальному вікні

## Дата виправлення
2025-01-27 