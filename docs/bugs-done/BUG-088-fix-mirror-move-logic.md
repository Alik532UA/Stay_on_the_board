---
status: done
---

# BUG-088: Виправлення логіки "дзеркальних" ходів

## Опис проблеми

Логіка перевірки "дзеркальних" ходів була неправильною. Система перевіряла тільки точне співпадіння позицій, але повинна перевіряти напрямок та відстань.

### Актуальний результат
- Система перевіряла: `newPosition.row === computerRow && newPosition.col === computerCol`
- Це означало, що штраф нараховувався тільки при точному поверненні на ту саму позицію
- Не враховувався напрямок та відстань ходу

### Очікуваний результат
- Система повинна перевіряти напрямок та відстань
- Штраф нараховується коли гравець робить хід у протилежному напрямку на N або меншу кількість клітинок після ходу комп'ютера на N клітинок

## Аналіз проблеми

### Причина
Логіка перевірки "дзеркальних" ходів базувалася на порівнянні позицій, а не на аналізі напрямку та відстані ходів. Згідно з документацією:

> Комп'ютер зробив хід на N клітинок у певному напрямку
> Гравець одразу після цього робить хід у протилежному напрямку на N або меншу кількість клітинок

### Приклади неправильної роботи
- Комп'ютер: `up-left 2` → Гравець: `down-right 1` (не штрафувалося, хоча повинно)
- Комп'ютер: `up 3` → Гравець: `down 2` (не штрафувалося, хоча повинно)

## Рішення

### 1. Створення функції `isMirrorMove`

Додано функцію для правильного визначення "дзеркальних" ходів:

```typescript
function isMirrorMove(
  currentDirection: string,
  currentDistance: number,
  computerDirection: string,
  computerDistance: number
): boolean {
  // Визначаємо протилежні напрямки
  const oppositeDirections: Record<string, string> = {
    'up': 'down',
    'down': 'up',
    'left': 'right',
    'right': 'left',
    'up-left': 'down-right',
    'up-right': 'down-left',
    'down-left': 'up-right',
    'down-right': 'up-left'
  };

  const oppositeDirection = oppositeDirections[computerDirection];
  
  // Перевіряємо чи поточний хід у протилежному напрямку
  if (currentDirection !== oppositeDirection) {
    return false;
  }

  // Перевіряємо чи відстань гравця менша або дорівнює відстані комп'ютера
  return currentDistance <= computerDistance;
}
```

### 2. Оновлення логіки в `calculateMoveScore`

Змінено логіку перевірки "дзеркальних" ходів:

```typescript
// Перевіряємо "дзеркальний" хід тільки для ходів гравця (не комп'ютера)
if (isHumanMove && direction && currentState.moveQueue.length >= 1) {
  const lastComputerMove = currentState.moveQueue[currentState.moveQueue.length - 1];
  
  if (lastComputerMove && lastComputerMove.player !== 0) {
    const isMirror = isMirrorMove(
      direction,
      distance,
      lastComputerMove.direction,
      lastComputerMove.distance
    );
    
    if (isMirror) {
      if (humanPlayersCount <= 1) {
        console.log(`🎯 calculateMoveScore: додаємо 2 штрафних бали до загального penaltyPoints (single player game)`);
        newPenaltyPoints += 2;
      } else {
        console.log(`🎯 calculateMoveScore: НЕ додаємо штрафні бали до загального penaltyPoints (local game), будуть додані до гравця в performMove`);
      }
    }
  }
}
```

### 3. Оновлення логіки в `performMove`

Змінено логіку для локальної гри:

```typescript
if (currentPlayer.type === 'human' && currentState.moveQueue.length >= 1) {
  const lastComputerMove = currentState.moveQueue[currentState.moveQueue.length - 1];
  
  if (lastComputerMove && lastComputerMove.player !== 0) {
    const isMirror = isMirrorMove(
      direction,
      distance,
      lastComputerMove.direction,
      lastComputerMove.distance
    );
    
    if (isMirror) {
      console.log(`🎯 performMove: додаємо 2 штрафних бали гравцю ${currentPlayer.name} за "дзеркальний" хід`);
      localGameStore.addPlayerPenaltyPoints(localPlayer.id, 2);
    }
  }
}
```

### 4. Додавання параметрів до `calculateMoveScore`

Додано параметр `direction` до функції `calculateMoveScore`:

```typescript
function calculateMoveScore(
  currentState: any,
  newPosition: { row: number; col: number },
  playerIndex: number,
  settings: any,
  distance: number = 1,
  direction?: string // Додано для перевірки "дзеркальних" ходів
): { score: number; penaltyPoints: number; movesInBlockMode: number; jumpedBlockedCells: number; bonusPoints: number }
```

## Результат

Тепер система правильно визначає "дзеркальні" ходи:

### Правильні приклади штрафування:
- ✅ Комп'ютер: `up-left 2` → Гравець: `down-right 1` (штраф)
- ✅ Комп'ютер: `up-left 2` → Гравець: `down-right 2` (штраф)
- ✅ Комп'ютер: `up 3` → Гравець: `down 2` (штраф)
- ✅ Комп'ютер: `right 1` → Гравець: `left 1` (штраф)

### Правильні приклади без штрафу:
- ✅ Комп'ютер: `up-left 2` → Гравець: `down-right 3` (немає штрафу - більша відстань)
- ✅ Комп'ютер: `up 2` → Гравець: `up 1` (немає штрафу - той самий напрямок)
- ✅ Комп'ютер: `up-left 2` → Гравець: `up-right 1` (немає штрафу - не протилежний напрямок)

## Файли, що були змінені

- `src/lib/services/gameLogicService.ts` - додано функцію `isMirrorMove` та оновлено логіку перевірки "дзеркальних" ходів

## Тестування

Виправлення протестовано:
- ✅ Правильно визначаються "дзеркальні" ходи за напрямком
- ✅ Правильно враховується відстань (менша або дорівнює)
- ✅ Штрафні бали нараховуються тільки за ходи гравця
- ✅ Логування показує правильну інформацію про перевірку

## Статус

✅ **ВИПРАВЛЕНО** - 2025-01-30 