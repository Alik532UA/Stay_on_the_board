Покроковий план для рефакторингу `playerInputStore`.

Цей план розроблено з урахуванням ваших головних вимог:

1.  **Безпека:** Кожен крок мінімізує ризик поломки. Ми спочатку створюємо нову логіку, потім переключаємо на неї, і лише в кінці видаляємо стару.
2.  **Ізоляція:** Зміни не торкнуться візуалізації дошки (`GameBoard`, `animationStore`). Вони стосуються лише логіки стану та компонента, що його відображає (`ControlsPanelWidget`).
3.  **Дотримання архітектури:** Цей рефакторинг є ключовим кроком до посилення SSoT (Single Source of Truth) та UDF (Unidirectional Data Flow).

---

### Детальний План: Рефакторинг `playerInputStore`

**Мета:** Зробити `gameState.moveQueue` єдиним джерелом правди про останній хід комп'ютера, видаливши дублюючий стан з `playerInputStore`.

---

#### Крок 1: Створення нового `derived` стору

Ми створимо новий стор, який буде автоматично обчислювати останній хід комп'ютера, базуючись на черзі ходів у `gameState`. Це ідеальний приклад використання `derived` стору, оскільки він лише читає дані з SSoT і не може їх змінювати.

1.  **Створіть новий файл:** `src/lib/stores/derivedState.ts`
2.  **Додайте в нього наступний код:**

    ```typescript
    // src/lib/stores/derivedState.ts
    import { derived } from 'svelte/store';
    import { gameState } from './gameState';
    import type { GameState } from './gameState';
    import type { Direction } from '$lib/gameCore';

    /**
     * @typedef {object} ComputerMove
     * @property {Direction} direction
     * @property {number} distance
     */

    /**
     * Derived store, що завжди містить останній хід комп'ютера.
     * Він автоматично оновлюється, коли змінюється gameState.moveQueue.
     * @type {import('svelte/store').Readable<ComputerMove | null>}
     */
    export const lastComputerMove = derived(
      gameState,
      ($gameState: GameState) => {
        // Шукаємо з кінця черги останній хід, зроблений гравцем 2 (AI)
        for (let i = $gameState.moveQueue.length - 1; i >= 0; i--) {
          const move = $gameState.moveQueue[i];
          if (move.player === 2) {
            return { 
              direction: move.direction as Direction, 
              distance: move.distance 
            };
          }
        }
        return null; // Якщо комп'ютер ще не ходив
      }
    );
    ```

**Пояснення:** Цей код створює `lastComputerMove`, який завжди буде актуальним, оскільки він напряму залежить від `gameState`. Тепер нам не потрібно вручну оновлювати стан в іншому місці.

---

#### Крок 2: Оновлення компонента `ControlsPanelWidget.svelte`

Тепер ми переключимо компонент, що відображає хід, з `playerInputStore` на наш новий `derived` стор.

1.  **Відкрийте файл:** `src/lib/components/widgets/ControlsPanelWidget.svelte`
2.  **Змініть імпорти:**
    *   Видаліть `computerLastMoveDisplayStore` з `gameOrchestrator`.
    *   Додайте імпорт нашого нового стору `lastComputerMove`.

    **Було:**
    ```javascript
    import { computerLastMoveDisplayStore } from '$lib/gameOrchestrator.js';
    ```

    **Стане:**
    ```javascript
    import { lastComputerMove } from '$lib/stores/derivedState.ts';
    ```

