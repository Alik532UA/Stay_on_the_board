---
status: done
---

# BUG-081: Додавання бонусних балів за ходи на відстань більше 1

## Опис проблеми

**Шлях:** `/game/local` та `/game/vs-computer`

**Актуальний результат:** Бонусні бали не нараховуються за ходи на відстань більше 1 клітинки

**Очікуваний результат:** Бонусні бали нараховуються за ходи на відстань більше 1 клітинки

## Аналіз проблеми

### Вимоги
1. **Для обох типів ігор:** `/game/local` та `/game/vs-computer`
2. **Умова нарахування:** 
   - Ходи на відстань більше 1 клітинки
   - Перестрибування заблокованих клітинок (для локальної гри)
3. **Розмір бонусу:** 
   - За відстань: +1 бал за хід на відстань більше 1 (незалежно від відстані)
   - За перестрибування: 1 бал за кожну перестрибнуту заблоковану клітинку
4. **Для локальної гри:** бонусні бали нараховуються одразу під час гри кожному гравцю індивідуально
5. **Для гри з комп'ютером:** бонусні бали нараховуються до загального рахунку

### Поточна логіка
- Бали нараховуються тільки за хід (1 бал)
- Штрафні бали за "дзеркальні" ходи
- Бонусні бали за перестрибування заблокованих клітинок
- Відсутня логіка бонусних балів за відстань

## Рішення

### 1. Розширення структури гравця
Додано поле `bonusPoints` до структури гравця в `localGameStore.js`:

```javascript
// Початковий стан
const createInitialState = () => {
  return {
    players: [
      { id: generateId(), name: 'Гравець 1', color: player1Color, score: 0, penaltyPoints: 0, bonusPoints: 0 },
      { id: generateId(), name: 'Гравець 2', color: player2Color, score: 0, penaltyPoints: 0, bonusPoints: 0 },
      { id: generateId(), name: 'Гравець 3', color: player3Color, score: 0, penaltyPoints: 0, bonusPoints: 0 },
      { id: generateId(), name: 'Гравець 4', color: player4Color, score: 0, penaltyPoints: 0, bonusPoints: 0 }
    ],
    // ...
  };
};
```

### 2. Додавання методу для бонусних балів
Створено новий метод `addPlayerBonusPoints` в `localGameStore.js`:

```javascript
/** 
 * Додає бонусні бали до рахунку гравця 
 * @param {number} playerId - ID гравця
 * @param {number} bonusPointsToAdd - Кількість бонусних балів для додавання
 */
addPlayerBonusPoints: (playerId, bonusPointsToAdd) => {
  console.log(`🎯 localGameStore.addPlayerBonusPoints: додаємо ${bonusPointsToAdd} бонусних балів гравцю з ID ${playerId}`);
  update(state => {
    const updatedState = {
      ...state,
      players: state.players.map(p => 
        p.id === playerId ? { ...p, bonusPoints: p.bonusPoints + bonusPointsToAdd } : p
      )
    };
    const updatedPlayer = updatedState.players.find(p => p.id === playerId);
    console.log(`✅ localGameStore.addPlayerBonusPoints: бонусні бали гравця ${updatedPlayer?.name} оновлено до ${updatedPlayer?.bonusPoints}`);
    return updatedState;
  });
},
```

### 3. Оновлення логіки нарахування балів
Змінено `calculateMoveScore` в `gameLogicService.ts`:

```typescript
function calculateMoveScore(
  currentState: any,
  newPosition: { row: number; col: number },
  playerIndex: number,
  settings: any,
  distance: number = 1 // Додано параметр distance
): { score: number; penaltyPoints: number; movesInBlockMode: number; jumpedBlockedCells: number; bonusPoints: number } {
  
  let newBonusPoints = 0; // Додано змінну для бонусних балів

  // ... існуюча логіка ...

  // 5. Підрахунок бонусних балів за ходи на відстань більше 1
  if (distance > 1) {
    newBonusPoints = 1; // Бонус = +1 бал за хід на відстань більше 1
    console.log(`🎯 calculateMoveScore: додаємо ${newBonusPoints} бонусний бал за хід на відстань ${distance}`);
  }

  return {
    score: newScore,
    penaltyPoints: newPenaltyPoints,
    movesInBlockMode: newMovesInBlockMode,
    jumpedBlockedCells: newJumpedBlockedCells,
    bonusPoints: newBonusPoints,
  };
}
```

### 4. Оновлення логіки виконання ходу
Змінено `performMove` в `gameLogicService.ts`:

