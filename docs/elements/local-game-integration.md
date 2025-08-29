# Local Game Integration

## Опис

Інтеграція сторінки налаштувань локальної гри з основною ігровою логікою. Реалізація логіки запуску гри з налаштуваннями, обраними користувачем.

## Зміни в gameState

### Розширена функція `createInitialState`

**Новий інтерфейс конфігурації:**
```typescript
export interface GameStateConfig {
  size?: number;
  players?: Player[];
}
```

**Оновлена функція:**
```typescript
export function createInitialState(config: GameStateConfig = {}): GameState {
  const size = config.size ?? initialBoardSize;
  const players = config.players ?? [
    { id: 1, type: 'human', name: 'Гравець' },
    { id: 2, type: 'ai', name: 'Комп\'ютер' }
  ];
  
  // ... решта логіки створення стану
}
```

### Логіка роботи:
1. **Гнучкість конфігурації** - можна передати розмір дошки та список гравців
2. **Fallback значення** - якщо конфігурація не передана, використовуються стандартні
3. **Підтримка мультиплеєра** - всі гравці з `localGameStore` конвертуються в тип `'human'`

## Зміни в gameLogicService

### Розширена функція `resetGame`

**Новий інтерфейс опцій:**
```typescript
export function resetGame(options: { 
  newSize?: number; 
  players?: Player[]; 
  settings?: any 
} = {})
```

**Логіка застосування налаштувань:**
```typescript
// Застосовуємо налаштування з локальної гри, якщо вони передані
if (options.settings) {
  appSettingsStore.updateSettings({
    blockModeEnabled: options.settings.blockModeEnabled,
    autoHideBoard: options.settings.autoHideBoard,
    // Гарантуємо, що дошка видима на початку гри
    showBoard: true,
    showQueen: true,
    showMoves: true
  });
} else {
  // Стандартні налаштування видимості для нової гри
  appSettingsStore.updateSettings({
    showBoard: true,
    showQueen: true,
    showMoves: true
  });
}
```

## Зміни в PlayerManager

### Нова функція `startGame`

**Імпорти:**
```typescript
import { get } from 'svelte/store';
import { resetGame } from '$lib/services/gameLogicService.js';
import { navigationService } from '$lib/services/navigationService.js';
```

**Логіка запуску гри:**
```typescript
function startGame() {
  const { players, settings } = get(localGameStore);
  
  // Конвертуємо гравців з localGameStore в формат gameState
  const gamePlayers = players.map(player => ({
    id: player.id,
    name: player.name,
    type: 'human' as const
  }));
  
  // Ініціалізуємо стан гри з поточними налаштуваннями
  resetGame({
    newSize: settings.boardSize,
    players: gamePlayers,
    settings: {
      blockModeEnabled: settings.blockModeEnabled,
      autoHideBoard: settings.autoHideBoard
    }
  });

  // Переходимо на сторінку гри
  navigationService.goTo('/game');
}
```

### Прив'язка до кнопки

**Оновлена розмітка:**
```svelte
<button class="start-game-btn" on:click={startGame}>
  {$_('localGame.startGame')}
</button>
```

## Потік даних

### 1. Налаштування в localGameStore
```javascript
{
  players: [
    { id: 1, name: 'Гравець 1', color: '#ff0000' },
    { id: 2, name: 'Гравець 2', color: '#0000ff' }
  ],
  settings: {
    boardSize: 4,
    blockModeEnabled: true,
    autoHideBoard: true,
    lockSettings: true
  }
}
```

### 2. Конвертація для gameState
```typescript
const gamePlayers = players.map(player => ({
  id: player.id,
  name: player.name,
  type: 'human' as const
}));
```

### 3. Ініціалізація гри
```typescript
resetGame({
  newSize: settings.boardSize,
  players: gamePlayers,
  settings: {
    blockModeEnabled: settings.blockModeEnabled,
    autoHideBoard: settings.autoHideBoard
  }
});
```

### 4. Перехід на гру
```typescript
navigationService.goTo('/game');
```

## Принципи архітектури

### SSoT (Single Source of Truth):
- **localGameStore** - єдине джерело правди для налаштувань
- **gameState** - єдине джерело правди для ігрового стану
- **Чіткий перехід** між двома станами

### UDF (Unidirectional Data Flow):
- **Налаштування** → **Конвертація** → **Ініціалізація** → **Перехід**
- **Немає зворотного зв'язку** під час ініціалізації

### SoC (Separation of Concerns):
- **PlayerManager** - відповідає за UI та виклик функції
- **resetGame** - відповідає за ініціалізацію стану
- **createInitialState** - відповідає за створення початкового стану

## Обробка помилок

### Типізація гравців
- **localGameStore** гравці не мають поля `type`
- **gameState** гравці обов'язково мають поле `type`
- **Конвертація** додає `type: 'human'` для всіх гравців

### Валідація налаштувань
- **Fallback значення** для відсутніх налаштувань
- **Гарантована видимість** дошки на початку гри
- **Стандартні налаштування** для звичайної гри

## Готовність до розширення

### Можливі покращення:
- **Валідація налаштувань** перед запуском
- **Збереження налаштувань** в localStorage
- **Попередній перегляд** дошки з налаштуваннями
- **Швидкі пресети** налаштувань

### Технічні покращення:
- **Типізація налаштувань** замість `any`
- **Обробка помилок** при ініціалізації
- **Анімації переходу** між сторінками 