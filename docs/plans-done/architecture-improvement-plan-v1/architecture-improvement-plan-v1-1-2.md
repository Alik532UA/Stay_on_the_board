**Головна ідея:** `animationStore` перестане бути простою копією даних. Він стане незалежним "анімаційним двигуном", який слухає "накази" (`moveQueue` з `gameState`) і відтворює їх візуально у власному темпі, не втручаючись у логіку гри.

---

### Детальний План: Рефакторинг `animationStore`

**Мета:** Перетворити `animationStore` на самодостатній сервіс, який керує візуальним станом дошки, і зробити `BoardWrapperWidget` залежним виключно від нього.

---

#### Крок 1: Перетворення `animationStore` на сервіс

Ми змінимо структуру файлу `animationStore.js`, щоб він експортував об'єкт-сервіс, який інкапсулює всю логіку анімації.

1.  **Відкрийте файл:** `src/lib/stores/animationStore.js`
2.  **Повністю замініть його вміст** на наступний код:

    ```javascript
    // src/lib/stores/animationStore.js
    import { writable, get } from 'svelte/store';
    import { gameState } from './gameState.js';

    /**
     * @typedef {Object} VisualState
     * @property {number | null} visualRow - Поточна ВІЗУАЛЬНА позиція ферзя (рядок).
     * @property {number | null} visualCol - Поточна ВІЗУАЛЬНА позиція ферзя (стовпець).
     * @property {import('./gameState').CellVisitCounts} visualCellVisitCounts - ВІЗУАЛЬНИЙ стан клітинок.
     * @property {boolean} showAvailableMoveDots - Чи показувати точки доступних ходів.
     * @property {number} gameId - ID поточної гри для коректного скидання.
     * @property {boolean} isAnimating - Прапорець, що показує, чи триває зараз анімація.
     */

    /**
     * Створює сервіс, що керує анімацією на дошці.
     * @returns {{subscribe: import('svelte/store').Readable<VisualState>['subscribe']}}
     */
    function createAnimationService() {
      const initialGameState = get(gameState);

      /** @type {import('svelte/store').Writable<VisualState>} */
      const { subscribe, set, update } = writable({
        visualRow: initialGameState.playerRow,
        visualCol: initialGameState.playerCol,
        visualCellVisitCounts: { ...initialGameState.cellVisitCounts },
        showAvailableMoveDots: true,
        gameId: initialGameState.gameId,
        isAnimating: false,
      });

      let lastProcessedMoveIndex = initialGameState.moveQueue.length;

      // Підписуємося на зміни в основному стані гри
      gameState.subscribe(currentState => {
        const visualState = get({ subscribe });

        // Сценарій 1: Почалася абсолютно нова гра (ID змінився)
        if (currentState.gameId !== visualState.gameId) {
          lastProcessedMoveIndex = 0;
          set({
            visualRow: currentState.playerRow,
            visualCol: currentState.playerCol,
            visualCellVisitCounts: {}, // Починаємо з чистого стану
            showAvailableMoveDots: false, // Спершу ховаємо
            gameId: currentState.gameId,
            isAnimating: false,
          });
          // Показуємо точки після короткої паузи, щоб збігтися з анімацією появи ферзя
          setTimeout(() => {
            update(v => ({ ...v, showAvailableMoveDots: true, visualCellVisitCounts: { ...currentState.cellVisitCounts } }));
          }, 550);
          return;
        }

        // Сценарій 2: З'явилися нові ходи в черзі, і ми не анімуємо
        if (currentState.moveQueue.length > lastProcessedMoveIndex && !visualState.isAnimating) {
          processQueue();
        }
      });

      function processQueue() {
        const currentGameState = get(gameState);
        const queue = currentGameState.moveQueue;

        if (lastProcessedMoveIndex >= queue.length) {
          update(v => ({ ...v, isAnimating: false, showAvailableMoveDots: true }));
          return; // Черга оброблена
        }

        update(v => ({ ...v, isAnimating: true, showAvailableMoveDots: false }));

        const nextMoveInHistory = currentGameState.moveHistory[lastProcessedMoveIndex + 1];

        if (nextMoveInHistory) {
          // Оновлюємо візуальний стан для наступного кроку анімації
          update(v => ({
            ...v,
            visualRow: nextMoveInHistory.pos.row,
            visualCol: nextMoveInHistory.pos.col,
          }));

          // Затримка, що імітує анімацію
          setTimeout(() => {
            // Оновлюємо стан клітинок ПІСЛЯ анімації руху
            update(v => ({ ...v, visualCellVisitCounts: nextMoveInHistory.visits || {} }));
            lastProcessedMoveIndex++;
            processQueue(); // Рекурсивно викликаємо для наступного елемента черги
          }, 600); // Тривалість анімації + буфер
        } else {
          // Аварійне завершення, якщо щось пішло не так
          update(v => ({ ...v, isAnimating: false, showAvailableMoveDots: true }));
        }
      }

      return {
        subscribe,
      };
    }

    export const animationStore = createAnimationService();
    ```

