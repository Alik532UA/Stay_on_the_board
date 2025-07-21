# `REFACTORING_PLAN_GAME_MODES.md`

## Мета

Реалізувати систему вибору ігрових режимів ("Новачок", "Досвідчений", "Профі") при старті гри для покращення досвіду нових та досвідчених гравців. Це включає створення модального вікна вибору, додавання нових налаштувань та імплементацію логіки автоматичного приховування дошки.

---

### Крок 1: Розширення Керування Станом (`settingsStore` та `uiStore`)

**Завдання:** Додати нові стани для керування режимами гри та видимістю модального вікна.

1.  **Файл:** `svelte-app/src/lib/stores/settingsStore.js`
    *   Додайте новий параметр `autoHideBoard: boolean` до інтерфейсу `SettingsState` та об'єкту `defaultSettings`.
    *   Оновіть функцію `loadSettings`, щоб вона також завантажувала цей параметр з `localStorage`.

    ```javascript
    // file: svelte-app/src/lib/stores/settingsStore.js

    // ... (в інтерфейсі SettingsState)
    export interface SettingsState {
      // ... існуючі властивості
      autoHideBoard: boolean; // <-- ДОДАТИ
      keyConflictResolution: Record<string, string>;
    }

    // ... (в об'єкті defaultSettings)
    const defaultSettings = {
      // ... існуючі властивості
      showQueen: true,
      blockOnVisitCount: 0,
      autoHideBoard: false, // <-- ДОДАТИ
      keybindings: defaultKeybindings,
      keyConflictResolution: {},
    };

    // ... (в функції loadSettings)
    function loadSettings(): SettingsState {
      // ...
      const stored = {
        // ... існуючі властивості
        blockOnVisitCount: Number(localStorage.getItem('blockOnVisitCount')) || 0,
        autoHideBoard: localStorage.getItem('autoHideBoard') === 'true', // <-- ДОДАТИ
        keybindings: { ...defaultKeybindings, ...storedKeybindings },
        keyConflictResolution: safeJsonParse(localStorage.getItem('keyConflictResolution'), {}),
      };
      return stored;
    }
    ```

2.  **Файл:** `svelte-app/src/lib/stores/uiStore.js`
    *   Додайте стан `isGameModeModalOpen` та функції для керування ним.

    ```javascript
    // file: svelte-app/src/lib/stores/uiStore.js
    import { writable } from 'svelte/store';

    export const uiState = writable({
      isVoiceSettingsModalOpen: false,
      isGameModeModalOpen: false, // <-- ДОДАТИ
    });

    export function openVoiceSettingsModal() {
      uiState.update(state => ({ ...state, isVoiceSettingsModalOpen: true }));
    }

    export function closeVoiceSettingsModal() {
      uiState.update(state => ({ ...state, isVoiceSettingsModalOpen: false }));
    }

    // <-- ДОДАТИ НОВІ ФУНКЦІЇ -->
    export function openGameModeModal() {
      uiState.update(state => ({ ...state, isGameModeModalOpen: true }));
    }

    export function closeGameModeModal() {
      uiState.update(state => ({ ...state, isGameModeModalOpen: false }));
    }
    ```

### Крок 2: Інтернаціоналізація (i18n)

**Завдання:** Додати нові текстові ключі для всіх підтримуваних мов.

1.  Створіть нові файли `gameModes.js` у кожній директорії мови (`uk`, `en`, `crh`, `nl`).

    *   **Файл:** `svelte-app/src/lib/i18n/uk/gameModes.js`
        ```javascript
        export default {
          title: "Вибір режиму гри",
          beginner: "Новачок",
          experienced: "Досвідчений",
          pro: "Профі",
          autoHideBoard: "Автоматично приховувати дошку",
          changeModeTooltip: "Змінити режим гри"
        };
        ```    *   **Файл:** `svelte-app/src/lib/i18n/en/gameModes.js`
        ```javascript
        export default {
          title: "Select Game Mode",
          beginner: "Beginner",
          experienced: "Experienced",
          pro: "Pro",
          autoHideBoard: "Automatically hide board",
          changeModeTooltip: "Change Game Mode"
        };
        ```
    *   **Файл:** `svelte-app/src/lib/i18n/crh/gameModes.js`
        ```javascript
        export default {
          title: "Oyun rejimini saylañız",
          beginner: "Başlanğıç",
          experienced: "Tecribeli",
          pro: "Professional",
          autoHideBoard: "Tahtanı avtomatik gizle",
          changeModeTooltip: "Oyun rejimini deñiştir"
        };
        ```
    *   **Файл:** `svelte-app/src/lib/i18n/nl/gameModes.js`
        ```javascript
        export default {
          title: "Selecteer Spelmodus",
          beginner: "Beginner",
          experienced: "Ervaren",
          pro: "Pro",
          autoHideBoard: "Verberg bord automatisch",
          changeModeTooltip: "Verander Spelmodus"
        };
        ```

