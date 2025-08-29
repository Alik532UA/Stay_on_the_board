# Settings Locking

## Опис

Функціональність блокування налаштувань під час гри, яка дозволяє гравцям заборонити зміну ігрових параметрів під час активного ігрового процесу.

## Зміни в appSettingsStore

### Розширений SettingsState

**Додана нова властивість:**
```typescript
/**
 * @typedef {Object} SettingsState
 * // ... існуючі властивості
 * @property {boolean} lockSettings
 */
```

### Оновлений defaultSettings

**Додано значення за замовчуванням:**
```javascript
const defaultSettings = {
  // ... існуючі властивості
  lockSettings: false,
};
```

### Оновлена функція loadSettings

**Додано завантаження з localStorage:**
```javascript
function loadSettings() {
  // ... існуючий код
  return {
    // ... існуючі властивості
    lockSettings: localStorage.getItem('lockSettings') === 'true',
  };
}
```

## Зміни в gameLogicService

### Розширена функція resetGame

**Додано передачу lockSettings:**
```typescript
export function resetGame(options: { 
  newSize?: number; 
  players?: Player[]; 
  settings?: any 
} = {}) {
  // ... існуючий код
  
  if (options.settings) {
    appSettingsStore.updateSettings({
      blockModeEnabled: options.settings.blockModeEnabled,
      autoHideBoard: options.settings.autoHideBoard,
      lockSettings: options.settings.lockSettings, // Нова властивість
      // ... інші налаштування
    });
  }
}
```

## Зміни в PlayerManager

### Оновлена функція startGame

**Додано передачу lockSettings:**
```typescript
function startGame() {
  const { players, settings } = get(localGameStore);
  
  // ... конвертація гравців
  
  resetGame({
    newSize: settings.boardSize,
    players: gamePlayers,
    settings: {
      blockModeEnabled: settings.blockModeEnabled,
      autoHideBoard: settings.autoHideBoard,
      lockSettings: settings.lockSettings // Нова властивість
    }
  });
}
```

## Зміни в SettingsExpanderWidget

### Оновлена функція toggleExpander

**Додано перевірку блокування:**
```typescript
async function toggleExpander() {
  // Перевіряємо, чи заблоковані налаштування
  if ($appSettingsStore.lockSettings) {
    return;
  }
  isOpen = !isOpen;
  await tick();
  if (contentRef) {
    contentHeight = contentRef.scrollHeight;
  }
}
```

### Оновлена розмітка

**Додано класи блокування:**
```svelte
<div class="settings-expander {isOpen ? 'open' : ''}" class:disabled={$appSettingsStore.lockSettings}>
  <div 
    class="settings-summary" 
    class:disabled={$appSettingsStore.lockSettings}
    role="button" 
    aria-label={$_('gameControls.settings')} 
    on:click={toggleExpander} 
    on:keydown={(e) => (e.key === 'Enter' || e.key === ' ') && toggleExpander()} 
    bind:this={summaryRef} 
    tabindex={$appSettingsStore.lockSettings ? -1 : 0}
  >
    <!-- вміст -->
  </div>
</div>
```

### Додано стилі блокування

**Нові CSS класи:**
```css
.settings-expander.disabled {
  opacity: 0.6;
  pointer-events: none; /* Забороняє всі кліки */
  cursor: not-allowed;
}

.settings-summary.disabled {
  cursor: not-allowed;
}
```

## Потік роботи

### 1. Налаштування блокування
```javascript
// В localGameStore
{
  settings: {
    lockSettings: true // Користувач увімкнув блокування
  }
}
```

### 2. Передача при старті гри
```typescript
// В PlayerManager.startGame()
resetGame({
  settings: {
    lockSettings: settings.lockSettings
  }
});
```

### 3. Застосування в appSettingsStore
```typescript
// В gameLogicService.resetGame()
appSettingsStore.updateSettings({
  lockSettings: options.settings.lockSettings
});
```

### 4. Блокування UI
```typescript
// В SettingsExpanderWidget
if ($appSettingsStore.lockSettings) {
  return; // Блокуємо функцію
}
```

## Поведінка компонентів

### Коли lockSettings = false (за замовчуванням):
- **SettingsExpanderWidget** працює нормально
- **Всі налаштування** доступні для зміни
- **Звичайний UI** без обмежень

### Коли lockSettings = true:
- **SettingsExpanderWidget** заблокований
- **Всі налаштування** недоступні для зміни
- **Візуальні індикатори** блокування (opacity, cursor)
- **Клавіатурна навігація** відключена (tabindex = -1)

## Принципи архітектури

### SSoT (Single Source of Truth):
- **lockSettings** зберігається в `appSettingsStore`
- **Єдине джерело правди** для стану блокування

### UDF (Unidirectional Data Flow):
- **Налаштування** → **Передача** → **Застосування** → **UI блокування**
- **Немає зворотного зв'язку** під час гри

### SoC (Separation of Concerns):
- **PlayerManager** - передача налаштування
- **gameLogicService** - застосування налаштування
- **SettingsExpanderWidget** - відображення блокування

## Accessibility

### Клавіатурна навігація:
- **tabindex = -1** коли заблоковано
- **tabindex = 0** коли доступно

### ARIA атрибути:
- **aria-label** залишається для скрін-рідерів
- **role="button"** зберігається

### Візуальні індикатори:
- **opacity: 0.6** для заблокованого стану
- **cursor: not-allowed** для заблокованих елементів

## Готовність до розширення

### Можливі покращення:
- **Часткове блокування** (тільки певні налаштування)
- **Тимчасове блокування** (на певний час)
- **Умовне блокування** (залежно від стану гри)

### Технічні покращення:
- **Анімації блокування** для кращого UX
- **Повідомлення** про причину блокування
- **Логування** спроб зміни заблокованих налаштувань 