**Пояснення:**
*   Ми створили сервіс, який експортує лише метод `subscribe`, роблячи його `readable` для зовнішнього світу.
*   Внутрішній стан тепер має префікс `visual` (`visualRow`, `visualCellVisitCounts`), щоб чітко відрізняти його від логічного стану в `gameState`.
*   Сервіс сам підписується на `gameState` і реагує на зміни в `moveQueue`, запускаючи послідовну анімацію через `processQueue`.
*   Він **ніколи не записує нічого назад** у `gameState`.

---

#### Крок 2: Адаптація `BoardWrapperWidget.svelte`

Тепер ми зробимо так, щоб компонент дошки отримував усі візуальні дані виключно з нашого нового `animationStore`.

1.  **Відкрийте файл:** `src/lib/components/widgets/BoardWrapperWidget.svelte`
2.  **Змініть імпорти та реактивні змінні:**

    **Було:**
    ```svelte
    <script lang="ts">
      import { gameState } from '$lib/stores/gameState.js';
      import { animationStore } from '$lib/stores/animationStore.js'; // Старий імпорт
      // ... інші імпорти
      const boardSize = derived(gameState, $gameState => Number($gameState.boardSize));
      // ...
      function isAvailable(row: number, col: number) {
        return $settingsStore.showMoves && $animationStore.showAvailableMoveDots && $gameState.availableMoves && $gameState.availableMoves.some(move => move.row === row && move.col === col);
      }
      // ...
    </script>
    ```

    **Стане:**
    ```svelte
    <script lang="ts">
      import { gameState } from '$lib/stores/gameState.js'; // Залишаємо тільки для gameId та boardSize
      import { animationStore } from '$lib/stores/animationStore.js'; // Новий імпорт
      // ... інші імпорти
      const boardSize = derived(gameState, $gameState => Number($gameState.boardSize));
      // ...
      function isAvailable(row: number, col: number) {
        // Тепер залежить ТІЛЬКИ від animationStore та settingsStore
        return $settingsStore.showMoves && $animationStore.showAvailableMoveDots && get(gameState).availableMoves && get(gameState).availableMoves.some(move => move.row === row && move.col === col);
      }
      // ...
    </script>
    ```

3.  **Оновіть розмітку (template):**
    *   Замініть усі посилання на `$gameState` для візуальних елементів на посилання на `$animationStore`.

    **Було:**
    ```svelte
    <!-- ... -->
    <div
      class="board-cell {getDamageClass(rowIdx, colIdx, $animationStore.cellVisitCounts, $settingsStore)}"
      class:blocked-cell={isCellBlocked(rowIdx, colIdx, $animationStore.cellVisitCounts, $settingsStore)}
      <!-- ... -->
    >
      {#if isCellBlocked(rowIdx, colIdx, $animationStore.cellVisitCounts, $settingsStore)}
        <!-- ... -->
      {/if}
    </div>
    <!-- ... -->
    {#if $settingsStore.showQueen && $animationStore.row !== null && $animationStore.col !== null}
      <div class="player-piece"
        style="top: {$animationStore.row * (100 / $boardSize)}%; left: {$animationStore.col * (100 / $boardSize)}%; z-index: 10;">
        <!-- ... -->
      </div>
    {/if}
    <!-- ... -->
    ```

    **Стане:**
    ```svelte
    <!-- ... -->
    <div
      class="board-cell {getDamageClass(rowIdx, colIdx, $animationStore.visualCellVisitCounts, $settingsStore)}"
      class:blocked-cell={isCellBlocked(rowIdx, colIdx, $animationStore.visualCellVisitCounts, $settingsStore)}
      <!-- ... -->
    >
      {#if isCellBlocked(rowIdx, colIdx, $animationStore.visualCellVisitCounts, $settingsStore)}
        <!-- ... -->
      {/if}
    </div>
    <!-- ... -->
    {#if $settingsStore.showQueen && $animationStore.visualRow !== null && $animationStore.visualCol !== null}
      <div class="player-piece"
        style="top: {$animationStore.visualRow * (100 / $boardSize)}%; left: {$animationStore.visualCol * (100 / $boardSize)}%; z-index: 10;">
        <!-- ... -->
      </div>
    {/if}
    <!-- ... -->
    ```

**Пояснення:**
*   Ми повністю розірвали прямий зв'язок між візуалізацією позиції ферзя/клітинок та логічним станом гри.
*   Тепер `BoardWrapperWidget` є "тупим" компонентом, який просто рендерить те, що йому каже `animationStore`.
