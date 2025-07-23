---
type: improvement-plan
status: виконано
title: "Динамічний layout для ігрової дошки та панелей"
id: PLAN-005
date: "2025-07-13"
author: ""
---

## Опис

Реалізація динамічного layout для ігрової дошки та панелей з підтримкою drag-and-drop, адаптивності та кастомізації розташування елементів.

---

### ✅ Крок 1: Встановлення Залежності

**Завдання:** Додати до проєкту бібліотеку `svelte-dnd-action`, яка є основою для функціоналу перетягування.

- [x] Відкрийте термінал у директорії `svelte-app` та виконайте команду:
  ```bash
  npm install svelte-dnd-action
  ```

---

### ✅ Крок 2: Створення `layoutStore` — Єдиного Джерела Правди для Макета

**Завдання:** Створити новий стор, який буде зберігати та керувати структурою UI. Це центральний елемент нової архітектури.

- [x] Створіть новий файл: `svelte-app/src/lib/stores/layoutStore.js`
- [x] Додайте до нього наступний код. Він визначає структуру за замовчуванням, завантажує збережений макет з `localStorage` та надає функції для його оновлення.

  ```javascript
  // file: svelte-app/src/lib/stores/layoutStore.js
  import { writable } from 'svelte/store';

  const isBrowser = typeof window !== 'undefined';

  // Унікальні ідентифікатори для кожного віджета
  export const WIDGETS = {
    TOP_ROW: 'game-board-top-row',
    SCORE_PANEL: 'score-panel',
    BOARD_WRAPPER: 'board-bg-wrapper',
    CONTROLS_PANEL: 'game-controls-panel',
    SETTINGS_EXPANDER: 'settings-expander',
  };

  // Структура макета за замовчуванням
  const defaultLayout = [
    {
      id: 'column-1',
      widgets: [WIDGETS.TOP_ROW, WIDGETS.SCORE_PANEL, WIDGETS.BOARD_WRAPPER],
    },
    {
      id: 'column-2',
      widgets: [WIDGETS.CONTROLS_PANEL],
    },
    {
      id: 'column-3',
      widgets: [WIDGETS.SETTINGS_EXPANDER],
    },
  ];

  /**
   * Завантажує макет з localStorage або повертає стандартний.
   * @returns {typeof defaultLayout}
   */
  function loadLayout() {
    if (!isBrowser) return defaultLayout;
    try {
      const savedLayout = localStorage.getItem('gameLayout');
      if (savedLayout) {
        // TODO: Додати валідацію, щоб переконатися, що збережений макет містить усі необхідні віджети
        return JSON.parse(savedLayout);
      }
    } catch (e) {
      console.error('Failed to load layout from localStorage', e);
    }
    return defaultLayout;
  }

  const { subscribe, set, update } = writable(loadLayout());

  /**
   * Зберігає поточний макет у localStorage.
   * @param {typeof defaultLayout} layout
   */
  function saveLayout(layout) {
    if (isBrowser) {
      localStorage.setItem('gameLayout', JSON.stringify(layout));
    }
  }

  // Підписуємося на зміни, щоб автоматично зберігати макет
  subscribe(saveLayout);

  export const layoutStore = {
    subscribe,
    set,
    update,
  };
  ```

---

### ✅ Крок 3: Декомпозиція UI на Незалежні Віджети

**Завдання:** Розбити монолітні компоненти `GameBoard.svelte` та `GameControls.svelte` на менші, незалежні компоненти-віджети. Це ключовий крок для реалізації принципу розділення відповідальності.

1.  **Створіть директорію для віджетів:** `svelte-app/src/lib/components/widgets/`

2.  **Створіть `TopRowWidget.svelte`:**
    - [x] Створіть файл: `svelte-app/src/lib/components/widgets/TopRowWidget.svelte`
    - [x] Перенесіть відповідний HTML-блок та логіку з `GameBoard.svelte`.

3.  **Створіть `ScorePanelWidget.svelte`:**
    - [x] Створіть файл: `svelte-app/src/lib/components/widgets/ScorePanelWidget.svelte`
    - [x] Перенесіть відповідний HTML-блок та логіку з `GameBoard.svelte`.

4.  **Створіть `BoardWrapperWidget.svelte`:**
    - [x] Створіть файл: `svelte-app/src/lib/components/widgets/BoardWrapperWidget.svelte`
    - [x] Перенесіть відповідний HTML-блок та логіку з `GameBoard.svelte`.

5.  **Створіть `ControlsPanelWidget.svelte`:**
    - [x] Створіть файл: `svelte-app/src/lib/components/widgets/ControlsPanelWidget.svelte`
    - [x] Перенесіть відповідний HTML-блок та логіку з `GameControls.svelte`.

6.  **Створіть `SettingsExpanderWidget.svelte`:**
    - [x] Створіть файл: `svelte-app/src/lib/components/widgets/SettingsExpanderWidget.svelte`
    - [x] Перенесіть відповідний HTML-блок та логіку з `GameControls.svelte`.

*Примітка: Після перенесення коду в нові файли, вам потрібно буде додати необхідні імпорти (`appState`, `settingsStore`, `_` тощо) до кожного нового компонента.*

---

### ✅ Крок 4: Створення Динамічного Макета

**Завдання:** Створити головний компонент-контейнер, який буде динамічно рендерити віджети на основі даних з `layoutStore` та реалізовувати логіку D&D.

