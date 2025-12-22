---
status: done
---

# BUG-XXX: Бонус за відстань не нараховується в грі з комп'ютером

## Опис проблеми
Бонус за відстань (`Бонус за відстань`) не нараховується в грі з комп'ютером (vs-computer mode), хоча логіка розрахунку бонусу працює правильно.

## Кроки для відтворення
1. Запустити гру з комп'ютером
2. Зробити кілька ходів на відстань більше 1 клітинки
3. Завершити гру (наприклад, натиснувши "Завершити")
4. Перевірити фінальний рахунок

## Очікуваний результат
Бонус за відстань повинен відображатися в деталях фінального рахунку з повідомленням "Бонус за відстань: +X".

## Фактичний результат
Бонус за відстань не відображається в фінальному рахунку, хоча розраховується правильно.

## Причина
Проблема була в кількох місцях:

1. **Відсутність поля в інтерфейсах**: `GameState` та `FinalScore` не містили поле `distanceBonus`
2. **Неправильна агрегація**: `calculateFinalScore` не включала `distanceBonus` в загальний рахунок
3. **Відсутність відображення**: Компонент `Modal.svelte` не показував `distanceBonus`
4. **Відсутність локалізації**: Файли локалізації не містили ключ для `distanceBonus`

## Вирішення

### 1. Оновлення інтерфейсів
**Файл**: `src/lib/stores/gameState.ts`
```typescript
export interface GameState {
  // ... existing fields ...
  /** Бонус за відстань (ходи на відстань більше 1). */
  distanceBonus?: number;
  // ... existing fields ...
}
```

**Файл**: `src/lib/services/gameLogicService.ts`
```typescript
export interface FinalScore {
  // ... existing fields ...
  distanceBonus: number;
  // ... existing fields ...
}
```

### 2. Оновлення розрахунку фінального рахунку
**Файл**: `src/lib/services/gameLogicService.ts`
```typescript
export function calculateFinalScore(state: GameState): FinalScore {
  const { score, penaltyPoints, boardSize, movesInBlockMode, jumpedBlockedCells, finishedByFinishButton, noMovesBonus, distanceBonus } = state;
  
  // ... existing calculation ...
  
  const totalScore = baseScore + sizeBonus + blockModeBonus + jumpBonus + (distanceBonus || 0) - totalPenalty + (noMovesBonus || 0) + finishBonus;
  
  return {
    // ... existing fields ...
    distanceBonus: distanceBonus || 0,
    totalScore
  };
}
```

### 3. Оновлення розрахунку рахунку за хід
**Файл**: `src/lib/services/gameLogicService.ts`
```typescript
function calculateMoveScore(
  // ... existing parameters ...
): { score: number; penaltyPoints: number; movesInBlockMode: number; jumpedBlockedCells: number; bonusPoints: number; distanceBonus: number } {
  
  let newDistanceBonus = currentState.distanceBonus || 0;
  
  // 5. Підрахунок бонусних балів за ходи на відстань більше 1
  if (distance > 1) {
    newDistanceBonus += 1;
    newBonusPoints += 1;
    console.log(`🎯 calculateMoveScore: додаємо 1 бонусний бал за хід на відстань ${distance}`);
  }
  
  return {
    // ... existing fields ...
    distanceBonus: newDistanceBonus
  };
}
```

### 4. Ініціалізація в початковому стані
**Файл**: `src/lib/stores/gameState.ts`
```typescript
export function createInitialState(config: GameStateConfig = {}): GameState {
  return {
    // ... existing fields ...
    distanceBonus: 0,
    // ... existing fields ...
  };
}
```

### 5. Додавання відображення в інтерфейсі
**Файл**: `src/lib/components/Modal.svelte`
```svelte
{#if (($modalState.content as any)?.scoreDetails?.distanceBonus ?? $gameState.distanceBonus ?? 0) > 0}
  <div class="score-detail-row">{$_('modal.scoreDetails.distanceBonus')} <span>+{($modalState.content as any)?.scoreDetails?.distanceBonus ?? $gameState.distanceBonus ?? 0}</span></div>
{/if}
```

### 6. Додавання локалізації
**Файли**: `src/lib/i18n/*/modal.js`
```javascript
scoreDetails: {
  // ... existing keys ...
  distanceBonus: "Бонус за відстань:", // Ukrainian
  distanceBonus: "Distance bonus:", // English
  distanceBonus: "Afstand bonus:", // Dutch
  distanceBonus: "Mesafe bonusı:", // Crimean Tatar
  // ... existing keys ...
}
```

### 7. Оновлення документації
Оновлено опис системи бонусів у всіх файлах локалізації, щоб включити інформацію про бонус за відстань.

## Тестування
- ✅ Бонус правильно розраховується для ходів на відстань > 1
- ✅ Бонус зберігається в `GameState` для гри з комп'ютером
- ✅ Бонус включається в фінальний рахунок
- ✅ Бонус відображається в модальному вікні завершення гри
- ✅ Локалізація працює для всіх підтримуваних мов

## Статус
✅ **Вирішено**

Проблема була повністю вирішена:
1. ✅ Додано `distanceBonus` до інтерфейсів `GameState` та `FinalScore`
2. ✅ Оновлено `calculateFinalScore` для включення `distanceBonus` в загальний рахунок
3. ✅ Модифіковано `calculateMoveScore` для правильного накопичення `distanceBonus`
4. ✅ Ініціалізовано `distanceBonus` в `createInitialState`
5. ✅ Додано відображення `distanceBonus` в компоненті `Modal.svelte`
6. ✅ Додано ключі локалізації для `distanceBonus` у всіх мовах
7. ✅ Оновлено документацію про систему бонусів

## Файли, що були змінені
- `src/lib/stores/gameState.ts`
- `src/lib/services/gameLogicService.ts`
- `src/lib/components/Modal.svelte`
- `src/lib/i18n/uk/modal.js`
- `src/lib/i18n/en/modal.js`
- `src/lib/i18n/nl/modal.js`
- `src/lib/i18n/crh/modal.js` 