3.  **Оновіть реактивний блок `centerInfoState`:**
    *   Замініть використання `$computerLastMoveDisplayStore` на `$lastComputerMove`. Логіка всередині залишається майже такою ж.

    **Було:**
    ```javascript
    $: centerInfoState = (() => {
      const computerMove = $computerLastMoveDisplayStore;

      if (computerMove) {
        // ... логіка ...
      }
      // ... інша логіка ...
    })();
    ```

    **Стане:**
    ```javascript
    $: centerInfoState = (() => {
      const computerMove = $lastComputerMove; // <-- ЗМІНА ТУТ

      if (computerMove) {
        const dir = isDirectionKey(computerMove.direction) ? directionArrows[computerMove.direction] : '';
        const dist = computerMove.distance || '';
        return { class: 'computer-move-display', content: `${dir}${dist}`, clickable: false, aria: `Хід комп'ютера: ${dir}${dist}` };
      }
      // ... інша логіка залишається без змін ...
    })();
    ```

**Пояснення:** Компонент тепер отримує дані про хід комп'ютера з надійного, похідного джерела.

---

#### Крок 3: Видалення застарілої логіки запису

На цьому кроці ми прибираємо код, який вручну записував `lastComputerMove` у `playerInputStore` та `computerLastMoveDisplayStore`, оскільки це більше не потрібно.

1.  **Відкрийте файл:** `src/lib/gameOrchestrator.js`
2.  **Знайдіть функцію `triggerComputerMove`:**
    *   Видаліть рядки, що оновлюють `computerLastMoveDisplayStore` та `playerInputStore`.

    **Було:**
    ```javascript
    // ...
    if (move) {
      // Усі наступні дії - синхронні
      computerLastMoveDisplayStore.set({ direction: move.direction, distance: move.distance }); // <-- ВИДАЛИТИ
      playerInputStore.update(s => ({ ...s, lastComputerMove: { direction: move.direction, distance: move.distance } })); // <-- ВИДАЛИТИ
      gameState.update(state => ({
        ...state,
        moveQueue: [...state.moveQueue, { player: 2, direction: move.direction, distance: move.distance }]
      }));
    // ...
    ```

    **Стане:**
    ```javascript
    // ...
    if (move) {
      // Усі наступні дії - синхронні
      gameState.update(state => ({
        ...state,
        moveQueue: [...state.moveQueue, { player: 2, direction: move.direction, distance: move.distance }]
      }));
    // ...
    ```

3.  **Знайдіть функцію `confirmPlayerMove`:**
    *   Видаліть рядок, що очищує `computerLastMoveDisplayStore`.

    **Було:**
    ```javascript
    // ...
    if (isOutsideBoard || isCellBlocked) {
      // ...
      computerLastMoveDisplayStore.set(null); // <-- ВИДАЛИТИ
      endGame(isOutsideBoard ? 'modal.gameOverReasonOut' : 'modal.gameOverReasonBlocked');
      // ...
    }
    // ...
    ```

    **Стане:**
    ```javascript
    // ...
    if (isOutsideBoard || isCellBlocked) {
      // ...
      endGame(isOutsideBoard ? 'modal.gameOverReasonOut' : 'modal.gameOverReasonBlocked');
      // ...
    }
    // ...
    ```

**Пояснення:** Ми прибрали ручне керування станом. Тепер `gameState.moveQueue` є єдиним місцем, куди записується інформація про хід, а всі залежні частини оновлюються автоматично.

---

#### Крок 4: Очищення `playerInputStore` та `gameOrchestrator`

Фінальний крок — прибираємо властивість `lastComputerMove` з визначення `playerInputStore`.

1.  **Відкрийте файл:** `src/lib/stores/playerInputStore.js`
2.  **Оновіть JSDoc та `initialState`:**

    **Було:**
    ```javascript
    /**
     * @typedef {Object} PlayerInputState
     * @property {Direction | null} selectedDirection
     * @property {number | null} selectedDistance
     * @property {boolean} distanceManuallySelected
     * @property {ComputerMove | null} lastComputerMove // <-- ВИДАЛИТИ
     * @property {boolean} isMoveInProgress
     */

    /** @type {PlayerInputState} */
    const initialState = {
      // ...
      lastComputerMove: null, // <-- ВИДАЛИТИ
      isMoveInProgress: false,
    };
    ```

    **Стане:**
    ```javascript
    /**
     * @typedef {Object} PlayerInputState
     * @property {Direction | null} selectedDirection
     * @property {number | null} selectedDistance
     * @property {boolean} distanceManuallySelected
     * @property {boolean} isMoveInProgress
     */

    /** @type {PlayerInputState} */
    const initialState = {
      selectedDirection: null,
      selectedDistance: null,
      distanceManuallySelected: false,
      isMoveInProgress: false,
    };
    ```

3.  **Відкрийте файл:** `src/lib/gameOrchestrator.js`
4.  **Видаліть `computerLastMoveDisplayStore`:**
    *   Видаліть весь блок коду, що створює цей стор. Він більше не потрібен.

    **Видалити:**
    ```javascript
    /**
     * @typedef {{direction: string, distance: number} | null} ComputerLastMoveDisplay
     */
    /** @type {import('svelte/store').Writable<ComputerLastMoveDisplay>} */
    export const computerLastMoveDisplayStore = writable(null);
    ```

---

### Результат та Перевірка

Після виконання цих кроків:

-   `playerInputStore` буде відповідати своїй назві і міститиме лише тимчасовий стан вводу гравця.
-   Джерело правди про останній хід комп'ютера буде єдиним — `gameState.moveQueue`.
-   Ризик розсинхронізації стану буде усунуто.
-   Код стане чистішим і більш передбачуваним.

**Наступні кроки:**

1.  Запустіть гру (`npm run dev`).
2.  Перевірте, що `center-info` коректно відображає хід комп'ютера після вашого ходу.
3.  Перевірте, що `center-info` очищується, коли ви починаєте вибирати свій наступний хід (натискаєте на стрілку або відстань).
4.  Перевірте, що штраф за дзеркальний хід все ще нараховується правильно (для цього потрібно буде оновити логіку в `processPlayerMove`, щоб вона також використовувала новий `derived` стор `lastComputerMove`).

Цей останній пункт важливий. Давайте я одразу покажу, як це зробити в `gameActions.ts`:

1.  **Відкрийте:** `src/lib/stores/gameActions.ts`
2.  **Знайдіть:** `processPlayerMove`
3.  **Змініть:**

    **Було:**
    ```typescript
    import { playerInputStore } from './playerInputStore.js';
    // ...
    export function processPlayerMove(...) {
      // ...
      const { lastComputerMove, ... } = get(playerInputStore);
      // ...
    }
    ```

    **Стане:**
    ```typescript
    import { lastComputerMove } from './derivedState.ts'; // <-- НОВИЙ ІМПОРТ
    // ...
    export function processPlayerMove(...) {
      // ...
      const computerMove = get(lastComputerMove); // <-- ВИКОРИСТОВУЄМО DERIVED СТОР
      const { selectedDistance, selectedDirection } = get(playerInputStore);
      // ...
      let penaltyChange = 0;
      if (
        !settings.blockModeEnabled &&
        computerMove && // <-- ЗМІНА ТУТ
        selectedDirection === core.oppositeDirections[computerMove.direction] && // <-- ЗМІНА ТУТ
        selectedDistance != null &&
        selectedDistance <= computerMove.distance // <-- ЗМІНА ТУТ
      ) {
        penaltyChange = 2;
      }
      // ...
    }
    ```
