# ООП Архітектура з класом Figure

## Огляд

Нова архітектура використовує принципи ООП для управління фігурою гравця на дошці. Замість розсіяних маніпуляцій з координатами по всьому коду, тепер всі операції з фігурою інкапсульовані в класі `Figure`.

## Ключові компоненти

### 1. Клас Figure (`src/lib/models/Figure.js`)

```javascript
export class Figure {
  constructor(row, col, boardSize = 4)
  getPosition()
  setPosition(row, col)
  isValidPosition(row, col)
  calculateNewPosition(direction, distance)
  move(direction, distance)
  canMove(direction, distance)
  getAvailableMoves()
  clone()
  equals(other)
  distanceTo(other)
}
```

### 2. Enum MoveDirection

```javascript
export const MoveDirection = {
  UP: 'up',
  DOWN: 'down',
  LEFT: 'left',
  RIGHT: 'right',
  UP_LEFT: 'up-left',
  UP_RIGHT: 'up-right',
  DOWN_LEFT: 'down-left',
  DOWN_RIGHT: 'down-right'
};
```

## Переваги нової архітектури

### 1. Інкапсуляція
- Всі операції з позицією фігури зосереджені в одному класі
- Неможливо випадково змінити позицію фігури ззовні
- Валідація позиції відбувається автоматично

### 2. Типобезпека
- Enum `MoveDirection` гарантує правильні напрямки
- Методи повертають структуровані результати
- TypeScript підтримка для кращої типізації

### 3. Тестованість
- Кожен метод можна легко протестувати ізольовано
- Можна створювати моки для тестування
- Чіткі контракти між методами

### 4. Розширюваність
- Легко додавати нові методи для фігури
- Можна створювати різні типи фігур (наслідування)
- Просто додавати нові правила руху

## Використання

### Створення фігури
```javascript
const figure = new Figure(1, 1, 4); // Позиція (1,1) на дошці 4x4
```

### Виконання руху
```javascript
const result = figure.move(MoveDirection.UP, 1);
if (result.success) {
  console.log('Нова позиція:', result.newPosition);
} else {
  console.log('Помилка:', result.error);
}
```

### Перевірка можливості руху
```javascript
if (figure.canMove(MoveDirection.LEFT, 2)) {
  // Можна рухатися на 2 клітинки вліво
}
```

### Отримання доступних ходів
```javascript
const availableMoves = figure.getAvailableMoves();
// Повертає масив: [{ direction: 'up', distance: 1 }, ...]
```

## Інтеграція з існуючою архітектурою

### gameLogicService.ts
```javascript
export async function performMove(direction, distance, playerIndex = 0) {
  const currentState = get(gameState);
  const figure = new Figure(currentState.playerRow, currentState.playerCol, currentState.boardSize);
  
  if (!figure.canMove(direction, distance)) {
    return { success: false, error: 'Рух неможливий' };
  }

  const moveResult = figure.move(direction, distance);
  // ... оновлення стану гри
}
```

### gameOrchestrator.js
```javascript
// Замість ручного обчислення координат
const moveResult = await gameLogicService.performMove(
  selectedDirection,
  selectedDistance,
  0 // playerIndex = 0 для гравця
);
```

## Міграція з старої архітектури

### Що змінилося:
1. **Видалено**: Ручне обчислення координат в `gameOrchestrator.js`
2. **Видалено**: Прямі маніпуляції з `playerRow`/`playerCol` в різних місцях
3. **Додано**: Клас `Figure` з інкапсульованою логікою
4. **Додано**: Enum `MoveDirection` для типобезпеки

### Що залишилося:
1. **Збережено**: Існуючу структуру стану гри
2. **Збережено**: Анімаційну систему
3. **Збережено**: Логіку AI та валідації

## Тестування

### Unit тести для Figure
```javascript
describe('Figure Class', () => {
  it('повинен виконувати валідний рух', () => {
    const figure = new Figure(1, 1, 4);
    const result = figure.move(MoveDirection.UP, 1);
    expect(result.success).toBe(true);
    expect(result.newPosition).toEqual({ row: 0, col: 1 });
  });
});
```

### Інтеграційні тести
```javascript
describe('Game Logic with Figure', () => {
  it('повинен використовувати Figure для ходів', async () => {
    const result = await gameLogicService.performMove('up', 1, 0);
    expect(result.success).toBe(true);
  });
});
```

## Майбутні покращення

### 1. Різні типи фігур
```javascript
class Queen extends Figure {
  // Спеціальні правила для ферзя
}

class Knight extends Figure {
  // Спеціальні правила для коня
}
```

### 2. Розширені правила руху
```javascript
class Figure {
  canMoveWithObstacles(direction, distance, board) {
    // Перевірка перешкод на шляху
  }
}
```

### 3. Історія ходів
```javascript
class Figure {
  moveHistory = [];
  
  move(direction, distance) {
    const result = super.move(direction, distance);
    if (result.success) {
      this.moveHistory.push({ direction, distance, timestamp: Date.now() });
    }
    return result;
  }
}
```

## Висновок

Нова ООП архітектура з класом `Figure` забезпечує:
- ✅ Кращу організацію коду
- ✅ Типобезпеку через enum
- ✅ Легке тестування
- ✅ Розширюваність
- ✅ Інкапсуляцію логіки руху
- ✅ Усуває "хаос" з маніпуляціями координат

Це значно покращує якість коду та робить його більш підтримуваним. 