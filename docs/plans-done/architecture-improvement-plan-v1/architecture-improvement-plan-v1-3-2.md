Звісно. Цей етап спрямований на те, щоб зробити компоненти максимально "чистими" та декларативними. Вони не повинні містити складної логіки, а лише відображати стан, отриманий зі сторів, та відправляти події/викликати дії.

---

### Детальний План: Винесення логіки з компонентів

**Мета:** Зменшити кількість логіки всередині Svelte-компонентів, перенісши її у відповідні стори та сервіси. Це покращить SoC (Separation of Concerns) та зробить компоненти простішими для читання та тестування.

---

### Частина 1: Рефакторинг `GameControls.svelte` (та його наступника `ControlsPanelWidget.svelte`)

**Задача:** Вся логіка визначення стану кнопок (наприклад, `disabled`) та центрального дисплея має бути в `derived` сторах.

*Примітка: Ми вже виконали значну частину цієї роботи, створивши `derived` стор `centerInfo`. Тепер ми завершимо цей процес для решти логіки.*

#### Крок 1: Створення `derived` стору для стану кнопок

Ми створимо новий `derived` стор, який буде обчислювати, чи повинна кнопка "Підтвердити" бути активною.

1.  **Відкрийте файл:** `src/lib/stores/derivedState.ts`
2.  **Додайте новий `derived` стор:**

    ```typescript
    // src/lib/stores/derivedState.ts
    import { derived } from 'svelte/store';
    import { gameState } from './gameState';
    import { playerInputStore } from './playerInputStore';
    // ... інші імпорти

    // ... (існуючі стори lastComputerMove та centerInfo) ...

    /**
     * Derived стор, що визначає, чи заблокована кнопка підтвердження ходу.
     * @type {import('svelte/store').Readable<boolean>}
     */
    export const isConfirmButtonDisabled = derived(
      [gameState, playerInputStore],
      ([$gameState, $playerInputStore]) => {
        const isPlayerTurn = $gameState.players[$gameState.currentPlayerIndex]?.type === 'human';
        const { selectedDirection, selectedDistance, isMoveInProgress } = $playerInputStore;

        return !isPlayerTurn || isMoveInProgress || !selectedDirection || !selectedDistance;
      }
    );
    ```

**Пояснення:** Ми інкапсулювали всю логіку перевірки стану кнопки в одному місці. Тепер компонент не потребує знань про те, *чому* кнопка заблокована, а лише знає, *чи* вона заблокована.

#### Крок 2: Спрощення `ControlsPanelWidget.svelte`

Тепер ми використаємо новий стор у компоненті.

1.  **Відкрийте файл:** `src/lib/components/widgets/ControlsPanelWidget.svelte`
2.  **Оновіть імпорти:**

    ```javascript
    // ...
    import { centerInfo, isConfirmButtonDisabled } from '$lib/stores/derivedState.ts'; // <-- Додаємо isConfirmButtonDisabled
    // ...
    ```

3.  **Видаліть застарілу реактивну змінну:**

    **Видалити:**
    ```javascript
    $: buttonDisabled = !selectedDirection || !selectedDistance;
    // ...
    $: confirmButtonBlocked = !isPlayerTurn || isMoveInProgress || !selectedDirection || !selectedDistance;
    ```

4.  **Оновіть розмітку, щоб використовувати новий стор:**

    **Було:**
    ```svelte
    <button
      class="confirm-btn{buttonDisabled ? ' disabled' : ''}"
      on:click={onConfirmClick}
      aria-disabled={buttonDisabled}
      ...
    >
    ```
    або
    ```svelte
    <button class="confirm-btn" on:click={onConfirmMove} disabled={confirmButtonBlocked} ...>
    ```

    **Стане:**
    ```svelte
    <button
      class="confirm-btn"
      class:disabled={$isConfirmButtonDisabled}
      on:click={onConfirmClick}
      disabled={$isConfirmButtonDisabled}
      ...
    >
    ```

**Результат:** Компонент `ControlsPanelWidget` тепер не містить логіки обчислення стану кнопок. Він просто прив'язує свій вигляд до значення стору `$isConfirmButtonDisabled`.

---

### Частина 2: Рефакторинг `MainMenu.svelte`

**Задача:** Логіку показу модального вікна вибору режиму гри (`showGameModeModal`) винести з компонента і зробити її частиною процесу навігації.

