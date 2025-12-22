
### Детальний План: Централізація логіки в `GameOrchestrator`

**Мета:** Створити єдину точку входу для всіх ігрових дій, ізолювати побічні ефекти (озвучення) від чистої логіки зміни стану та забезпечити правильну послідовність асинхронних операцій (хід комп'ютера).

---

#### Крок 1: Перетворення `gameOrchestrator.js` на сервіс

Ми змінимо структуру файлу, щоб він експортував єдиний об'єкт-сервіс.

1.  **Відкрийте файл:** `src/lib/gameOrchestrator.js`
2.  **Повністю замініть його вміст** на наступний код. Ми переносимо існуючі функції всередину об'єкта і додаємо нові.

    ```javascript
    // src/lib/gameOrchestrator.js
    import { get } from 'svelte/store';
    import { gameState } from './stores/gameState.js';
    import { playerInputStore } from './stores/playerInputStore.js';
    import * as gameActions from './stores/gameActions.js';
    import { appSettingsStore } from './stores/appSettingsStore.js';
    import { modalService } from '$lib/services/modalService.js';
    import { agents } from './playerAgents.js';
    import * as core from './gameCore.js';
    import { speakText, langMap } from '$lib/services/speechService.js';
    import { _ as t } from 'svelte-i18n';
    import { logService } from '$lib/services/logService.js';

    /**
     * Сервіс, що керує ігровим процесом.
     * Він є єдиною точкою входу для дій гравця та координує
     * оновлення стану, хід комп'ютера та побічні ефекти.
     */
    export const gameOrchestrator = {
      /**
       * Гравець підтверджує свій хід.
       */
      confirmPlayerMove() {
        const { selectedDirection, selectedDistance, isMoveInProgress } = get(playerInputStore);
        if (isMoveInProgress) return;

        playerInputStore.update(s => ({ ...s, isMoveInProgress: true }));

        const state = get(gameState);
        const { playerRow, playerCol, boardSize } = state;
        const { blockModeEnabled } = get(appSettingsStore);

        if (!selectedDirection || !selectedDistance || playerRow === null || playerCol === null) {
          playerInputStore.update(s => ({ ...s, isMoveInProgress: false }));
          return;
        }

        const [dr, dc] = core.dirMap[selectedDirection];
        const newRow = playerRow + dr * selectedDistance;
        const newCol = playerCol + dc * selectedDistance;

        gameState.update(s => ({
          ...s,
          moveQueue: [...s.moveQueue, { player: 1, direction: selectedDirection, distance: selectedDistance }]
        }));

        const visitCount = get(gameState).cellVisitCounts[`${newRow}-${newCol}`] || 0;
        const isCellBlocked = blockModeEnabled && visitCount > get(appSettingsStore).blockOnVisitCount;
        const isOutsideBoard = newRow < 0 || newRow >= boardSize || newCol < 0 || newCol >= boardSize;

        if (isOutsideBoard || isCellBlocked) {
          gameActions.performMove(newRow, newCol);
          gameActions.endGame(isOutsideBoard ? 'modal.gameOverReasonOut' : 'modal.gameOverReasonBlocked');
          playerInputStore.update(s => ({ ...s, isMoveInProgress: false }));
          return;
        }

        gameActions.processPlayerMove(playerRow, playerCol, newRow, newCol);
        gameActions.performMove(newRow, newCol);

        playerInputStore.update(s => ({ ...s, selectedDirection: null, selectedDistance: null, distanceManuallySelected: false }));
        gameState.update(s => ({ ...s, currentPlayerIndex: 1 }));
        
        this._triggerComputerMove(); // Викликаємо внутрішній метод
        playerInputStore.update(s => ({ ...s, isMoveInProgress: false }));
      },

      /**
       * Гравець заявляє, що у нього немає ходів.
       */
      claimNoMoves() {
        const state = get(gameState);
        if (state.availableMoves.length === 0) {
          gameState.update(s => ({ ...s, noMovesClaimsCount: (s.noMovesClaimsCount || 0) + 1 }));
          gameActions.endGame('modal.playerNoMovesContent');
        } else {
          gameActions.endGame('modal.errorContent', { count: state.availableMoves.length });
        }
      },

      /**
       * @private
       * Запускає логіку ходу комп'ютера.
       */
      async _triggerComputerMove() {
        const current = get(gameState);
        if (current.isGameOver || current.players[current.currentPlayerIndex]?.type !== 'ai') return;

        try {
          const move = await agents.ai.getMove(current);
          if (move) {
            gameState.update(state => ({
              ...state,
              moveQueue: [...state.moveQueue, { player: 2, direction: move.direction, distance: move.distance }]
            }));

            gameActions.performMove(move.row, move.col);
            this._handleComputerMoveSideEffects(move); // Виносимо побічні ефекти
            
            gameActions.updateAvailableMoves();
            gameState.update(state => ({ ...state, currentPlayerIndex: 0 }));
          } else {
            gameState.update(s => ({ ...s, finishedByNoMovesButton: true }));
            gameActions.endGame('modal.computerNoMovesContent');
          }
        } catch (error) {
          const err = error instanceof Error ? error : new Error(String(error));
          logService.addLog(`Error in _triggerComputerMove: ${err.message}`, 'error');
          modalService.showModal({
            titleKey: 'modal.errorTitle',
            content: 'Виникла помилка під час ходу комп\'ютера.',
          });
        }
      },

      /**
       * @private
       * Обробляє побічні ефекти ходу комп'ютера (озвучення).
       * @param {any} move
       */
      _handleComputerMoveSideEffects(move) {
        const latestSettings = get(appSettingsStore);
        if (latestSettings.speechEnabled) {
          let speechLang = langMap[/** @type {keyof typeof langMap} */(latestSettings.language)] || 'uk-UA';
          let speechVoice = latestSettings.selectedVoiceURI ?? null;
          let allVoices = (typeof window !== 'undefined' && 'speechSynthesis' in window) ? window.speechSynthesis.getVoices() : [];
          let selectedVoiceObj = speechVoice ? allVoices.find(v => v.voiceURI === speechVoice) : null;
          if (!selectedVoiceObj) {
            const fallbackVoices = allVoices.filter(v => v.lang === speechLang);
            if (!fallbackVoices.length) {
              const enVoices = allVoices.filter(v => v.lang.startsWith('en'));
              if (enVoices.length) {
                speechLang = 'en-US';
                speechVoice = enVoices[0].voiceURI;
              }
            }
          } else {
            speechLang = selectedVoiceObj.lang;
          }
          
          let textToSpeak = '';
          if (speechLang.startsWith('en')) {
            const directionEn = {
              'up-left': 'up left', 'up': 'up', 'up-right': 'up right',
              'left': 'left', 'right': 'right',
              'down-left': 'down left', 'down': 'down', 'down-right': 'down right'
            };
            textToSpeak = `${move.distance} ${directionEn[String(move.direction)] ?? move.direction}.`;
          } else {
            const $t = get(t);
            const directionText = $t(`speech.directions.${move.direction}`) || move.direction;
            textToSpeak = `${move.distance} ${directionText}.`;
          }
          speakText(textToSpeak, speechLang, speechVoice);
        }
      }
    };
    ```

**Пояснення:**
*   Ми створили об'єкт `gameOrchestrator`, який тепер містить всю логіку керування.
*   Функція `triggerComputerMove` стала приватним методом `_triggerComputerMove`.
*   Побічні ефекти (озвучення) винесені в окремий приватний метод `_handleComputerMoveSideEffects`, що робить основний потік чистішим.
*   Ми більше не експортуємо `computerLastMoveDisplayStore`, оскільки він був видалений на попередньому кроці.

---

#### Крок 2: Оновлення компонентів-викликачів

Тепер потрібно оновити компоненти, які раніше викликали функції напряму, щоб вони використовували методи нашого нового сервісу.

1.  **Відкрийте файл:** `src/lib/components/widgets/ControlsPanelWidget.svelte`
2.  **Змініть імпорти та виклики:**

    **Було:**
    ```svelte
    <script lang="ts">
      import { confirmPlayerMove, claimNoMoves } from '$lib/gameOrchestrator.js';
      // ...
      function onCentralClick() { if (selectedDirection && selectedDistance && isPlayerTurn) confirmPlayerMove(); }
      // ...
    </script>
    <!-- ... -->
    <button
      class="confirm-btn{buttonDisabled ? ' disabled' : ''}"
      on:click={onConfirmClick}
      <!-- ... -->
    >
    <!-- ... -->
    <button class="no-moves-btn" on:click={claimNoMoves} ...>
    ```

    **Стане:**
    ```svelte
    <script lang="ts">
      import { gameOrchestrator } from '$lib/gameOrchestrator.js'; // <-- ЗМІНА ТУТ
      // ...
      function onCentralClick() { if (selectedDirection && selectedDistance && isPlayerTurn) gameOrchestrator.confirmPlayerMove(); } // <-- ЗМІНА ТУТ
      // ...
      function onConfirmClick() {
        if (buttonDisabled) {
          // ...
          return;
        }
        gameOrchestrator.confirmPlayerMove(); // <-- ЗМІНА ТУТ
      }
    </script>
    <!-- ... -->
    <button
      class="confirm-btn{buttonDisabled ? ' disabled' : ''}"
      on:click={onConfirmClick}
      <!-- ... -->
    >
    <!-- ... -->
    <button class="no-moves-btn" on:click={gameOrchestrator.claimNoMoves} ...> <!-- <-- ЗМІНА ТУТ -->
    ```

3.  **Відкрийте файл:** `src/lib/stores/gameActions.ts`
4.  **Видаліть експорти `confirmPlayerMove` та `claimNoMoves`**, якщо вони там ще залишились. Ці функції тепер є частиною оркестратора.

---

### Результат та Перевірка

Після цих змін:

-   **Централізоване керування:** Усі дії гравця проходять через `gameOrchestrator`. Це єдине місце, яке ініціює зміни в ігровому циклі.
-   **Ізоляція побічних ефектів:** Логіка озвучення тепер чітко відокремлена і знаходиться всередині оркестратора, а не в `gameActions`, які мають бути чистими.
-   **Покращена читабельність:** Код стає більш структурованим. `gameActions` відповідає за те, *як* змінити стан, а `gameOrchestrator` — за те, *коли* і в *якій послідовності* це робити.
