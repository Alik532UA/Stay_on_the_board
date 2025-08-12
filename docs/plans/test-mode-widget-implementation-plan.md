# План реалізації віджету розширеного "Test Mode"

## 1. Вступ

**Мета:** Розширити існуючий функціонал "Test Mode", додавши спеціальний віджет для детального контролю над ключовими аспектами гри. Це дозволить значно спростити тестування та налагодження, надаючи можливість створювати передбачувані ігрові сценарії.

**Очікуваний результат:** Коли "Test Mode" увімкнено, на головному екрані з'являється віджет, що дозволяє:
1.  **Керувати початковою позицією фігури:** Встановлювати фіксовану позицію або залишати випадкову.
2.  **Керувати ходом комп'ютера:** Задавати конкретний наступний хід для комп'ютера або залишати його на розсуд AI.

## 2. Архітектурний підхід

План базується на ключових принципах розробки для забезпечення чистоти, масштабованості та підтримки коду.

-   **SoC (Separation of Concerns):** Ми створимо новий, ізольований store (`testModeStore.ts`) виключно для стану віджету "Test Mode". Це дозволить не "засмічувати" основні stores (`settingsStore`, `gameState`) логікою, що стосується лише тестування. UI буде реалізовано в окремому компоненті `TestModeWidget.svelte`.

-   **SSoT (Single Source of Truth):** `testModeStore.ts` стане єдиним джерелом правди для налаштувань тестового режиму. Ігрова логіка буде лише читати дані з цього store, але не змінювати їх.

-   **UDF (Unidirectional Data Flow):** Потік даних буде чітким та односпрямованим:
    1.  Користувач взаємодіє з `TestModeWidget.svelte`.
    2.  Віджет оновлює стан у `testModeStore.ts`.
    3.  Сервіси (`gameLogicService.ts`, `computerPlayer.ts`) під час виконання читають дані з `testModeStore.ts` і змінюють свою поведінку відповідно.

-   **Композиція:** Головний віджет `TestModeWidget.svelte` буде складатися з менших, більш сфокусованих компонентів для керування початковою позицією та ходом комп'ютера, що покращить читабельність та перевикористання коду.

## 3. Етапи реалізації

### Крок 1: Створення `testModeStore` (SSoT, SoC)

Створити новий файл `src/lib/stores/testModeStore.ts` для зберігання стану віджету.

```typescript
// src/lib/stores/testModeStore.ts
import { writable } from 'svelte/store';

export type PositionMode = 'random' | 'predictable'; // predictable = 0,0
export type ComputerMoveMode = 'random' | 'manual';

export interface TestModeState {
  startPositionMode: PositionMode;
  computerMoveMode: ComputerMoveMode;
  manualComputerMove: {
    direction: string | null;
    distance: number | null;
  };
}

const initialState: TestModeState = {
  startPositionMode: 'predictable', // За замовчуванням, для стабільності тестів
  computerMoveMode: 'random',
  manualComputerMove: {
    direction: null,
    distance: null,
  },
};

export const testModeStore = writable<TestModeState>(initialState);
```

### Крок 2: Створення UI-компонентів (Композиція, SoC)

1.  **Створити головний віджет `src/lib/components/widgets/TestModeWidget.svelte`:**
    -   Цей компонент буде контейнером для елементів керування.
    -   Він буде відображатися на головній сторінці (`src/routes/+page.svelte`) тільки якщо `$settingsStore.testMode` має значення `true`.

2.  **Реалізувати логіку всередині `TestModeWidget.svelte`:**
    -   **Керування початковою позицією:**
        -   Додати дві кнопки: "Випадково" та "Передбачувано" (`0,0`).
        -   При натисканні на них оновлювати поле `startPositionMode` в `testModeStore`.
    -   **Керування ходом комп'ютера:**
        -   Перевикористати або адаптувати розмітку з `DirectionControls.svelte` для вибору напрямку та відстані.
        -   При виборі напрямку/відстані оновлювати `manualComputerMove` та встановлювати `computerMoveMode` в `'manual'` у `testModeStore`.
        -   Додати кнопку "Випадково", яка буде скидати налаштування, встановлюючи `computerMoveMode` в `'random'`.

### Крок 3: Інтеграція з ігровою логікою (UDF)

1.  **Оновити логіку створення гри:**
    -   У файлі `src/lib/stores/gameState.ts`, у функції `createInitialState`, змінити логіку визначення початкової позиції.
    -   Перед викликом `getRandomCell(size)` перевіряти стан `testModeStore`. Якщо `startPositionMode` встановлено в `'predictable'`, використовувати фіксовані координати `{ row: 0, col: 0 }`.

    ```typescript
    // src/lib/stores/gameState.ts in createInitialState
    import { get } from 'svelte/store';
    import { testModeStore } from './testModeStore';

    // ...
    const testModeState = get(testModeStore);
    const { row: initialRow, col: initialCol } = 
      testModeState.startPositionMode === 'predictable' 
      ? { row: 0, col: 0 } 
      : getRandomCell(size);
    // ...
    ```

2.  **Оновити логіку ходу комп'ютера:**
    -   У файлі `src/lib/services/computerPlayer.ts` (або де відбувається розрахунок ходу AI), додати перевірку стану `testModeStore`.
    -   Якщо `computerMoveMode` встановлено в `'manual'`, комп'ютер повинен виконати хід, вказаний у `manualComputerMove`, замість того, щоб розраховувати власний.

    ```typescript
    // src/lib/services/computerPlayer.ts in getComputerMove
    import { get } from 'svelte/store';
    import { testModeStore } from '../stores/testModeStore';

    // ...
    const testModeState = get(testModeStore);
    if (testModeState.computerMoveMode === 'manual' && testModeState.manualComputerMove.direction && testModeState.manualComputerMove.distance) {
      return {
        direction: testModeState.manualComputerMove.direction,
        distance: testModeState.manualComputerMove.distance
      };
    }
    // ... інакше виконується стандартна логіка AI
    ```

### Крок 4: Оновлення головної сторінки

-   У файлі `src/routes/+page.svelte` додати логіку для відображення `TestModeWidget.svelte`, коли `$settingsStore.testMode` є `true`.

```svelte
<!-- src/routes/+page.svelte -->
<script lang="ts">
  import TestModeWidget from '$lib/components/widgets/TestModeWidget.svelte';
  import { settingsStore } from '$lib/stores/settingsStore';
  // ... інший код
</script>

<!-- ... інший код -->

{#if $settingsStore.testMode}
  <TestModeWidget />
{/if}
```

Цей план забезпечує чисту та логічну реалізацію нового функціоналу, дотримуючись наданих вами принципів розробки.