#### Крок 1: Створення `uiService`

Ми створимо новий сервіс, який буде відповідати за логіку, пов'язану з UI, яка не належить конкретному компоненту.

1.  **Створіть новий файл:** `src/lib/services/uiService.js`
2.  **Додайте в нього наступний код:**

    ```javascript
    // src/lib/services/uiService.js
    import { get } from 'svelte/store';
    import { settingsStore } from '$lib/stores/settingsStore.js';
    import { modalStore } from '$lib/stores/modalStore.js';
    import { gameState } from '$lib/stores/gameState.js';
    import { resetGame } from '$lib/services/gameLogicService.js';
    import GameModeModal from '$lib/components/GameModeModal.svelte';
    import { goto } from '$app/navigation';
    import { base } from '$app/paths';

    /**
     * Ініціює процес переходу до гри.
     * Перевіряє, чи потрібно показувати модальне вікно вибору режиму,
     * і або показує його, або одразу переходить до гри.
     */
    export function navigateToGame() {
      const { isGameOver } = get(gameState);
      if (isGameOver) {
        resetGame();
      }
      
      settingsStore.init(); // Переконуємося, що налаштування актуальні

      if (get(settingsStore).showGameModeModal) {
        modalStore.showModal({
          titleKey: 'gameModes.title',
          component: GameModeModal,
          closable: true
        });
      } else {
        const currentMode = get(settingsStore).gameMode;
        if (!currentMode) {
          // Якщо режим не встановлено, застосовуємо "новачок" за замовчуванням
          settingsStore.applyGameModePreset('beginner');
        }
        goto(`${base}/game`);
      }
    }
    ```

**Пояснення:** Ми інкапсулювали всю логіку, пов'язану з переходом на сторінку гри, в одну функцію.

#### Крок 2: Спрощення `MainMenu.svelte`

Тепер `MainMenu` буде просто викликати цю єдину функцію.

1.  **Відкрийте файл:** `src/lib/components/MainMenu.svelte`
2.  **Оновіть імпорти та логіку:**

    **Було:**
    ```svelte
    <script>
      // ...
      import { gameState } from '$lib/stores/gameState.js';
      import { resetGame } from '$lib/stores/gameActions.js';
      import { modalStore } from '$lib/stores/modalStore.js';
      import GameModeModal from '$lib/components/GameModeModal.svelte';
      // ...

      /** @param {string} route */
      function navigateTo(route) {
        if (route === '/game') {
          if (get(gameState).isGameOver) {
            resetGame();
          }
          settingsStore.init();
          if (get(settingsStore).showGameModeModal) {
            modalStore.showModal({
              titleKey: 'gameModes.title',
              component: GameModeModal,
              closable: true
            });
          } else {
            const currentMode = get(settingsStore).gameMode;
            if (!currentMode) {
              settingsStore.applyGameModePreset('beginner');
            }
            goto(`${base}/game`);
          }
          return;
        }
        logStore.addLog(`Навігація: ${route}`, 'info');
        goto(`${base}${route}`);
      }
      // ...
    </script>
    <!-- ... -->
    <button class="modal-button secondary" onclick={() => navigateTo('/game')}>{$_('mainMenu.playVsComputer')}</button>
    ```

    **Стане:**
    ```svelte
    <script>
      // ...
      import { navigateToGame } from '$lib/services/uiService.js'; // <-- НОВИЙ ІМПОРТ
      // ...
      // Видаляємо стару функцію navigateTo, або спрощуємо її, якщо вона потрібна для інших маршрутів
      /** @param {string} route */
      function navigateTo(route) {
        logStore.addLog(`Навігація: ${route}`, 'info');
        goto(`${base}${route}`);
      }
    </script>
    <!-- ... -->
    <button class="modal-button secondary" on:click={navigateToGame}>{$_('mainMenu.playVsComputer')}</button>
    ```

**Результат:**
*   Компонент `MainMenu.svelte` більше не містить складної логіки, пов'язаної з перевіркою стану гри та налаштувань. Він просто викликає сервісну функцію.
*   Ця логіка тепер централізована в `uiService.js`, що робить її перевикористовуваною (наприклад, якщо ви захочете додати кнопку "Грати" в іншому місці) та легшою для тестування.

Після виконання цих кроків ваші компоненти стануть значно чистішими, а архітектура — більш структурованою та логічною.