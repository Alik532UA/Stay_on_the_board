Звісно, ось детальний покроковий план рефакторингу компонента `BoardWrapperWidget.svelte`.

# План рефакторингу компонента `BoardWrapperWidget.svelte`

**Мета:** Спростити компонент `BoardWrapperWidget.svelte`, винісши логіку визначення видимості дошки в централізований обчислюваний стор (`derived store`). Це покращить читабельність коду, посилить принцип єдиного джерела правди (SSoT) та зробить компонент більш сфокусованим на відображенні.

**Поточний стан:** Компонент містить локальний `derived` стор (`shouldHideBoard`), який обчислює, чи потрібно приховувати дошку. Цю логіку необхідно перенести у `$lib/stores/derivedState.ts`.

---

### Крок 1: Створення або верифікація обчислюваного стору в `derivedState.ts`

Логіка, яка зараз знаходиться всередині компонента, має бути перенесена у центральний файл з обчислюваними сторами, щоб її можна було перевикористовувати та тестувати окремо.

- [ ] **Оновити файл `$lib/stores/derivedState.ts`.**
    Додайте новий `derived` стор `shouldHideBoard`, який буде залежати від `appSettingsStore` та `gameState`.

    **Код для додавання у `src/lib/stores/derivedState.ts`:**
    ```typescript
    import { derived } from 'svelte/store';
    import { appSettingsStore } from './appSettingsStore';
    import { gameState } from './gameState';
    // ... інші імпорти та стори ...

    /**
     * Визначає, чи потрібно приховати дошку після ходу гравця.
     * @type {import('svelte/store').Readable<boolean>}
     */
    export const shouldHideBoard = derived(
      [appSettingsStore, gameState],
      ([$appSettingsStore, $gameState]) => {
        // Якщо опція автоматичного приховування вимкнена, дошку не ховаємо
        if (!$appSettingsStore.autoHideBoard) {
          return false;
        }
        
        // Знаходимо останній хід у черзі анімації
        const lastMove = $gameState.moveQueue?.[$gameState.moveQueue.length - 1];
        
        // Повертаємо true, якщо останній хід був зроблений гравцем (player === 1)
        return lastMove?.player === 1;
      }
    );
    ```

### Крок 2: Рефакторинг компонента `BoardWrapperWidget.svelte`

Тепер, коли логіка централізована, оновимо компонент для її використання.

- [ ] **Видалити локальний `derived` блок.**
    Знайдіть та видаліть реактивний блок, де визначається `shouldHideBoard` всередині компонента.

    **Код, який потрібно видалити з `src/lib/components/widgets/BoardWrapperWidget.svelte`:**
    ```svelte
    <script lang="ts">
      // ...
      import { derived } from 'svelte/store'; // Цей імпорт може стати непотрібним

      // ЦЕЙ БЛОК ПОВНІСТЮ ВИДАЛЯЄМО
      const shouldHideBoard = derived([
        appSettingsStore,
        gameState
      ], ([$appSettingsStore, $gameState]) => {
        if (!$appSettingsStore.autoHideBoard) return false;
        const lastMove = $gameState.moveQueue?.[$gameState.moveQueue.length - 1];
        return lastMove && lastMove.player === 1;
      });
      // ...
    </script>
    ```

- [ ] **Оновити імпорти.**
    Додайте імпорт нового стору `shouldHideBoard` з `$lib/stores/derivedState.ts`.

    **Оновлений блок імпортів у `src/lib/components/widgets/BoardWrapperWidget.svelte`:**
    ```svelte
    <script lang="ts">
      // ... інші імпорти
      import { shouldHideBoard } from '$lib/stores/derivedState.js'; // <-- ДОДАЙТЕ ЦЕЙ РЯДОК
      // ...
    </script>
    ```

- [ ] **Оновити шаблон (HTML).**
    Змініть спосіб застосування класу `hidden`. Замість інтерполяції рядка використайте більш чисту та ефективну директиву `class:`.

    **Старий код:**
    ```html
    <div 
      class="board-bg-wrapper game-content-block{ $shouldHideBoard ? ' hidden' : '' }"
      ...
    >
    ```

    **Новий код:**
    ```html
    <div 
      class="board-bg-wrapper game-content-block"
      class:hidden={$shouldHideBoard}
      ...
    >
    ```

### Крок 3: Верифікація

Після внесення змін необхідно перевірити, що функціональність автоматичного приховування дошки працює коректно.

- [ ] **Тестування з увімкненою опцією:**
    1.  Перейдіть на сторінку гри.
    2.  Відкрийте налаштування та активуйте чекбокс "Автоматично приховувати дошку".
    3.  Зробіть хід гравцем.
    4.  **Очікуваний результат:** Дошка має плавно зникнути після вашого ходу.

- [ ] **Тестування з вимкненою опцією:**
    1.  Перейдіть на сторінку гри.
    2.  Переконайтеся, що чекбокс "Автоматично приховувати дошку" вимкнений.
    3.  Зробіть хід гравцем.
    4.  **Очікуваний результат:** Дошка повинна залишатися видимою.

Після виконання цих кроків компонент `BoardWrapperWidget.svelte` буде спрощено, а логіка стане більш централізованою та легкою для тестування.