2.  Оновіть головні файли локалізації, щоб включити нові переклади.

    *   **Файл:** `svelte-app/src/lib/i18n/uk.js` (і аналогічно для `en.js`, `crh.js`, `nl.js`)
        ```javascript
        // ... існуючі імпорти
        import replay from './uk/replay.js';
        import faq from './uk/faq.js';
        import gameModes from './uk/gameModes.js'; // <-- ДОДАТИ

        export default {
          // ... існуючі експорти
          replay,
          faq,
          gameModes // <-- ДОДАТИ
        };
        ```

### Крок 3: Створення Модального Вікна Вибору Режиму

**Завдання:** Створити новий компонент `GameModeModal.svelte`.

*   **Створіть файл:** `svelte-app/src/lib/components/GameModeModal.svelte`

    ```svelte
    <script>
      import { _ } from 'svelte-i18n';
      import { applyGameModePreset } from '$lib/stores/settingsStore.js';
      import { closeGameModeModal } from '$lib/stores/uiStore.js';

      function selectMode(mode) {
        applyGameModePreset(mode);
        closeGameModeModal();
      }
    </script>

    <div class="game-mode-modal">
      <h2 class="modal-title">{$_('gameModes.title')}</h2>
      <div class="modal-buttons">
        <button class="modal-btn-generic green-btn" on:click={() => selectMode('beginner')}>
          {$_('gameModes.beginner')}
        </button>
        <button class="modal-btn-generic blue-btn" on:click={() => selectMode('experienced')}>
          {$_('gameModes.experienced')}
        </button>
        <button class="modal-btn-generic danger-btn" on:click={() => selectMode('pro')}>
          {$_('gameModes.pro')}
        </button>
      </div>
    </div>

    <style>
      .game-mode-modal {
        padding: 24px;
        text-align: center;
      }
      .modal-title {
        font-size: 1.8em;
        margin-bottom: 24px;
        color: var(--text-primary);
      }
      .modal-buttons {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
    </style>
    ```

### Крок 4: Інтеграція Модального Вікна та Нової Логіки

**Завдання:** Оновити `settingsStore`, `GameBoard` та `GameControls` для використання нової логіки.

1.  **Файл:** `svelte-app/src/lib/stores/settingsStore.js`
    *   Додайте функцію `applyGameModePreset` та `toggleAutoHideBoard`.
    *   Імпортуйте `setBoardSize` з `gameStore`.

    ```javascript
    // file: svelte-app/src/lib/stores/settingsStore.js
    // ... (існуючі імпорти)
    import { setBoardSize } from '$lib/stores/gameStore.js'; // <-- ДОДАТИ

    // ... (після всіх існуючих функцій)

    // <-- ДОДАТИ НОВІ ФУНКЦІЇ -->
    /**
     * @param {'beginner' | 'experienced' | 'pro'} mode
     */
    export function applyGameModePreset(mode) {
      let settingsToApply = {};
      
      switch (mode) {
        case 'beginner':
          settingsToApply = {
            showBoard: true,
            showQueen: true,
            showMoves: true,
            blockModeEnabled: false,
            speechEnabled: false,
            autoHideBoard: false,
          };
          break;
        case 'experienced':
          settingsToApply = {
            showBoard: true,
            showQueen: true,
            showMoves: true,
            blockModeEnabled: false,
            speechEnabled: true,
            autoHideBoard: true,
          };
          break;
        case 'pro':
          settingsToApply = {
            showBoard: true,
            showQueen: true,
            showMoves: true,
            blockModeEnabled: true,
            blockOnVisitCount: 0,
            speechEnabled: true,
            autoHideBoard: true,
          };
          break;
      }
      
      updateSettings(settingsToApply);
      setBoardSize(4); // Встановлюємо розмір дошки для всіх режимів
    }

    export function toggleAutoHideBoard() {
      const currentSettings = get(settingsStore);
      updateSettings({ autoHideBoard: !currentSettings.autoHideBoard });
    }
    ```

