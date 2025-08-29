Звісно. Ось детальний покроковий план для виправлення компонента `ControlsPanelWidget.svelte` відповідно до нової архітектури. Цей крок є критичним для усунення помилок, які ви бачите в консолі та `svelte-check`.

---

### Детальний План: Рефакторинг `ControlsPanelWidget.svelte`

**Мета:** Оновити компонент, щоб він використовував нові централізовані сервіси (`gameOrchestrator` та `gameLogicService`) замість старих, розрізнених функцій.

---

#### Крок 1: Оновлення імпортів

Перший крок — виправити всі `import` вирази, щоб вони вказували на правильні файли та експорти.

1.  **Відкрийте файл:** `src/lib/components/widgets/ControlsPanelWidget.svelte`
2.  **Знайдіть блок `<script>`** на початку файлу.
3.  **Повністю замініть** існуючі імпорти, пов'язані з логікою гри, на новий, правильний набір.

    **Було (з помилками):**
    ```svelte
    <script lang="ts">
      import { gameState } from '$lib/stores/gameState.js';
      import { playerInputStore } from '$lib/stores/playerInputStore.js';
      import { setDirection, setDistance } from '$lib/stores/gameActions.js'; // <-- НЕПРАВИЛЬНИЙ ШЛЯХ
      import { confirmPlayerMove, claimNoMoves } from '$lib/gameOrchestrator.js'; // <-- НЕПРАВИЛЬНИЙ ІМПОРТ
      import { derived } from 'svelte/store';
      import { _ } from 'svelte-i18n';
      import { appSettingsStore } from '$lib/stores/appSettingsStore.js';
      import SvgIcons from '../SvgIcons.svelte';
      import { get } from 'svelte/store';
      import { centerInfo, isConfirmButtonDisabled, availableDistances, distanceRows } from '$lib/stores/derivedState.js';
      import { modalStore } from '$lib/stores/modalStore.js';
    </script>
    ```

    **Стане (правильно):**
    ```svelte
    <script lang="ts">
      import { gameState } from '$lib/stores/gameState.js';
      import { playerInputStore } from '$lib/stores/playerInputStore.js';
      import { setDirection, setDistance } from '$lib/services/gameLogicService.js'; // <-- ПРАВИЛЬНИЙ ШЛЯХ
      import { gameOrchestrator } from '$lib/gameOrchestrator.js'; // <-- ПРАВИЛЬНИЙ ІМПОРТ
      import { derived } from 'svelte/store';
      import { _ } from 'svelte-i18n';
      import { appSettingsStore } from '$lib/stores/appSettingsStore.js';
      import SvgIcons from '../SvgIcons.svelte';
      import { get } from 'svelte/store';
      import { centerInfo, isConfirmButtonDisabled, availableDistances, distanceRows } from '$lib/stores/derivedState.js';
      import { modalStore } from '$lib/stores/modalStore.js';
    </script>
    ```

**Пояснення:**
*   Ми змінили шлях для `setDirection` та `setDistance` з `.../stores/gameActions.js` на `.../services/gameLogicService.js`.
*   Ми змінили іменований імпорт `{ confirmPlayerMove, claimNoMoves }` на імпорт єдиного об'єкта `{ gameOrchestrator }`.

---

#### Крок 2: Оновлення викликів функцій

Тепер, коли імпорти виправлено, потрібно оновити місця в коді, де викликалися старі функції.

1.  **Знайдіть функцію `onCentralClick`:**

    **Було:**
    ```javascript
    function onCentralClick() { if (selectedDirection && selectedDistance && isPlayerTurn) confirmPlayerMove(); }
    ```

    **Стане:**
    ```javascript
    function onCentralClick() { if (selectedDirection && selectedDistance && isPlayerTurn) gameOrchestrator.confirmPlayerMove(); }
    ```

2.  **Знайдіть функцію `onConfirmClick`:**

    **Було:**
    ```javascript
    function onConfirmClick() {
      if (buttonDisabled) { /* ... */ return; }
      confirmPlayerMove();
    }
    ```

    **Стане:**
    ```javascript
    function onConfirmClick() {
      if ($isConfirmButtonDisabled) { // Використовуємо derived стор, як планували
        modalStore.showModal({
          titleKey: 'modal.confirmMoveHintTitle',
          contentKey: 'modal.confirmMoveHintContent',
          buttons: [{ textKey: 'modal.ok', primary: true, isHot: true }]
        });
        return;
      }
      gameOrchestrator.confirmPlayerMove();
    }
    ```

3.  **Знайдіть обробник `on:click` для кнопки "Ходів немає":**

    **Було:**
    ```svelte
    <button class="no-moves-btn" on:click={claimNoMoves} ...>
    ```

    **Стане:**
    ```svelte
    <button class="no-moves-btn" on:click={gameOrchestrator.claimNoMoves} ...>
    ```

---

### Фінальний вигляд `ControlsPanelWidget.svelte` (скриптова частина)

Після всіх змін, блок `<script>` у вашому компоненті повинен виглядати приблизно так:

```svelte
<script lang="ts">
  import { gameState } from '$lib/stores/gameState.js';
  import { playerInputStore } from '$lib/stores/playerInputStore.js';
  import { setDirection, setDistance } from '$lib/services/gameLogicService.js';
  import { gameOrchestrator } from '$lib/gameOrchestrator.js';
  import { _ } from 'svelte-i18n';
  import { appSettingsStore } from '$lib/stores/appSettingsStore.js';
  import SvgIcons from '../SvgIcons.svelte';
  import { get } from 'svelte/store';
  import { centerInfo, isConfirmButtonDisabled, availableDistances, distanceRows } from '$lib/stores/derivedState.js';
  import { modalStore } from '$lib/stores/modalStore.js';

  $: isPlayerTurn = $gameState.players[$gameState.currentPlayerIndex]?.type === 'human';

  $: selectedDirection = $playerInputStore.selectedDirection;
  $: selectedDistance = $playerInputStore.selectedDistance;

  function onCentralClick() { 
    if (!$isConfirmButtonDisabled) {
      gameOrchestrator.confirmPlayerMove();
    }
  }
  function onDirectionClick(dir: any) { setDirection(dir); }
  function onDistanceClick(dist: number) { setDistance(dist); }
  
  function onConfirmClick() {
    if ($isConfirmButtonDisabled) {
      modalStore.showModal({
        titleKey: 'modal.confirmMoveHintTitle',
        contentKey: 'modal.confirmMoveHintContent',
        buttons: [{ textKey: 'modal.ok', primary: true, isHot: true }]
      });
      return;
    }
    gameOrchestrator.confirmPlayerMove();
  }
</script>
```

### Результат та Перевірка

-   **Виправлення помилок:** Помилки `SyntaxError` та помилки від `svelte-check`, пов'язані з неправильними імпортами, зникнуть.
-   **Відновлення функціональності:** Кнопки "Підтвердити хід" та "Ходів немає" знову запрацюють, але тепер вони будуть викликати методи централізованого оркестратора.
-   **Дотримання архітектури:** Компонент тепер коректно взаємодіє з сервісним шаром, що відповідає нашому плану.

**Що протестувати:**
1.  Запустіть гру (`npm run dev`).
2.  Переконайтеся, що в консолі браузера немає помилок, пов'язаних з імпортами.
3.  Зробіть хід, використовуючи кнопки напрямку, відстані та "Підтвердити". Переконайтеся, що хід виконується.
4.  Спробуйте натиснути кнопку "Ходів немає". Переконайтеся, що гра завершується з відповідним повідомленням.