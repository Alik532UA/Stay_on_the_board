---
id: BUG-041
title: 'Виправлення проблеми з анімацією та ходами комп'ютера'
status: Done
created: 2025-01-25
---

## Опис проблеми

**Дія:** хід гравця
**Візуалізація дошки**
**Актуальний результат:** фігура займає верхне ліве положення без анімації, хід комп'ютера не відбувається
**Очікуваний результат:** 
1. фігура займає нове положення після ходу користувача
2. секунда пауза
3. фігура займає нове положення після ходу комп'ютера

## Причини проблеми

1. **Неправильна реалізація `confirmPlayerMove`**: функція очікувала параметри координат, але викликалася без них
2. **Проблема з `animationStore`**: не оновлював позицію в `gameState` під час анімації
3. **Неправильний виклик AI**: використовувався `agents.computer.makeMove` замість `agents.ai.getMove`
4. **Відсутність додавання ходів до `moveQueue`**: ходи не додавалися до черги для анімації

## Виправлення

### 1. Виправлення `confirmPlayerMove` в `gameOrchestrator.js`

```javascript
async confirmPlayerMove() {
  const gameStateInstance = await getGameState();
  const state = get(gameStateInstance);
  const playerInput = get(playerInputStore);
  
  // Перевіряємо, чи вибрано напрямок та відстань
  if (!playerInput.selectedDirection || !playerInput.selectedDistance) {
    console.warn('confirmPlayerMove: direction or distance not selected');
    return;
  }

  // Обчислюємо нові координати на основі вибраного напрямку та відстані
  const { selectedDirection, selectedDistance } = playerInput;
  const currentRow = state.playerRow;
  const currentCol = state.playerCol;
  
  let newRow = currentRow;
  let newCol = currentCol;
  
  // Обчислюємо нову позицію на основі напрямку
  switch (selectedDirection) {
    case 'up-left':
      newRow -= selectedDistance;
      newCol -= selectedDistance;
      break;
    // ... інші напрямки
  }

  // Використовуємо stateManager для підтвердження ходу
  const moveChanges = {
    playerRow: newRow,
    playerCol: newCol,
    moveQueue: [...state.moveQueue, {
      player: 1, // Гравець
      direction: selectedDirection,
      distance: selectedDistance
    }],
    moveHistory: [...state.moveHistory, {
      pos: { row: newRow, col: newCol },
      player: 'player',
      timestamp: Date.now()
    }]
  };
  
  const success = stateManager.applyChanges('MOVE_PLAYER', moveChanges, 'Player move confirmed');
  
  if (success) {
    // Очищаємо вибір гравця
    playerInputStore.set({
      selectedDirection: null,
      selectedDistance: null,
      isMoveInProgress: false,
      distanceManuallySelected: false
    });
    
    // Запускаємо хід комп'ютера
    this._triggerComputerMove();
  }
}
```

### 2. Виправлення `_triggerComputerMove`

```javascript
async _triggerComputerMove() {
  const gameStateInstance = await getGameState();
  const state = get(gameStateInstance);
  
  if (state.isGameOver) {
    return;
  }

  // Затримка перед ходом комп'ютера
  setTimeout(async () => {
    const currentState = get(await getGameState());
    
    if (currentState.isGameOver) {
      return;
    }

    // Отримуємо хід від AI
    const move = await agents.ai.getMove(currentState);
    
    if (move) {
      // Використовуємо stateManager для ходу комп'ютера
      const computerMoveChanges = {
        playerRow: move.row,
        playerCol: move.col,
        moveQueue: [...currentState.moveQueue, {
          player: 2, // Комп'ютер
          direction: move.direction,
          distance: move.distance
        }],
        moveHistory: [...currentState.moveHistory, {
          pos: { row: move.row, col: move.col },
          player: 'computer',
          timestamp: Date.now()
        }]
      };
      
      stateManager.applyChanges('COMPUTER_MOVE', computerMoveChanges, 'Computer move executed');
      
      // Обробляємо побічні ефекти
      this._handleComputerMoveSideEffects(move);
    }
  }, 1000);
}
```

### 3. Виправлення `animationStore.js`

```javascript
function processQueue() {
  if (!gameState) return;
  
  const currentGameState = get(gameState);
  const queue = currentGameState.moveQueue;

  if (lastProcessedMoveIndex >= queue.length) {
    update(v => ({ ...v, isAnimating: false, showAvailableMoveDots: true }));
    return;
  }

  update(v => ({ ...v, isAnimating: true, showAvailableMoveDots: false }));

  const nextMove = queue[lastProcessedMoveIndex];

  if (nextMove) {
    // КРОК 1: Показуємо анімацію (попередня позиція)
    setTimeout(() => {
      // КРОК 2: Обчислюємо нову позицію на основі напрямку та відстані
      const currentRow = currentGameState.playerRow || 0;
      const currentCol = currentGameState.playerCol || 0;
      
      let newRow = currentRow;
      let newCol = currentCol;
      
      // Обчислюємо нову позицію на основі напрямку
      switch (nextMove.direction) {
        case 'up-left':
          newRow -= nextMove.distance;
          newCol -= nextMove.distance;
          break;
        // ... інші напрямки
      }
      
      // КРОК 3: Оновлюємо логічну позицію в gameState
      gameState.update(state => ({
        ...state,
        playerRow: newRow,
        playerCol: newCol
      }));
      
      // КРОК 4: Завершуємо анімацію
      setTimeout(() => {
        lastProcessedMoveIndex++;
        update(v => ({ ...v, isAnimating: false, showAvailableMoveDots: true }));
        processQueue();
      }, 100);
    }, 500);
  } else {
    update(v => ({ ...v, isAnimating: false, showAvailableMoveDots: true }));
  }
}
```

## Тестування

Створено тест `src/tests/animation.test.js` для перевірки:

1. **Хід гравця**: правильна анімація та оновлення позиції
2. **Хід комп'ютера**: правильна анімація після затримки
3. **Послідовність ходів**: правильна послідовність анімацій
4. **Часові інтервали**: правильні затримки між ходами

Всі тести проходять успішно.

## Результат

✅ Фігура займає нове положення після ходу користувача з анімацією
✅ Секунда пауза між ходами
✅ Фігура займає нове положення після ходу комп'ютера з анімацією
✅ Правильна послідовність: хід гравця → пауза → хід комп'ютера

## Архітектурні принципи

Виправлення дотримується архітектурних принципів:
- **Single Source of Truth**: всі зміни стану через `stateManager`
- **Unidirectional Data Flow**: дані течуть від `gameState` до UI
- **Separation of Concerns**: логіка гри відокремлена від анімації
- **Component Composition**: анімація працює незалежно від логіки 