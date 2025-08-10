# Local Game Settings Component

## Опис

Компонент для керування налаштуваннями локальної гри. Дозволяє користувачам змінювати розмір дошки та різні ігрові параметри через інтуїтивний інтерфейс.

## Функціональність

### Основні можливості:
- **Керування розміром дошки** через кнопки +/- (2x2 до 9x9)
- **Режим заблокованих клітинок** (blockModeEnabled)
- **Автоматичне приховування дошки** (autoHideBoard)
- **Блокування налаштувань під час гри** (lockSettings)

### Обмеження:
- **Розмір дошки:** Мінімум 2x2, максимум 9x9
- **Валідація:** Кнопки автоматично блокується на граничних значеннях

## Структура компонента

```svelte
<LocalGameSettings />
```

### Внутрішня структура:
```svelte
<div class="settings-card">
  <h2>Налаштування гри</h2>
  
  <div class="settings-list">
    <!-- Розмір дошки -->
    <div class="setting-item">
      <span>Розмір дошки</span>
      <div class="size-adjuster">
        <button>-</button>
        <span>4x4</span>
        <button>+</button>
      </div>
    </div>
    
    <!-- iOS-style перемикачі -->
    <label class="ios-switch-label">
      <span>Режим блокування</span>
      <div class="ios-switch">
        <input type="checkbox" />
        <span class="slider"></span>
      </div>
    </label>
  </div>
</div>
```

## Інтеграція зі сховищем

Компонент інтегрований з `localGameStore`:

```javascript
import { localGameStore } from '$lib/stores/localGameStore.js';

// Підписка на налаштування
$: settings = $localGameStore.settings;

// Оновлення розміру дошки
function changeBoardSize(increment) {
  const newSize = settings.boardSize + increment;
  if (newSize >= 2 && newSize <= 9) {
    localGameStore.updateSettings({ boardSize: newSize });
  }
}

// Оновлення чекбоксів
localGameStore.updateSettings({ 
  blockModeEnabled: true,
  autoHideBoard: false,
  lockSettings: true 
});
```

## Налаштування

### Доступні параметри:
- **boardSize** (number): Розмір дошки (2-9)
- **blockModeEnabled** (boolean): Режим заблокованих клітинок
- **autoHideBoard** (boolean): Автоматичне приховування дошки
- **lockSettings** (boolean): Блокування налаштувань під час гри

## Стилізація

### CSS змінні:
- `--bg-secondary` - фон картки
- `--text-primary` - основний текст
- `--border-color` - колір рамок
- `--control-bg` - фон кнопок
- `--control-hover` - фон кнопок при наведенні
- `--toggle-off-bg` - фон вимкненого перемикача
- `--control-selected` - фон увімкненого перемикача

### Особливості дизайну:
- **iOS-style перемикачі** з плавними анімаціями
- **Адаптивні кнопки** з hover-ефектами
- **Валідація стану** через disabled кнопки
- **Консистентна типографіка** з проектом

## Багатомовність

Підтримує всі мови проекту через `svelte-i18n`:

```javascript
// Ключі перекладу:
localGame.settingsTitle     // "Налаштування гри"
localGame.lockSettings      // "Заборонити зміни під час гри"
settings.boardSize          // "Розмір дошки"
gameControls.blockMode      // "Режим блокування"
gameModes.autoHideBoard     // "Автоматично приховувати дошку"
```

## Принципи архітектури

- **SSoT:** Використовує `localGameStore` як єдине джерело правди
- **UDF:** Зміни стану відбуваються тільки через методи store
- **SoC:** Відокремлений від логіки гри, фокус на UI
- **DRY:** Перевикористовує існуючі ключі перекладів
- **Композиція:** Може бути використаний в різних контекстах

## Валідація та обмеження

### Розмір дошки:
- **Мінімум:** 2x2 (для базової гри)
- **Максимум:** 9x9 (для продуктивності)
- **Валідація:** Автоматична перевірка в `changeBoardSize()`

### UI стани:
- **Disabled кнопки:** При досягненні граничних значень
- **Візуальна зворотна зв'язок:** Через hover-ефекти та анімації
- **Консистентність:** Всі елементи використовують CSS змінні проекту 