2.  **Файл:** `svelte-app/src/lib/components/GameBoard.svelte`
    *   Інтегруйте `GameModeModal` та логіку його показу.

    ```svelte
    // file: svelte-app/src/lib/components/GameBoard.svelte
    // ... (в секції <script>)
    import { uiState, openGameModeModal } from '$lib/stores/uiStore.js'; // <-- ОНОВИТИ
    import GameModeModal from '$lib/components/GameModeModal.svelte'; // <-- ДОДАТИ

    onMount(() => {
      // ... (існуючий код в onMount)
      const hasSelectedMode = sessionStorage.getItem('hasSelectedGameMode');
      if (!hasSelectedMode) {
        openGameModeModal();
        sessionStorage.setItem('hasSelectedGameMode', 'true');
      }
    });

    // ... (в секції розмітки HTML)
    // Додайте нову кнопку у .game-board-top-row
    <div class="game-board-top-row">
      <button class="main-menu-btn" title={mainMenuTitle} onclick={goToMainMenu}>
        <SvgIcons name="home" />
      </button>
      <button class="main-menu-btn" title={$_('gameModes.changeModeTooltip')} onclick={openGameModeModal}>
        <SvgIcons name="settings" /> <!-- Або інша іконка -->
      </button>
      <button class="main-menu-btn" title={$_('gameBoard.info')} onclick={showGameInfoModal}>
        <SvgIcons name="info" />
      </button>
    </div>

    // ... (в кінці файлу, перед <style>)
    {#if $uiState.isGameModeModalOpen}
      <Modal>
        <GameModeModal />
      </Modal>
    {/if}
    ```    *Примітка: Потрібно буде створити або знайти SVG іконку `settings` для `SvgIcons.svelte`.*

3.  **Файл:** `svelte-app/src/lib/components/GameControls.svelte`
    *   Додайте новий чекбокс.

    ```svelte
    // file: svelte-app/src/lib/components/GameControls.svelte
    // ... (в <script>)
    import { settingsStore, toggleShowBoard, toggleShowMoves, toggleSpeech, toggleShowQueen, toggleAutoHideBoard } from '$lib/stores/settingsStore.js'; // <-- ДОДАТИ toggleAutoHideBoard

    // ... (в розмітці HTML, всередині .toggles)
    // Після чекбоксу "Озвучування ходів"
    <label class="ios-switch-label">
      <div class="switch-content-wrapper">
        <div class="ios-switch">
          <input type="checkbox" checked={$settingsStore.autoHideBoard} onchange={toggleAutoHideBoard} />
          <span class="slider"></span>
        </div>
        <span>{$_('gameModes.autoHideBoard')}</span>
      </div>
    </label>
    ```

### Крок 5: Реалізація Логіки Автоматичного Приховування

**Завдання:** Оновити `gameOrchestrator.js` та `settingsStore.js` для реалізації логіки.

1.  **Файл:** `svelte-app/src/lib/stores/settingsStore.js`
    *   Модифікуйте `toggleShowBoard`, щоб вона могла приймати булеве значення.

    ```javascript
    // file: svelte-app/src/lib/stores/settingsStore.js
    // Замініть існуючу функцію toggleShowBoard
    /**
     * @param {boolean} [forceState]
     */
    export function toggleShowBoard(forceState) {
      const prev = get(settingsStore);
      const newState = typeof forceState === 'boolean' ? forceState : !prev.showBoard;
      updateSettings({ showBoard: newState });
    }
    ```

2.  **Файл:** `svelte-app/src/lib/gameOrchestrator.js`
    *   Додайте логіку приховування дошки при підтвердженні ходу.

    ```javascript
    // file: svelte-app/src/lib/gameOrchestrator.js
    // ... (в функції confirmPlayerMove)
    export async function confirmPlayerMove() {
      // <-- ДОДАТИ ЦЕЙ БЛОК НА ПОЧАТКУ ФУНКЦІЇ -->
      if (get(settingsStore).autoHideBoard) {
        toggleShowBoard(false);
      }
      // <-- КІНЕЦЬ БЛОКУ -->

      const state = get(appState);
      // ... (решта коду функції)
    }
    ```

---