1.  **Створіть файл:** `svelte-app/src/lib/components/DynamicLayout.svelte`
2.  **Додайте код:**

    ```svelte
    // file: svelte-app/src/lib/components/DynamicLayout.svelte
    <script>
      import { layoutStore, WIDGETS } from '$lib/stores/layoutStore.js';
      import { dndzone } from 'svelte-dnd-action';
      import { flip } from 'svelte/animate';

      // Імпортуємо всі наші віджети
      import TopRowWidget from './widgets/TopRowWidget.svelte';
      import ScorePanelWidget from './widgets/ScorePanelWidget.svelte';
      import BoardWrapperWidget from './widgets/BoardWrapperWidget.svelte';
      import ControlsPanelWidget from './widgets/ControlsPanelWidget.svelte';
      import SettingsExpanderWidget from './widgets/SettingsExpanderWidget.svelte';

      const widgetMap = {
        [WIDGETS.TOP_ROW]: TopRowWidget,
        [WIDGETS.SCORE_PANEL]: ScorePanelWidget,
        [WIDGETS.BOARD_WRAPPER]: BoardWrapperWidget,
        [WIDGETS.CONTROLS_PANEL]: ControlsPanelWidget,
        [WIDGETS.SETTINGS_EXPANDER]: SettingsExpanderWidget,
      };

      function handleDndConsider(e) {
        const { items, info } = e.detail;
        $layoutStore = items;
      }

      function handleDndFinalize(e) {
        const { items, info } = e.detail;
        $layoutStore = items;
      }
    </script>

    <div class="dynamic-layout-container">
      {#each $layoutStore as column (column.id)}
        <div class="layout-column" use:dndzone={{ items: column.widgets, flipDurationMs: 300 }} on:consider={handleDndConsider} on:finalize={handleDndFinalize}>
          {#each column.widgets as widgetId (widgetId)}
            <div class="widget-wrapper" animate:flip={{ duration: 300 }}>
              <svelte:component this={widgetMap[widgetId]} />
            </div>
          {/each}
        </div>
      {/each}
    </div>

    <style>
      .dynamic-layout-container {
        display: flex;
        flex-direction: column;
        gap: 16px;
        width: 100%;
      }

      .layout-column {
        display: flex;
        flex-direction: column;
        gap: 16px;
        min-height: 100px; /* Щоб було куди перетягувати */
        border-radius: 8px;
        padding: 8px;
        border: 2px dashed transparent;
        transition: border-color 0.2s;
      }
      
      /* Стилізація для візуального фідбеку під час перетягування */
      .layout-column:hover {
        border-color: var(--control-hover);
      }

      .widget-wrapper {
        cursor: grab;
      }

      /* Адаптивний макет для широких екранів */
      @media (min-width: 1024px) {
        .dynamic-layout-container {
          flex-direction: row;
          align-items: flex-start;
          justify-content: center;
        }
        .layout-column {
          flex: 1;
          max-width: 500px;
        }
      }
    </style>
    ```

---

### ✅ Крок 5: Інтеграція Динамічного Макета в `GameBoard.svelte`

**Завдання:** Замінити весь статичний HTML-код в `GameBoard.svelte` на виклик нового компонента `DynamicLayout.svelte`.

*   **Файл:** `svelte-app/src/lib/components/GameBoard.svelte`
    *   Видаліть весь HTML-код, що стосується `game-board-top-row`, `score-panel`, `board-bg-wrapper` та компонента `GameControls`.
    *   Імпортуйте та вставте `<DynamicLayout />`.

    ```svelte
    // file: svelte-app/src/lib/components/GameBoard.svelte
    <script>
      // Залиште тільки необхідні імпорти для модальних вікон та onMount
      import { onMount } from 'svelte';
      import { get } from 'svelte/store';
      import { appState, resetGame } from '$lib/stores/gameStore.js';
      import { uiState, clearGameModeModalRequest } from '$lib/stores/uiStore.js';
      import { showGameModeSelector, showGameInfoModal } from '../utils/uiHelpers';
      import Modal from '$lib/components/Modal.svelte';
      import VoiceSettingsModal from '$lib/components/VoiceSettingsModal.svelte';
      import DynamicLayout from './DynamicLayout.svelte'; // <-- ДОДАТИ

      // ... (залиште логіку onMount)
    </script>

    <div class="game-board-container">
      <DynamicLayout />
    </div>

    <Modal />
    {#if $uiState.isVoiceSettingsModalOpen}
      <VoiceSettingsModal close={closeVoiceSettingsModal} />
    {/if}

    <style>
      .game-board-container {
        width: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
      }
    </style>
    ```

*Примітка: Вам потрібно буде створити файл `svelte-app/src/lib/utils/uiHelpers.js` і перенести туди функції `showGameModeSelector`, `showGameInfoModal`, `showClearCacheModal`.

---

### ✅ Крок 6: Винесення UI-хелперів

- [x] Створити файл `svelte-app/src/lib/utils/uiHelpers.js` і перенести туди функції `showGameModeSelector`, `showGameInfoModal`, `showClearCacheModal`.

---

### ✅ Крок 7: Реалізація логіки Drag-and-Drop у DynamicLayout

- [x] Реалізувати оновлення layoutStore при drag-and-drop (handleDndConsider, handleDndFinalize)

---

### ✅ Крок 8: Перенесення повного функціоналу у віджети

- [x] Перенести реальний ігровий функціонал (ігрове поле, кнопки керування, налаштування) у відповідні віджети замість заглушок

---

### ⬜ Крок 9: Тестування та доопрацювання

- [ ] Протестувати drag-and-drop, збереження макета, коректність роботи всіх віджетів
- [ ] Відрефакторити/доповнити стилі за потреби