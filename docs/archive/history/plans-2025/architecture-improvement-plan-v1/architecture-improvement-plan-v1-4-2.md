Звісно. Цей етап спрямований на покращення читабельності та підтримуваності коду шляхом перенесення складної реактивної логіки з компонентів у `derived` стори. `derived` стори є ідеальним інструментом Svelte для обчислення значень, що залежать від одного або кількох інших сторів.

---

### Детальний План: Спрощення реактивності через `derived` стори

**Мета:** Зменшити кількість та складність реактивних блоків (`$:`) у Svelte-компонентах. Це робить компоненти більш декларативними ("що показувати"), а логіку обчислень — централізованою та перевикористовуваною.

---

### Аналіз поточного стану

На даний момент, після попередніх рефакторингів, ми вже винесли значну частину логіки. Однак, у нас залишилися деякі кандидати для перенесення.

**Кандидати на рефакторинг:**

1.  **`ControlsPanelWidget.svelte`:** Логіка розбиття кнопок відстані на рядки (`$: distanceRows`).
2.  **`MainMenu.svelte`:** Логіка визначення поточного SVG прапора (`$: currentFlagSvg`).
3.  **`GameBoard.svelte`:** Логіка визначення, чи потрібно автоматично ховати дошку (`$: shouldHideBoard`).

---

### Крок 1: Рефакторинг `ControlsPanelWidget.svelte`

**Задача:** Винести логіку розбиття кнопок відстані на рядки в `derived` стор.

1.  **Відкрийте файл:** `src/lib/stores/derivedState.ts`
2.  **Додайте новий `derived` стор:**

    ```typescript
    // src/lib/stores/derivedState.ts
    import { derived } from 'svelte/store';
    import { gameState } from './gameState';
    // ...

    /**
     * Обчислює масив доступних відстаней для поточного розміру дошки.
     * @type {import('svelte/store').Readable<number[]>}
     */
    export const availableDistances = derived(gameState, $gameState => 
      Array.from({ length: $gameState.boardSize - 1 }, (_, i) => i + 1)
    );

    /**
     * Розбиває кнопки відстаней на рядки для адаптивного відображення.
     * @type {import('svelte/store').Readable<number[][]>}
     */
    export const distanceRows = derived(availableDistances, $availableDistances => {
      const dists = $availableDistances;
      if (dists.length <= 4) return [dists];
      if (dists.length === 5 || dists.length === 6) return chunk(dists, 3);
      return chunk(dists, 4);
    });

    /**
     * @private
     * Допоміжна функція для розбиття масиву на частини.
     * @param {any[]} arr
     * @param {number} n
     */
    function chunk(arr: any[], n: number) {
      const res = [];
      for (let i = 0; i < arr.length; i += n) res.push(arr.slice(i, i + n));
      return res;
    }
    ```

3.  **Відкрийте файл:** `src/lib/components/widgets/ControlsPanelWidget.svelte`
4.  **Оновіть скриптову частину:**

    **Було:**
    ```svelte
    <script lang="ts">
      // ...
      const availableDistances = derived(gameState, $gameState => 
        Array.from({ length: $gameState.boardSize - 1 }, (_, i) => i + 1)
      );
      // ...
      $: distanceRows = (() => {
        const dists = $availableDistances;
        if (dists.length <= 4) return [dists];
        if (dists.length === 5 || dists.length === 6) return chunk(dists, 3);
        return chunk(dists, 4);
      })();
    </script>
    ```

    **Стане:**
    ```svelte
    <script lang="ts">
      // ...
      import { availableDistances, distanceRows } from '$lib/stores/derivedState.ts';
      // ...
      // Видаляємо $: distanceRows та const availableDistances
    </script>
    <!-- ... -->
    <div class="distance-btns">
      {#each $distanceRows as row} <!-- Змінюємо на $distanceRows -->
        <div class="distance-row">
          {#each row as dist}
            <button class="dist-btn {selectedDistance === dist ? 'active' : ''}" on:click={() => onDistanceClick(dist)}>{dist}</button>
          {/each}
        </div>
      {/each}
    </div>
    ```
    *Примітка: Можливо, знадобиться додати клас `distance-row` для коректного відображення рядків.*

---

### Крок 2: Рефакторинг `MainMenu.svelte`

**Задача:** Винести логіку визначення SVG поточного прапора в `derived` стор.

