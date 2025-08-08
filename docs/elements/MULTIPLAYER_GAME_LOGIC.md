# Multiplayer Game Logic

## Опис

Адаптація ігрової логіки для підтримки гри з кількома гравцями-людьми. Модифікація `gameOrchestrator` та `gameState` для правильного перемикання ходів між гравцями.

## Зміни в gameOrchestrator

### Нова функція: `_advanceToNextPlayer()`

```typescript
/**
 * Передає хід наступному гравцеві та визначає, чи потрібно запускати хід AI.
 */
async _advanceToNextPlayer(): Promise<void> {
  const currentState = get(gameState);
  const nextPlayerIndex = (currentState.currentPlayerIndex + 1) % currentState.players.length;
  
  // Оновлюємо стан з новим індексом поточного гравця
  await stateManager.applyChanges(
    'ADVANCE_TURN', 
    { currentPlayerIndex: nextPlayerIndex }, 
    `Turn advanced to player ${nextPlayerIndex}`
  );

  const nextPlayer = get(gameState).players[nextPlayerIndex];

  // Якщо наступний гравець - комп'ютер, запускаємо його хід
  if (nextPlayer.type === 'ai') {
    this._triggerComputerMove();
  }
  // Якщо наступний гравець - людина, нічого не робимо, просто чекаємо на його хід
}
```

### Оновлена функція: `confirmPlayerMove()`

**Зміна:** Замість прямого виклику `_triggerComputerMove()` тепер викликається `_advanceToNextPlayer()`:

```typescript
// Було:
this._triggerComputerMove();

// Стало:
this._advanceToNextPlayer();
```

### Оновлена функція: `_triggerComputerMove()`

**Зміна:** Використання `currentPlayerIndex` замість хардкоду:

```typescript
// Було:
const moveResult = await gameLogicService.performMove(direction, distance, 1);

// Стало:
const state = get(gameState);
const moveResult = await gameLogicService.performMove(direction, distance, state.currentPlayerIndex);
```

### Оновлена функція: `_processPlayerMove()`

**Зміна:** Використання `currentPlayerIndex` замість хардкоду:

```typescript
// Було:
const moveResult = await gameLogicService.performMove(selectedDirection, selectedDistance, 0);

// Стало:
const state = get(gameState);
const moveResult = await gameLogicService.performMove(selectedDirection, selectedDistance, state.currentPlayerIndex);
```

## Логіка перемикання ходів

### Алгоритм:
1. **Після успішного ходу гравця** викликається `_advanceToNextPlayer()`
2. **Розрахунок наступного гравця:** `(currentPlayerIndex + 1) % players.length`
3. **Оновлення стану** через `stateManager.applyChanges()`
4. **Перевірка типу гравця:**
   - Якщо `type === 'ai'` → запуск `_triggerComputerMove()`
   - Якщо `type === 'human'` → очікування ходу гравця

### Циклічність:
- Ходи перемикаються циклічно між усіма гравцями
- Індекс автоматично повертається до 0 після останнього гравця

## Структура gameState

### Підтримувані поля:
```typescript
interface GameState {
  players: Player[];           // Масив гравців
  currentPlayerIndex: number;  // Індекс поточного гравця
  // ... інші поля
}

interface Player {
  id: number;
  type: PlayerType;  // 'human' | 'ai' | 'remote'
  name: string;
}
```

### Початковий стан:
```typescript
players: [
  { id: 1, type: 'human', name: 'Гравець' },
  { id: 2, type: 'ai', name: 'Комп\'ютер' }
],
currentPlayerIndex: 0
```

## Принципи архітектури

### SSoT (Single Source of Truth):
- `currentPlayerIndex` в `gameState` - єдине джерело правди про поточного гравця
- Всі функції використовують цей індекс замість хардкоду

### UDF (Unidirectional Data Flow):
- Зміни `currentPlayerIndex` відбуваються тільки через `stateManager.applyChanges()`
- Всі компоненти підписуються на зміни через `gameState`

### SoC (Separation of Concerns):
- `_advanceToNextPlayer()` - відповідає за логіку перемикання
- `_triggerComputerMove()` - відповідає за хід AI
- `_processPlayerMove()` - відповідає за обробку ходу гравця

## Готовність до розширення

### Підтримувані сценарії:
- ✅ Гравець проти комп'ютера (поточний)
- ✅ Кілька гравців-людей (готова логіка)
- ✅ Змішані режими (люди + AI)

### Можливі покращення:
- Додавання анімацій перемикання ходів
- Візуальна індикація поточного гравця
- Звукові ефекти при зміні ходу
- Статистика по гравцях

## Тестування

### Критичні сценарії:
1. **Перемикання між людьми** - хід не повинен передаватися AI
2. **Перемикання до AI** - повинен запускатися хід комп'ютера
3. **Циклічність** - після останнього гравця повернення до першого
4. **Стан гри** - `currentPlayerIndex` повинен оновлюватися коректно

### Валідація:
- Перевірка правильності індексу після кожного ходу
- Контроль типу гравця перед викликом AI
- Логування змін стану для відлагодження 