Звісно. Цей рефакторинг спрямований на усунення дублювання логіки, пов'язаної з вибором та застосуванням ігрових режимів, яка зараз, ймовірно, розкидана між `MainMenu.svelte` та `GameModeModal.svelte`. Ми централізуємо цю логіку в `settingsStore.js`, оскільки саме він відповідає за налаштування гри.

---

### Детальний План: Рефакторинг дублювання логіки ігрових режимів

**Мета:** Створити єдину функцію `applyGameModePreset` всередині `settingsStore`, яка буде відповідати за зміну налаштувань відповідно до обраного режиму ("Новачок", "Розбійник", "Потужний"). Це дозволить уникнути дублювання коду та зробить логіку більш надійною та легкою для змін.

---

#### Крок 1: Створення централізованого методу в `settingsStore.js`

Ми додамо новий метод `applyGameModePreset` до нашого `settingsStore`. Цей метод буде приймати назву режиму і застосовувати відповідний набір налаштувань.

1.  **Відкрийте файл:** `src/lib/stores/settingsStore.js`
2.  **Додайте новий метод `applyGameModePreset`** всередину об'єкта `methods`:

    ```javascript
    // src/lib/stores/settingsStore.js
    import { writable, get } from 'svelte/store';
    import { modalStore } from '$lib/stores/modalStore.js'; // Імпортуємо modalStore
    // ... інші імпорти

    // ...

    function createSettingsStore() {
      const { subscribe, set, update } = writable(defaultSettings);

      const methods = {
        // ... існуючі методи (init, updateSettings, etc.) ...

        /**
         * Застосовує попередньо налаштований ігровий режим.
         * @param {'beginner' | 'experienced' | 'pro'} mode - Назва режиму.
         * @returns {boolean} - Повертає true, якщо потрібно показати FAQ.
         */
        applyGameModePreset(mode) {
          /** @type {Partial<SettingsState>} */
          let settingsToApply = { gameMode: mode };
          let showFaq = false;

          switch (mode) {
            case 'beginner':
              settingsToApply = { 
                gameMode: mode, 
                showBoard: true, 
                showQueen: true, 
                showMoves: true, 
                blockModeEnabled: false, 
                speechEnabled: false, 
                autoHideBoard: false 
              };
              // Показуємо FAQ тільки якщо користувач явно вибрав режим новачка
              showFaq = true; 
              break;
            case 'experienced':
              settingsToApply = { 
                gameMode: mode, 
                showBoard: true, 
                showQueen: true, 
                showMoves: true, 
                blockModeEnabled: false, 
                speechEnabled: true, 
                autoHideBoard: true 
              };
              break;
            case 'pro':
              settingsToApply = { 
                gameMode: mode, 
                showBoard: true, // Дошка показується на старті
                showQueen: true, // Ферзь теж
                showMoves: true, // І ходи
                blockModeEnabled: true, 
                blockOnVisitCount: 0, 
                speechEnabled: true, 
                autoHideBoard: true // Але автоматично ховається після ходу
              };
              break;
          }
          
          this.updateSettings(settingsToApply);
          modalStore.closeModal(); // Закриваємо модальне вікно вибору режиму
          return showFaq;
        }
      };

      return { subscribe, ...methods };
    }

    export const settingsStore = createSettingsStore();
    ```

**Пояснення:**
*   Ми створили єдиний метод `applyGameModePreset`, який інкапсулює всю логіку зміни налаштувань для кожного режиму.
*   Метод повертає `boolean` значення, що вказує, чи потрібно показувати додаткову інформацію (FAQ), що робить його більш гнучким.
*   Він також автоматично закриває модальне вікно, що спрощує код у компонентах.

---

#### Крок 2: Спрощення `GameModeModal.svelte`

Тепер компонент модального вікна буде лише викликати новий метод зі стору.