1.  **Відкрийте файл:** `src/lib/stores/derivedState.ts`
2.  **Додайте новий `derived` стор:**

    ```typescript
    // src/lib/stores/derivedState.ts
    import { appSettingsStore } from './appSettingsStore';
    // ...

    const languages = [
      { code: 'uk', svg: `<svg ... >...</svg>` },
      { code: 'en', svg: `<svg ... >...</svg>` },
      { code: 'crh', svg: `<svg ... >...</svg>` },
      { code: 'nl', svg: `<svg ... >...</svg>` }
    ];

    /**
     * Derived стор, що містить SVG поточного вибраного прапора.
     * @type {import('svelte/store').Readable<string>}
     */
    export const currentLanguageFlagSvg = derived(
      appSettingsStore,
      $appSettingsStore => {
        return languages.find(lang => lang.code === $appSettingsStore.language)?.svg || languages[0].svg;
      }
    );
    ```
    *Примітка: вам потрібно буде скопіювати масив `languages` з `MainMenu.svelte` в `derivedState.ts`.*

3.  **Відкрийте файл:** `src/lib/components/MainMenu.svelte`
4.  **Оновіть скриптову частину:**

    **Було:**
    ```svelte
    <script>
      // ...
      const languages = [ /* ... */ ];
      $: settings = $appSettingsStore;
      $: currentFlagSvg = languages.find(lang => lang.code === $appSettingsStore.language)?.svg || languages[0].svg;
    </script>
    <!-- ... -->
    <button ...>
      <span class="main-menu-icon-inner">
        {@html currentFlagSvg}
      </span>
    </button>
    ```

    **Стане:**
    ```svelte
    <script>
      import { currentLanguageFlagSvg } from '$lib/stores/derivedState.ts';
      // ...
      // Видаляємо const languages та $: currentFlagSvg
    </script>
    <!-- ... -->
    <button ...>
      <span class="main-menu-icon-inner">
        {@html $currentLanguageFlagSvg}
      </span>
    </button>
    ```

---

### Крок 3: Рефакторинг `GameBoard.svelte`

**Задача:** Винести логіку `shouldHideBoard` в `derived` стор.

1.  **Відкрийте файл:** `src/lib/stores/derivedState.ts`
2.  **Додайте новий `derived` стор:**

    ```typescript
    // src/lib/stores/derivedState.ts
    import { appSettingsStore } from './appSettingsStore';
    import { gameState } from './gameState';
    // ...

    /**
     * Визначає, чи потрібно приховати дошку після ходу гравця.
     * @type {import('svelte/store').Readable<boolean>}
     */
    export const shouldHideBoard = derived(
      [appSettingsStore, gameState],
      ([$appSettingsStore, $gameState]) => {
        if (!$appSettingsStore.autoHideBoard) return false;
        const lastMove = $gameState.moveQueue?.[$gameState.moveQueue.length - 1];
        return lastMove?.player === 1;
      }
    );
    ```

3.  **Відкрийте файл:** `src/lib/components/GameBoard.svelte`
4.  **Оновіть скриптову частину:**

    **Було:**
    ```svelte
    <script lang="ts">
      // ...
      const shouldHideBoard = derived([
        appSettingsStore,
        gameState
      ], ([$appSettingsStore, $gameState]) => {
        if (!$appSettingsStore.autoHideBoard) return false;
        const lastMove = $gameState.moveQueue?.[$gameState.moveQueue.length - 1];
        return lastMove && lastMove.player === 1;
      });
    </script>
    <!-- ... -->
    <div class="board-bg-wrapper game-content-block{ $shouldHideBoard ? ' hidden' : '' }" ...>
    ```

    **Стане:**
    ```svelte
    <script lang="ts">
      import { shouldHideBoard } from '$lib/stores/derivedState.ts';
      // ...
      // Видаляємо const shouldHideBoard = derived(...)
    </script>
    <!-- ... -->
    <div class="board-bg-wrapper game-content-block" class:hidden={$shouldHideBoard} ...>
    ```
    *Примітка: використання директиви `class:hidden` є більш ідіоматичним для Svelte.*

---

### Результат та Перевірка

-   **Чисті компоненти:** Компоненти тепер майже не містять логіки обчислень, що робить їхній код значно коротшим і зрозумілішим.
-   **Централізована логіка:** Вся похідна логіка тепер знаходиться в `derivedState.ts`. Якщо вам потрібно змінити, як розраховується стан кнопок або коли ховається дошка, ви знаєте, куди йти.
-   **Перевикористання:** Створені `derived` стори (наприклад, `availableDistances`) можна легко використовувати в інших компонентах, якщо це знадобиться, без дублювання коду.

**Що протестувати:**
1.  **Кнопки відстані:** Змінюйте розмір дошки і перевіряйте, що кількість кнопок та їх розбивка на рядки змінюється коректно.
2.  **Прапор мови:** Змінюйте мову в налаштуваннях і перевіряйте, що іконка прапора в `MainMenu` оновлюється.
3.  **Автоматичне приховування дошки:** Увімкніть відповідний чекбокс і зробіть хід. Переконайтеся, що дошка зникає.