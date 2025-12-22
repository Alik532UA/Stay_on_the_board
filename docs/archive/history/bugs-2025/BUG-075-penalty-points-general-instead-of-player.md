---
status: done
---

# BUG-075: Штрафні бали нараховуються загально замість конкретному гравцю в локальних іграх

## Опис проблеми

**Шлях:** `/game/local`

**Актуальний результат:** Штрафні бали не нараховуються тому гравцю який їх отримав

**Очікуваний результат:** Штрафні бали нараховуються тому гравцю який їх отримав, відображається біля основних балів в score-row

## Аналіз проблеми

### Причина
В локальних іграх штрафні бали за "дзеркальні" ходи нараховувалися до загального `penaltyPoints` в `gameState`, а не до рахунку конкретного гравця в `localGameStore`.

### Додаткова проблема
Логіка в `calculateMoveScore` додавала штрафні бали до загального рахунку навіть для локальних ігор, де кожен гравець має свій окремий рахунок.

## Рішення

### 1. Модифікація `calculateMoveScore`
Змінено логіку для локальних ігор - штрафні бали не додаються до загального `penaltyPoints`:

```typescript
function calculateMoveScore(
  currentState: any,
  newPosition: { row: number; col: number },
  playerIndex: number,
  settings: any
): { score: number; penaltyPoints: number; movesInBlockMode: number; jumpedBlockedCells: number } {
  // ...
  const humanPlayersCount = currentState.players.filter(p => p.type === 'human').length;
  console.log(`🔍 calculateMoveScore: humanPlayersCount = ${humanPlayersCount}, playerIndex = ${playerIndex}`);
  
  if (currentState.moveHistory.length >= 2) {
    const computerOriginPosition = currentState.moveHistory[currentState.moveHistory.length - 2].pos;
    const computerRow = Array.isArray(computerOriginPosition) ? computerOriginPosition[0] : computerOriginPosition.row;
    const computerCol = Array.isArray(computerOriginPosition) ? computerOriginPosition[1] : computerOriginPosition.col;
    
    if (newPosition.row === computerRow && newPosition.col === computerCol) {
      if (humanPlayersCount <= 1) {
        console.log(`🎯 calculateMoveScore: додаємо 2 штрафних бали до загального penaltyPoints (single player game)`);
        newPenaltyPoints += 2;
      } else {
        console.log(`🎯 calculateMoveScore: НЕ додаємо штрафні бали до загального penaltyPoints (local game), будуть додані до гравця в performMove`);
      }
    }
  }
  // ...
}
```

### 2. Модифікація `performMove`
Додано логіку для нарахування штрафних балів безпосередньо до рахунку гравця:

```typescript
export async function performMove(direction: MoveDirectionType, distance: number, playerIndex: number = 0) {
  // ...
  const currentStateAfterMove = get(gameState);
  const humanPlayersCount = currentStateAfterMove.players.filter(p => p.type === 'human').length;
  
  if (humanPlayersCount > 1) {
    const currentPlayer = currentStateAfterMove.players[playerIndex];
    if (currentPlayer) {
      const localGameState = get(localGameStore);
      const localPlayer = localGameState.players.find(p => p.name === currentPlayer.name);
      
      if (localPlayer) {
        console.log(`🎯 performMove: додаємо 1 бал гравцю ${currentPlayer.name} за хід`);
        localGameStore.addPlayerScore(localPlayer.id, 1);
        
        // Перевіряємо чи був "дзеркальний" хід для нарахування штрафних балів
        if (currentState.moveHistory.length >= 2) {
          const computerOriginPosition = currentState.moveHistory[currentState.moveHistory.length - 2].pos;
          const computerRow = Array.isArray(computerOriginPosition) ? computerOriginPosition[0] : computerOriginPosition.row;
          const computerCol = Array.isArray(computerOriginPosition) ? computerOriginPosition[1] : computerOriginPosition.col;
          
          if (newPosition.row === computerRow && newPosition.col === computerCol) {
            console.log(`🎯 performMove: додаємо 2 штрафних бали гравцю ${currentPlayer.name} за "дзеркальний" хід`);
            localGameStore.addPlayerScore(localPlayer.id, 2);
            console.log(`✅ performMove: штрафні бали додано гравцю ${currentPlayer.name}`);
          }
        }
      }
    }
  }
  // ...
}
```

### 3. Додавання логування в `localGameStore`
Додано детальне логування для відстеження оновлень рахунків:

```javascript
addPlayerScore: (playerId, pointsToAdd) => {
  console.log(`🎯 localGameStore.addPlayerScore: додаємо ${pointsToAdd} балів гравцю з ID ${playerId}`);
  update(state => {
    const updatedState = {
      ...state,
      players: state.players.map(p => 
        p.id === playerId ? { ...p, score: p.score + pointsToAdd } : p
      )
    };
    const updatedPlayer = updatedState.players.find(p => p.id === playerId);
    console.log(`✅ localGameStore.addPlayerScore: рахунок гравця ${updatedPlayer?.name} оновлено до ${updatedPlayer?.score}`);
    return updatedState;
  });
},
```

## Тестування

### Сценарій тестування
1. Запустити локальну гру в `/game/local`
2. Зробити кілька ходів, включаючи "дзеркальні" ходи
3. Перевірити рахунки гравців в `score-panel`
4. Переконатися, що штрафні бали нараховуються правильному гравцю

### Очікуваний результат
- Штрафні бали нараховуються тому гравцю, який зробив "дзеркальний" хід
- Рахунок відображається біля основних балів у `score-row`
- Логіка працює однаково для всіх гравців

## Файли, що були змінені

- `src/lib/services/gameLogicService.ts` - модифіковано логіку нарахування штрафних балів
- `src/lib/stores/localGameStore.js` - додано логування для `addPlayerScore`

## Статус

✅ **ВИПРАВЛЕНО**

## Примітки

- Штрафні бали тепер нараховуються безпосередньо до рахунку конкретного гравця
- Логіка розділена між single-player та local games
- Додано детальне логування для відстеження нарахувань
- Виправлено використання `moveHistory` для правильної перевірки "дзеркальних" ходів 