```typescript
// Додаємо бонусні бали за ходи на відстань більше 1
if (scoreChanges.bonusPoints > 0) {
  console.log(`🎯 performMove: додаємо ${scoreChanges.bonusPoints} бонусних балів гравцю ${currentPlayer.name} за хід на відстань ${distance}`);
  localGameStore.addPlayerBonusPoints(localPlayer.id, scoreChanges.bonusPoints);
}

// Додаємо бонусні бали за перестрибування заблокованих клітинок
if (scoreChanges.jumpedBlockedCells > 0) {
  console.log(`🎯 performMove: додаємо ${scoreChanges.jumpedBlockedCells} бонусних балів гравцю ${currentPlayer.name} за перестрибування ${scoreChanges.jumpedBlockedCells} заблокованих клітинок`);
  localGameStore.addPlayerBonusPoints(localPlayer.id, scoreChanges.jumpedBlockedCells);
}
```

### 5. Оновлення відображення
Додано відображення бонусних балів в `ScorePanelWidget.svelte`:

```svelte
{#if player.bonusPoints > 0}
  <span 
    class="bonus-display" 
    on:click={showBonusInfo}
    on:keydown={e => (e.key === 'Enter' || e.key === ' ') && showBonusInfo()}
    title={$_('gameBoard.bonusHint')}
    role="button"
    tabindex="0"
  >+{player.bonusPoints}</span>
{/if}
```

### 6. Додавання CSS стилів
Створено стилі для бонусних балів:

```css
.bonus-display {
  color: var(--positive-score-color, #4CAF50);
  font-weight: bold;
  cursor: pointer;
  transition: color 0.2s, transform 0.2s;
  border-radius: 4px;
  padding: 2px 6px;
}
.bonus-display:hover {
  color: #2e7d32;
  transform: scale(1.1);
  background: rgba(76, 175, 80, 0.1);
}
```

### 7. Додавання локалізації
Додано ключі локалізації для всіх мов:

```javascript
// Українська
bonusInfoTitle: "Бонусні бали",
bonusHint: "Бонусні бали нараховуються за ходи на відстань більше 1 клітинки",

// Англійська
bonusInfoTitle: "Bonus Points",
bonusHint: "Bonus points are awarded for moves with distance greater than 1 cell",

// Нідерландська
bonusInfoTitle: "Bonuspunten",
bonusHint: "Bonuspunten worden toegekend voor zetten met een afstand groter dan 1 cel",

// Кримськотатарська
bonusInfoTitle: "Bonus ballar",
bonusHint: "1 ücreden çoq mesafeli areketler içün bonus ballar berile",
```

## Тестування

### Сценарій тестування
1. Запустити гру в `/game/local` або `/game/vs-computer`
2. Зробити хід на відстань 2 або більше клітинок
3. Перевірити нарахування бонусних балів
4. Перевірити відображення бонусних балів в інтерфейсі

### Очікуваний результат
- За хід на відстань 2: +1 бонусний бал
- За хід на відстань 3: +1 бонусний бал
- За хід на відстань 4: +1 бонусний бал
- Бонусні бали відображаються зеленим кольором зі знаком "+"
- Клік на бонусні бали показує інформацію про них

## Файли, що були змінені

- `src/lib/stores/localGameStore.js` - додано поле `bonusPoints` та метод `addPlayerBonusPoints`
- `src/lib/services/gameLogicService.ts` - оновлено логіку нарахування бонусних балів
- `src/lib/components/widgets/ScorePanelWidget.svelte` - додано відображення бонусних балів
- `src/lib/i18n/uk/gameBoard.js` - додано локалізацію для української мови
- `src/lib/i18n/en/gameBoard.js` - додано локалізацію для англійської мови
- `src/lib/i18n/nl/gameBoard.js` - додано локалізацію для нідерландської мови
- `src/lib/i18n/crh/gameBoard.js` - додано локалізацію для кримськотатарської мови

## Статус

✅ **ВИПРАВЛЕНО**

## Примітки

- Бонусні бали нараховуються тільки за ходи на відстань більше 1
- Формула: бонус = +1 бал за хід на відстань більше 1 (незалежно від відстані)
- Для локальної гри бонусні бали нараховуються індивідуально кожному гравцю
- Для гри з комп'ютером бонусні бали додаються до загального рахунку
- Бонусні бали відображаються окремо від основних балів та штрафних балів
- Додано повну локалізацію для всіх підтримуваних мов 