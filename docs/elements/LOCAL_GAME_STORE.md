# Local Game Store

## Опис

Сховище для керування станом налаштувань локальної гри. Забезпечує єдине джерело правди (SSoT) для всієї сторінки налаштувань.

## Структура стану

```javascript
{
  players: [
    {
      id: number,        // Унікальний ідентифікатор гравця
      name: string,      // Ім'я гравця
      color: string      // Колір гравця (HEX формат)
    }
  ],
  settings: {
    boardSize: number,           // Розмір дошки (4-8)
    blockModeEnabled: boolean,   // Режим блокування
    autoHideBoard: boolean,      // Автоматичне приховування дошки
    lockSettings: boolean        // Блокування налаштувань
  }
}
```

## Методи

### Керування гравцями

#### `addPlayer()`
Додає нового гравця до списку.
- **Обмеження:** Максимум 8 гравців
- **Автогенерація:** Ім'я та колір генеруються автоматично

#### `removePlayer(playerId)`
Видаляє гравця за його ID.
- **Обмеження:** Мінімум 2 гравці
- **Параметри:** `playerId` - ID гравця для видалення

#### `updatePlayer(playerId, updatedData)`
Оновлює дані гравця (ім'я або колір).
- **Параметри:**
  - `playerId` - ID гравця для оновлення
  - `updatedData` - Об'єкт з новими даними `{ name?, color? }`

### Керування налаштуваннями

#### `updateSettings(newSettings)`
Оновлює налаштування гри.
- **Параметри:** `newSettings` - Об'єкт з новими налаштуваннями

#### `resetStore()`
Скидає стан до початкового значення.

## Використання

```javascript
import { localGameStore } from '$lib/stores/localGameStore.js';

// Підписка на зміни
const unsubscribe = localGameStore.subscribe(state => {
  console.log('Новий стан:', state);
});

// Додавання гравця
localGameStore.addPlayer();

// Оновлення налаштувань
localGameStore.updateSettings({ boardSize: 6 });

// Відписка
unsubscribe();
```

## Принципи архітектури

- **SSoT (Single Source of Truth):** Всі дані про гравців та налаштування зберігаються в одному місці
- **UDF (Unidirectional Data Flow):** Зміни стану відбуваються тільки через методи store
- **SoC (Separation of Concerns):** Логіка керування станом відокремлена від UI компонентів
- **Іммутабельність:** Всі оновлення створюють нові об'єкти стану 