1.  **Відкрийте файл:** `src/lib/components/GameModeModal.svelte`
2.  **Оновіть скриптову частину:**

    **Було (приблизна логіка):**
    ```svelte
    <script>
      // ...
      function selectMode(mode) {
        // ... складна логіка з setBoardSize, goto, показом FAQ ...
      }
    </script>
    ```

    **Стане:**
    ```svelte
    <script>
      import { _ } from 'svelte-i18n';
      import { settingsStore } from '$lib/stores/settingsStore.js';
      import { modalStore } from '$lib/stores/modalStore.js';
      import { goto } from '$app/navigation';
      import { base } from '$app/paths';
      import { setBoardSize } from '$lib/services/gameLogicService.js'; // Оновлений шлях
      import { get } from 'svelte/store';
      import { gameState } from '$lib/stores/gameState.js';
      import DontShowAgainCheckbox from './DontShowAgainCheckbox.svelte';

      /**
       * @param {'beginner' | 'experienced' | 'pro'} mode
       */
      function selectMode(mode) {
        const shouldShowFaq = settingsStore.applyGameModePreset(mode);
        
        // Логіка зміни розміру дошки та навігації залишається,
        // оскільки вона специфічна для цього модального вікна
        const { score, penaltyPoints, boardSize } = get(gameState);
        if (score === 0 && penaltyPoints === 0 && boardSize !== 4) {
          setBoardSize(4);
          gotoAfterFaq();
        } else if (boardSize !== 4) {
          modalStore.showModal({
            titleKey: 'modal.resetScoreTitle',
            contentKey: 'modal.resetScoreContent',
            buttons: [
              {
                textKey: 'modal.resetScoreConfirm',
                customClass: 'green-btn',
                isHot: true,
                onClick: () => {
                  setBoardSize(4);
                  modalStore.closeModal();
                  gotoAfterFaq();
                }
              },
              { textKey: 'modal.resetScoreCancel', onClick: modalStore.closeModal }
            ]
          });
        } else {
          gotoAfterFaq();
        }

        function gotoAfterFaq() {
          if (shouldShowFaq) {
            setTimeout(() => {
              modalStore.showModal({
                titleKey: 'faq.title',
                content: { isFaq: true },
                buttons: [
                  { textKey: 'rulesPage.title', onClick: () => { goto(`${base}/rules`); modalStore.closeModal(); }, customClass: 'blue-btn' },
                  { textKey: 'modal.ok', primary: true, isHot: true, onClick: () => { modalStore.closeModal(); goto(`${base}/game`); } }
                ]
              });
            }, 100);
          } else {
            goto(`${base}/game`);
          }
        }
      }
    </script>
    <!-- Розмітка залишається без змін -->
    ```

**Пояснення:** Ми видалили дублювання логіки налаштувань. Компонент тепер викликає `settingsStore.applyGameModePreset(mode)` і використовує результат для подальших дій (показ FAQ, навігація).

#### Крок 3: Спрощення `uiService.js` (створеного на попередньому кроці)

`uiService` також використовував логіку застосування режиму за замовчуванням. Тепер він теж може використовувати новий метод.

1.  **Відкрийте файл:** `src/lib/services/uiService.js`
2.  **Оновіть функцію `navigateToGame`:**

    **Було:**
    ```javascript
    // ...
    if (get(settingsStore).showGameModeModal) {
      // ...
    } else {
      const currentMode = get(settingsStore).gameMode;
      if (!currentMode) {
        settingsStore.updateSettings({ gameMode: 'beginner', ... }); // Дублювання логіки
      }
      goto(`${base}/game`);
    }
    ```

    **Стане:**
    ```javascript
    // ...
    if (get(settingsStore).showGameModeModal) {
      modalStore.showModal({
        titleKey: 'gameModes.title',
        component: GameModeModal,
        closable: true
      });
    } else {
      const currentMode = get(settingsStore).gameMode;
      if (!currentMode) {
        // Просто викликаємо метод з пресетом за замовчуванням
        settingsStore.applyGameModePreset('beginner');
      }
      goto(`${base}/game`);
    }
    ```

**Результат:**
*   **DRY:** Логіка налаштування ігрових режимів тепер знаходиться в одному місці — `settingsStore.js`.
*   **SSoT:** `settingsStore` є єдиним джерелом правди про те, які налаштування відповідають якому режиму.
*   **Чистота коду:** Компоненти `MainMenu.svelte` та `GameModeModal.svelte` стали простішими, оскільки вони лише ініціюють дію, а не реалізують її логіку.

**Що протестувати:**
1.  **Вибір режиму з модального вікна:** Запустіть гру, у модальному вікні виберіть кожен з трьох режимів. Переконайтеся, що в налаштуваннях на сторінці гри встановлені правильні чекбокси.
2.  **Пропуск модального вікна:** Увімкніть "Більше не показувати". Вийдіть в головне меню. Натисніть "Грати проти комп'ютера". Переконайтеся, що ви одразу потрапили в гру з останнім обраним режимом.
3.  **Перший запуск (симуляція):** Очистіть `localStorage` (або принаймні `gameMode` та `showGameModeModal`). Зайдіть в головне меню і натисніть "Грати проти комп'ютера". Ви повинні побачити модальне вікно.