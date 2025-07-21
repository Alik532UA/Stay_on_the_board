```md
### `FIX_PLAN_GAME_MODE_MODAL.md`

**Мета:** Виправити логіку відображення модального вікна вибору режиму гри, яке наразі не з'являється при вході на ігрову сторінку. Проблема полягає в некоректній інтеграції компонента модального вікна. Ми переробимо логіку, щоб використовувати існуючий централізований `modalStore` для керування відображенням вікна вибору режиму.

---

### Крок 1: Оновлення `modalStore` для підтримки кастомних компонентів

**Завдання:** Переконатися, що `modalStore` може рендерити будь-який переданий компонент.

*   **Файл:** `svelte-app/src/lib/stores/modalStore.js`
    *   Додайте властивість `component` до типів та початкового стану, щоб наш `Modal.svelte` міг його рендерити.

    ```javascript
    // file: svelte-app/src/lib/stores/modalStore.js
    // Deleting the following lines:
    /**
     * @typedef {Object} ModalState
     * @property {boolean} isOpen
     * @property {string} [title]
     * @property {string} [titleKey]
     * @property {string|ModalContent|any} [content]
     * @property {string} [contentKey]
     * @property {ModalButton[]} buttons
     */

    /** @type {ModalState} */
    const initialState = {
      isOpen: false,
      title: '',
      content: '',
      buttons: []
    };

    // Adding the following lines:
    /**
     * @typedef {Object} ModalState
     * @property {boolean} isOpen
     * @property {string} [title]
     * @property {string} [titleKey]
     * @property {string|ModalContent|any} [content]
     * @property {string} [contentKey]
     * @property {ModalButton[]} buttons
     * @property {any} [component]
     */

    /** @type {ModalState} */
    const initialState = {
      isOpen: false,
      title: '',
      content: '',
      buttons: [],
      component: null
    };
    ```
    ```javascript
    // file: svelte-app/src/lib/stores/modalStore.js
    // Deleting the following lines:
    function showModal({ title, titleKey, content, contentKey, buttons }) {
      set({ isOpen: true, title, titleKey, content, contentKey, buttons: buttons || [] });
    }

    // Adding the following lines:
    function showModal({ title, titleKey, content, contentKey, buttons, component }) {
      set({ isOpen: true, title, titleKey, content, contentKey, buttons: buttons || [], component });
    }
    ```

### Крок 2: Централізація логіки виклику модального вікна

**Завдання:** Перенести логіку виклику модального вікна з `uiStore` безпосередньо в `GameBoard`, оскільки вона специфічна для цього компонента.

*   **Файл:** `svelte-app/src/lib/stores/uiStore.js`
    *   Видаліть стани та функції, пов'язані з `GameModeModal`, оскільки ми будемо використовувати `modalStore`.

    ```javascript
    // file: svelte-app/src/lib/stores/uiStore.js
    // Deleting the following lines:
    export const uiState = writable({
      isVoiceSettingsModalOpen: false,
      isGameModeModalOpen: false, // <-- ВИДАЛИТИ
    });

    // ...

    // <-- ВИДАЛИТИ ЦІ ФУНКЦІЇ -->
    export function openGameModeModal() {
      uiState.update(state => ({ ...state, isGameModeModalOpen: true }));
    }

    export function closeGameModeModal() {
      uiState.update(state => ({ ...state, isGameModeModalOpen: false }));
    }

    // Adding the following lines:
    export const uiState = writable({
      isVoiceSettingsModalOpen: false,
    });
    ```

### Крок 3: Оновлення `settingsStore` для взаємодії з `modalStore`

**Завдання:** Змусити функцію `applyGameModePreset` закривати модальне вікно після вибору режиму.

*   **Файл:** `svelte-app/src/lib/stores/settingsStore.js`
    *   Імпортуйте `modalStore` та викликайте `closeModal` в кінці функції `applyGameModePreset`.

    ```javascript
    // file: svelte-app/src/lib/stores/settingsStore.js
    // Deleting the following lines:
    import { setBoardSize } from '$lib/stores/gameStore.js';

    // Adding the following lines:
    import { setBoardSize } from '$lib/stores/gameStore.js';
    import { modalStore } from './modalStore.js';
    ```
    ```javascript
    // file: svelte-app/src/lib/stores/settingsStore.js
    // Deleting the following lines:
      updateSettings(settingsToApply);
      setBoardSize(4); // Встановлюємо розмір дошки для всіх режимів
    }

    // Adding the following lines:
      updateSettings(settingsToApply);
      setBoardSize(4); // Встановлюємо розмір дошки для всіх режимів
      modalStore.closeModal();
    }
    ```

### Крок 4: Виправлення компонента `GameModeModal`

**Завдання:** Змінити логіку закриття вікна на використання `modalStore`.

*   **Файл:** `svelte-app/src/lib/components/GameModeModal.svelte`

    ```javascript
    // file: svelte-app/src/lib/components/GameModeModal.svelte
    // Deleting the following lines:
    import { applyGameModePreset } from '$lib/stores/settingsStore.js';
    import { closeGameModeModal } from '$lib/stores/uiStore.js';

    function selectMode(mode) {
      applyGameModePreset(mode);
      closeGameModeModal();
    }

    // Adding the following lines:
    import { applyGameModePreset } from '$lib/stores/settingsStore.js';

    function selectMode(mode) {
      applyGameModePreset(mode);
      // Закриття тепер відбувається в applyGameModePreset
    }
    ```

### Крок 5: Фінальна інтеграція в `GameBoard.svelte`

**Завдання:** Правильно викликати модальне вікно при завантаженні компонента та по кліку на кнопку.

*   **Файл:** `svelte-app/src/lib/components/GameBoard.svelte`
    *   Видаліть стару логіку, пов'язану з `uiStore`.
    *   Імпортуйте `modalStore` та `GameModeModal`.
    *   Створіть функцію `showGameModeSelector`, яка викликає `modalStore.showModal` з компонентом `GameModeModal`.
    *   Викликайте цю функцію в `onMount` та по кліку на нову кнопку.

    ```javascript
    // file: svelte-app/src/lib/components/GameBoard.svelte
    // Deleting the following lines:
    import { uiState, closeVoiceSettingsModal } from '$lib/stores/uiStore.js';
    import VoiceSettingsModal from '$lib/components/VoiceSettingsModal.svelte';
    import { settingsStore, toggleShowBoard, toggleShowMoves, toggleSpeech, toggleShowQueen } from '$lib/stores/settingsStore.js';
    import { modalStore } from '$lib/stores/modalStore.js';

    // Adding the following lines:
    import { uiState, closeVoiceSettingsModal } from '$lib/stores/uiStore.js';
    import VoiceSettingsModal from '$lib/components/VoiceSettingsModal.svelte';
    import { settingsStore, toggleShowBoard, toggleShowMoves, toggleSpeech, toggleShowQueen } from '$lib/stores/settingsStore.js';
    import { modalStore } from '$lib/stores/modalStore.js';
    import GameModeModal from '$lib/components/GameModeModal.svelte';
    ```
    ```javascript
    // file: svelte-app/src/lib/components/GameBoard.svelte
    // Deleting the following lines:
    onMount(() => {
        const state = get(appState);
        if (state.isGameOver || (state.score === 0 && !state.isReplayMode && state.moveHistory.length <= 1)) {
          resetGame();
        }
        const hasVisitedGame = localStorage.getItem('hasVisitedGame');
        if (!hasVisitedGame) {
          showGameInfoModal();
          localStorage.setItem('hasVisitedGame', 'true');
        }
      });

    // Adding the following lines:
    onMount(() => {
        const state = get(appState);
        if (state.isGameOver || (state.score === 0 && !state.isReplayMode && state.moveHistory.length <= 1)) {
          resetGame();
        }
        
        const hasSelectedMode = sessionStorage.getItem('hasSelectedGameMode');
        if (!hasSelectedMode) {
          showGameModeSelector();
          sessionStorage.setItem('hasSelectedGameMode', 'true');
        } else {
            const hasVisitedGame = localStorage.getItem('hasVisitedGame');
            if (!hasVisitedGame) {
              showGameInfoModal();
              localStorage.setItem('hasVisitedGame', 'true');
            }
        }
      });
    ```
    ```javascript
    // file: svelte-app/src/lib/components/GameBoard.svelte
    // Deleting the following lines:
    function showGameInfoModal() {
        modalStore.showModal({
          titleKey: 'faq.title',
          content: { isFaq: true },
          buttons: [
            { textKey: 'rulesPage.title', onClick: () => { goto(`${base}/rules`); modalStore.closeModal(); }, customClass: 'blue-btn' },
            { textKey: 'modal.ok', primary: true, isHot: true, onClick: modalStore.closeModal }
          ]
        });
      }

    // Adding the following lines:
    function showGameInfoModal() {
        modalStore.showModal({
          titleKey: 'faq.title',
          content: { isFaq: true },
          buttons: [
            { textKey: 'rulesPage.title', onClick: () => { goto(`${base}/rules`); modalStore.closeModal(); }, customClass: 'blue-btn' },
            { textKey: 'modal.ok', primary: true, isHot: true, onClick: modalStore.closeModal }
          ]
        });
      }

      function showGameModeSelector() {
        modalStore.showModal({
          component: GameModeModal,
          buttons: [] // Кнопки рендеряться всередині самого компонента
        });
      }
    ```
    ```javascript
    // file: svelte-app/src/lib/components/GameBoard.svelte
    // Deleting the following lines:
    <div class="game-board-top-row">
        <button class="main-menu-btn" title={mainMenuTitle} onclick={goToMainMenu}>
          <SvgIcons name="home" />
        </button>
        <button class="main-menu-btn" title={$_('gameBoard.info')} onclick={showGameInfoModal}>
          <SvgIcons name="info" />
        </button>
      </div>

    // Adding the following lines:
    <div class="game-board-top-row">
        <button class="main-menu-btn" title={mainMenuTitle} onclick={goToMainMenu}>
          <SvgIcons name="home" />
        </button>
        <button class="main-menu-btn" title={$_('gameModes.changeModeTooltip')} onclick={showGameModeSelector}>
          <SvgIcons name="settings" />
        </button>
        <button class="main-menu-btn" title={$_('gameBoard.info')} onclick={showGameInfoModal}>
          <SvgIcons name="info" />
        </button>
      </div>
    ```
    ```javascript
    // file: svelte-app/src/lib/components/GameBoard.svelte
    // Deleting the following lines:
    <Modal />
      {#if $uiState.isVoiceSettingsModalOpen}
        <VoiceSettingsModal close={closeVoiceSettingsModal} />
      {/if}
    </div>

    // Adding the following lines:
    <!-- Видаляємо старий виклик модалки, оскільки тепер вона керується централізовано -->
      {#if $uiState.isVoiceSettingsModalOpen}
        <VoiceSettingsModal close={closeVoiceSettingsModal} />
      {/if}
    </div>
    ```
    *Примітка: Переконайтесь, що іконка `settings` існує в `SvgIcons.svelte`.*

### Крок 6: Оновлення `Modal.svelte` для рендерингу компонентів

**Завдання:** Дозволити `Modal.svelte` рендерити переданий компонент замість статичного контенту.

*   **Файл:** `svelte-app/src/lib/components/Modal.svelte`

    ```javascript
    // file: svelte-app/src/lib/components/Modal.svelte
    // Deleting the following lines:
    <div class="modal-content">
            {#if typeof $modalState.content === 'object' && $modalState.content?.isFaq}
              <FAQModal />
            {:else if typeof $modalState.content === 'object' && $modalState.content?.key && $modalState.content?.actions}
              <p class="reason">{$_('modal.keyConflictContent', { values: { key: $modalState.content.key } })}</p>
            {:else if $modalState.contentKey || (typeof $modalState.content === 'string' && $modalState.content)}
              <p class="reason">
                {#if $modalState.contentKey}
                  {@html $_($modalState.contentKey)}
                {:else if typeof $modalState.content === 'string'}
                  {@html $modalState.content}
                {/if}
              </p>
            {/if}

    // Adding the following lines:
    <div class="modal-content">
            {#if $modalState.component}
              <svelte:component this={$modalState.component} />
            {:else if typeof $modalState.content === 'object' && $modalState.content?.isFaq}
              <FAQModal />
            {:else if typeof $modalState.content === 'object' && $modalState.content?.key && $modalState.content?.actions}
              <p class="reason">{$_('modal.keyConflictContent', { values: { key: $modalState.content.key } })}</p>
            {:else if $modalState.contentKey || (typeof $modalState.content === 'string' && $modalState.content)}
              <p class="reason">
                {#if $modalState.contentKey}
                  {@html $_($modalState.contentKey)}
                {:else if typeof $modalState.content === 'string'}
                  {@html $modalState.content}
                {/if}
              </p>
            {/if}
    ```

Після виконання цих кроків, модальне вікно вибору режиму гри повинно коректно з'являтися при першому вході в гру та викликатися за допомогою нової кнопки в ігровому інтерфейсі.
```