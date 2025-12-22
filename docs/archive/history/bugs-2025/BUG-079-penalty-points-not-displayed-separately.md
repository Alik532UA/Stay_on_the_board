---
status: done
---

# BUG-079: Штрафні бали не відображаються окремо від основних балів в локальних іграх

## Опис проблеми

**Шлях:** `/game/local`

**Актуальний результат:** Штрафні бали НЕ відображаються біля основних балів в score-row

**Очікуваний результат:** Штрафні бали відображаються біля основних балів в score-row

## Аналіз проблеми

### Причина
Штрафні бали нараховувалися до загального рахунку гравця (`player.score`) через `localGameStore.addPlayerScore()`, тому вони не відображалися окремо в інтерфейсі. Користувач бачив тільки загальний рахунок, але не міг розрізнити основні бали та штрафні бали.

### Додаткова проблема
В `ScorePanelWidget.svelte` для локальних ігор не було логіки для відображення штрафних балів окремо від основних балів, на відміну від ігор з комп'ютером, де штрафні бали відображалися окремо.

## Рішення

### 1. Розширення структури гравця
Додано поле `penaltyPoints` до структури гравця в `localGameStore.js`:

```javascript
// Початковий стан (Single Source of Truth)
const createInitialState = () => {
  const player1Color = getRandomColor();
  const player2Color = getRandomUnusedColor([player1Color]);
  const player3Color = getRandomUnusedColor([player1Color, player2Color]);
  const player4Color = getRandomUnusedColor([player1Color, player2Color, player3Color]);
  
  return {
    players: [
      { id: generateId(), name: 'Гравець 1', color: player1Color, score: 0, penaltyPoints: 0 },
      { id: generateId(), name: 'Гравець 2', color: player2Color, score: 0, penaltyPoints: 0 },
      { id: generateId(), name: 'Гравець 3', color: player3Color, score: 0, penaltyPoints: 0 },
      { id: generateId(), name: 'Гравець 4', color: player4Color, score: 0, penaltyPoints: 0 }
    ],
    // ...
  };
};
```

### 2. Додавання методу для штрафних балів
Створено новий метод `addPlayerPenaltyPoints` в `localGameStore.js`:

```javascript
/** Додає штрафні бали до рахунку гравця */
addPlayerPenaltyPoints: (playerId, penaltyPointsToAdd) => {
  console.log(`🎯 localGameStore.addPlayerPenaltyPoints: додаємо ${penaltyPointsToAdd} штрафних балів гравцю з ID ${playerId}`);
  update(state => {
    const updatedState = {
      ...state,
      players: state.players.map(p => 
        p.id === playerId ? { ...p, penaltyPoints: p.penaltyPoints + penaltyPointsToAdd } : p
      )
    };
    const updatedPlayer = updatedState.players.find(p => p.id === playerId);
    console.log(`✅ localGameStore.addPlayerPenaltyPoints: штрафні бали гравця ${updatedPlayer?.name} оновлено до ${updatedPlayer?.penaltyPoints}`);
    return updatedState;
  });
},
```

### 3. Оновлення логіки нарахування штрафних балів
Змінено `gameLogicService.ts` для використання нового методу:

```typescript
if (newPosition.row === computerRow && newPosition.col === computerCol) {
  console.log(`🎯 performMove: додаємо 2 штрафних бали гравцю ${currentPlayer.name} за "дзеркальний" хід`);
  localGameStore.addPlayerPenaltyPoints(localPlayer.id, 2);
  console.log(`✅ performMove: штрафні бали додано гравцю ${currentPlayer.name}`);
}
```

### 4. Оновлення відображення в ScorePanelWidget
Додано відображення штрафних балів окремо від основних балів:

```svelte
{#each localGamePlayers as player}
  <div class="score-row">
    <span style={getPlayerNameStyle(player.name)}>{player.name}:</span>
    <span
      class="score-value-clickable"
      class:positive-score={player.score > 0}
      on:click={showScoreInfo}
      on:keydown={e => (e.key === 'Enter' || e.key === ' ') && showScoreInfo()}
      role="button"
      tabindex="0"
      title={$_('modal.scoreInfoTitle')}
    >{player.score}</span>
    {#if player.penaltyPoints > 0}
      <span 
        class="penalty-display" 
        on:click={showPenaltyInfo}
        on:keydown={e => (e.key === 'Enter' || e.key === ' ') && showPenaltyInfo()}
        title={$_('gameBoard.penaltyHint')}
        role="button"
        tabindex="0"
      >+{player.penaltyPoints}</span>
    {/if}
  </div>
{/each}
```

### 5. Оновлення методу скидання рахунків
Оновлено `resetScores` для скидання також штрафних балів:

```javascript
/** Скидає рахунки всіх гравців */
resetScores: () => {
  update(state => {
    return {
      ...state,
      players: state.players.map(p => ({ ...p, score: 0, penaltyPoints: 0 }))
    };
  });
},
```

## Тестування

### Сценарій тестування
1. Запустити локальну гру в `/game/local`
2. Зробити кілька ходів, включаючи "дзеркальні" ходи
3. Перевірити відображення рахунків в `score-panel`
4. Переконатися, що штрафні бали відображаються окремо від основних балів

### Очікуваний результат
- Основні бали відображаються як звичайно
- Штрафні бали відображаються окремо зі знаком "+" та червоним кольором
- Штрафні бали з'являються тільки якщо їх кількість > 0
- Клік на штрафні бали показує інформацію про штрафи

## Файли, що були змінені

- `src/lib/stores/localGameStore.js` - додано поле `penaltyPoints` та метод `addPlayerPenaltyPoints`
- `src/lib/services/gameLogicService.ts` - оновлено логіку нарахування штрафних балів
- `src/lib/components/widgets/ScorePanelWidget.svelte` - додано відображення штрафних балів

## Статус

✅ **ВИПРАВЛЕНО**

## Примітки

- Штрафні бали тепер відстежуються окремо від основних балів
- Відображення штрафних балів узгоджено з дизайном для ігор з комп'ютером
- Штрафні бали показуються зі знаком "+" для вказівки на те, що це додаткові бали
- Збережено всю існуючу функціональність (кліки, підказки, тощо) 