---
status: done
---

# BUG-XXX: Бонус за відстань не нараховується в грі з комп'ютером

**Тип:** Баг
**Статус:** Виправлено
**Назва:** Бонус за відстань не нараховується в грі з комп'ютером

---

## Опис проблеми

У грі з комп'ютером бонусні бали за ходи на відстань більше 1 не нараховувалися в фінальному рахунку. Хоча логіка нарахування бонусів за відстань була реалізована в `calculateMoveScore`, ці бали не зберігалися в `GameState` і не враховувалися в `calculateFinalScore`.

---

## Кроки для відтворення

1. Запустити гру з комп'ютером
2. Зробити кілька ходів на відстань більше 1 (наприклад, ходи на відстань 2, 3, 4)
3. Завершити гру кнопкою "Завершити"
4. Перевірити фінальний рахунок

---

## Актуальний результат

Бонус за відстань **не відображався** в фінальному рахунку, хоча лог показував нарахування бонусних балів:
```
🎯 calculateMoveScore: додаємо 1 бонусний бал за хід на відстань 2
🎯 calculateMoveScore: додаємо 1 бонусний бал за хід на відстань 3
```

---

## Очікуваний результат

Бонус за відстань повинен відображатися в фінальному рахунку як окремий компонент "Бонус за відстань: +X".

---

## Причина проблеми

1. **Відсутність поля `distanceBonus` в `GameState`**: Інтерфейс `GameState` не містив поле для зберігання бонусів за відстань
2. **Відсутність поля `distanceBonus` в `FinalScore`**: Інтерфейс `FinalScore` не містив поле для відображення бонусів за відстань
3. **Неправильна обробка в `calculateFinalScore`**: Функція не враховувала бонуси за відстань при розрахунку фінального рахунку
4. **Відсутність збереження в `performMove`**: Для гри з комп'ютером бонуси за відстань не зберігалися в `GameState`

---

## Виправлення

### 1. Додавання поля `distanceBonus` до інтерфейсів

**Файл:** `src/lib/services/gameLogicService.ts`
```typescript
export interface GameState {
  // ... existing fields ...
  distanceBonus: number; // Бонус за ходи на відстань більше 1
}

export interface FinalScore {
  // ... existing fields ...
  distanceBonus: number; // Бонус за відстань
  totalScore: number;
}
```

**Файл:** `src/lib/stores/gameState.ts`
```typescript
export interface GameState {
  // ... existing fields ...
  /** Бонус за відстань (ходи на відстань більше 1). */
  distanceBonus?: number;
}
```

### 2. Оновлення функції `calculateFinalScore`

**Файл:** `src/lib/services/gameLogicService.ts`
```typescript
export function calculateFinalScore(state: GameState): FinalScore {
  const { score, penaltyPoints, boardSize, movesInBlockMode, jumpedBlockedCells, finishedByFinishButton, noMovesBonus, distanceBonus } = state;
  
  // ... existing calculations ...
  
  const totalScore = baseScore + sizeBonus + blockModeBonus + jumpBonus + (distanceBonus || 0) - totalPenalty + (noMovesBonus || 0) + finishBonus;
  
  return {
    // ... existing fields ...
    distanceBonus: distanceBonus || 0,
    totalScore
  };
}
```

### 3. Оновлення функції `calculateMoveScore`

**Файл:** `src/lib/services/gameLogicService.ts`
```typescript
function calculateMoveScore(
  // ... existing parameters ...
): { score: number; penaltyPoints: number; movesInBlockMode: number; jumpedBlockedCells: number; bonusPoints: number; distanceBonus: number } {
  
  let newDistanceBonus = currentState.distanceBonus || 0; // Додаємо змінну для бонусів за відстань
  
  // 5. Підрахунок бонусних балів за ходи на відстань більше 1
  if (distance > 1) {
    newDistanceBonus += 1; // Бонус = +1 бал за хід на відстань більше 1 (незалежно від відстані)
    newBonusPoints += 1; // Також додаємо до загальних бонусних балів для локальної гри
    console.log(`🎯 calculateMoveScore: додаємо 1 бонусний бал за хід на відстань ${distance}`);
  }
  
  return {
    // ... existing fields ...
    distanceBonus: newDistanceBonus
  };
}
```

### 4. Оновлення функції `createInitialState`

**Файл:** `src/lib/stores/gameState.ts`
```typescript
export function createInitialState(config: GameStateConfig = {}): GameState {
  // ... existing code ...
  
  return {
    // ... existing fields ...
    distanceBonus: 0,
    // ... existing fields ...
  };
}
```

### 5. Додавання логування в `performMove`

**Файл:** `src/lib/services/gameLogicService.ts`
```typescript
// Перевіряємо "дзеркальний" хід для single player гри (гра з комп'ютером)
if (humanPlayersCount <= 1 && playerIndex === 0) { // Гравець (не комп'ютер)
  // Додаємо бонусні бали за відстань до GameState для гри з комп'ютером
  if (scoreChanges.distanceBonus > 0) {
    console.log(`🎯 performMove (single player): додаємо ${scoreChanges.distanceBonus} бонусних балів за відстань до GameState`);
  }
  
  // ... existing code ...
}
```

---

## Результат виправлення

✅ **Бонус за відстань тепер правильно нараховується** в грі з комп'ютером
✅ **Бонус за відстань відображається** в фінальному рахунку
✅ **Збережена сумісність** з локальною грою (бонуси за відстань нараховуються і там)
✅ **Додано логування** для відстеження нарахування бонусів

---

## Тестування

1. **Гра з комп'ютером**: Зробити кілька ходів на відстань більше 1, завершити гру, перевірити фінальний рахунок
2. **Локальна гра**: Переконатися, що бонуси за відстань нараховуються як і раніше
3. **Логування**: Перевірити, що в логах з'являються повідомлення про нарахування бонусів за відстань

---

## Файли, що були змінені

- `src/lib/services/gameLogicService.ts` - додано поле `distanceBonus` до інтерфейсів та оновлено логіку розрахунків
- `src/lib/stores/gameState.ts` - додано поле `distanceBonus` до інтерфейсу та ініціалізації 