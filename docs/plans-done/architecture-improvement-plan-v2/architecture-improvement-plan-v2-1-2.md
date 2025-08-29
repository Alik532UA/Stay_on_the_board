Звісно. Цей крок є дуже важливим для дотримання принципу SoC (Separation of Concerns). Компонент `GameBoard.svelte` (який, судячи зі структури, є головним контейнером ігрового екрану) не повинен містити логіку виклику ігрових дій. Його завдання — компонувати віджети, які вже містять цю логіку.

---

### Детальний План: Рефакторинг `GameBoard.svelte`

**Мета:** Очистити `GameBoard.svelte` від прямих викликів ігрових дій та оновити його імпорти, щоб він відповідав новій архітектурі сервісів.

---

#### Крок 1: Видалення непотрібних імпортів

Ми приберемо імпорти функцій, які не повинні викликатися з цього компонента-контейнера.

1.  **Відкрийте файл:** `src/lib/components/GameBoard.svelte`
2.  **Знайдіть блок `<script>`** на початку файлу.
3.  **Видаліть** рядки, що імпортують `confirmPlayerMove` та `claimNoMoves`.

    **Було (з помилками):**
    ```svelte
    <script lang="ts">
      // ...
      import { confirmPlayerMove, claimNoMoves } from '$lib/gameOrchestrator.js'; // <-- ЦІ РЯДКИ ТРЕБА ВИДАЛИТИ
      // ...
    </script>
    ```

    **Стане:**
    ```svelte
    <script lang="ts">
      // ...
      // Імпорти confirmPlayerMove та claimNoMoves видалено
      // ...
    </script>
    ```

**Пояснення:** Ці дії тепер викликаються виключно з `ControlsPanelWidget.svelte` через `gameOrchestrator`. `GameBoard.svelte` не повинен про них знати.

---

#### Крок 2: Оновлення шляху для `resetGame`

Функція `resetGame` тепер є частиною `gameLogicService`. Потрібно оновити шлях до неї.

1.  **У тому ж файлі** `src/lib/components/GameBoard.svelte` знайдіть імпорт `resetGame`.
2.  **Змініть шлях** до цього файлу.

    **Було:**
    ```svelte
    <script lang="ts">
      // ...
      import { setDirection, setDistance, endGame, resetGame, startReplay, continueAfterNoMoves, finalizeGameWithBonus, setBoardSize } from '$lib/stores/gameActions.js';
      // ...
    </script>
    ```

    **Стане:**
    ```svelte
    <script lang="ts">
      // ...
      // Видаляємо всі імпорти з gameActions, оскільки вони переїхали
      import { resetGame } from '$lib/services/gameLogicService.js'; // <-- ОНОВЛЕНИЙ ІМПОРТ
      // ...
    </script>
    ```
    *Примітка: Ви можете помітити, що багато інших імпортів з `gameActions.js` (такі як `endGame`, `startReplay`) також стали непотрібними в цьому файлі, оскільки логіка модальних вікон тепер обробляється через реактивну підписку на `gameState`. Їх також можна безпечно видалити з цього компонента.*

---

#### Крок 3: Фінальна очистка `GameBoard.svelte`

Після оновлення імпортів, перегляньте весь блок `<script>` у `GameBoard.svelte` і видаліть будь-які функції або змінні, які більше не використовуються.

**Приклад того, як має виглядати чистий `GameBoard.svelte`:**

```svelte
<script lang="ts">
  // Імпорти, що стосуються компонування та UI
  import '../css/components/game-board.css';
  import '../css/components/controls.css';
  import DraggableColumns from './DraggableColumns.svelte';
  import Modal from '$lib/components/Modal.svelte';
  import VoiceSettingsModal from '$lib/components/VoiceSettingsModal.svelte';
  import { uiState, closeVoiceSettingsModal } from '$lib/stores/uiStore.js';
  import { layoutStore, WIDGETS } from '$lib/stores/layoutStore.js';
  
  // Імпорти віджетів
  import TopRowWidget from './widgets/TopRowWidget.svelte';
  import ScorePanelWidget from './widgets/ScorePanelWidget.svelte';
  import BoardWrapperWidget from './widgets/BoardWrapperWidget.svelte';
  import ControlsPanelWidget from './widgets/ControlsPanelWidget.svelte';
  import SettingsExpanderWidget from './widgets/SettingsExpanderWidget.svelte';

  // Імпорти для логіки модальних вікон та ініціалізації
  import { appSettingsStore } from '$lib/stores/appSettingsStore.js';
  import { modalStore } from '$lib/stores/modalStore.js';
  import { get } from 'svelte/store';
  import { onMount } from 'svelte';
  import { _ } from 'svelte-i18n';
  import { gameState } from '$lib/stores/gameState.js';
  import { gameOrchestrator } from '$lib/gameOrchestrator.js'; // Для модалок
  import { resetGame } from '$lib/services/gameLogicService.js'; // Для onMount

  onMount(() => {
    appSettingsStore.init();
    // Скидаємо гру для коректної ініціалізації при перезавантаженні
    resetGame();
  });

  const widgetMap = {
    [WIDGETS.TOP_ROW]: TopRowWidget,
    [WIDGETS.SCORE_PANEL]: ScorePanelWidget,
    [WIDGETS.BOARD_WRAPPER]: BoardWrapperWidget,
    [WIDGETS.CONTROLS_PANEL]: ControlsPanelWidget,
    [WIDGETS.SETTINGS_EXPANDER]: SettingsExpanderWidget,
  };

  $: columns = $layoutStore.map(col => ({
    id: col.id,
    label: col.id,
    items: col.widgets.map(id => ({ id, label: id }))
  }));

  // Реактивний блок для показу модальних вікон (це логіка UI, тому тут їй місце)
  $: if ($gameState.isGameOver && $gameState.gameOverReasonKey) {
    setTimeout(() => {
      const reasonKey = $gameState.gameOverReasonKey;
      const $t = get(_);
      const reasonValues = $gameState.gameOverReasonValues || {};

      let modalConfig: any = {};

      switch (reasonKey) {
        case 'modal.playerNoMovesContent':
          modalConfig = {
            titleKey: 'modal.playerNoMovesTitle',
            content: { reason: $t(reasonKey || ''), scoreDetails: $gameState },
            buttons: [
              { textKey: 'modal.continueGame', customClass: 'green-btn', isHot: true, onClick: gameOrchestrator.continueAfterNoMoves },
              { 
                text: $t('modal.finishGameWithBonus', { values: { bonus: $gameState.boardSize } }), 
                onClick: () => gameOrchestrator.finalizeGameWithBonus('modal.gameOverReasonBonus') 
              },
              { textKey: 'modal.watchReplay', customClass: 'blue-btn', onClick: gameOrchestrator.startReplay }
            ],
            closable: false
          };
          break;
        
        case 'modal.errorContent':
          modalConfig = {
            titleKey: 'modal.errorTitle',
            content: { reason: $t(reasonKey || '', { values: reasonValues }), scoreDetails: $gameState },
            buttons: [
              { textKey: 'modal.playAgain', primary: true, onClick: () => { resetGame(); modalStore.closeModal(); }, isHot: true },
              { textKey: 'modal.watchReplay', customClass: 'blue-btn', onClick: gameOrchestrator.startReplay }
            ],
            closable: false
          };
          break;

        case 'modal.computerNoMovesContent':
          modalConfig = {
            titleKey: 'modal.computerNoMovesTitle',
            content: { reason: $t('modal.computerNoMovesContent'), scoreDetails: $gameState },
            buttons: [
              { textKey: 'modal.continueGame', customClass: 'green-btn', isHot: true, onClick: gameOrchestrator.continueAfterNoMoves },
              { 
                text: $t('modal.finishGameWithBonus', { values: { bonus: $gameState.boardSize } }), 
                onClick: () => gameOrchestrator.finalizeGameWithBonus('modal.gameOverReasonBonus') 
              },
              { textKey: 'modal.watchReplay', customClass: 'blue-btn', onClick: gameOrchestrator.startReplay }
            ],
            closable: false
          };
          break;

        default:
          modalConfig = {
            titleKey: 'modal.gameOverTitle',
            content: { reason: $t(reasonKey || '', { values: reasonValues }), scoreDetails: $gameState },
            buttons: [
              { textKey: 'modal.playAgain', primary: true, onClick: () => { resetGame(); modalStore.closeModal(); }, isHot: true },
              { textKey: 'modal.watchReplay', customClass: 'blue-btn', onClick: gameOrchestrator.startReplay }
            ]
          };
          break;
      }
      
      modalStore.showModal(modalConfig);
    }, 600);
  }

  function itemContent(item: {id: string, label: string}) {
    const Comp = widgetMap[item.id];
    if (Comp) return Comp;
    return item.id;
  }

  function handleDrop(e: CustomEvent<{dragging: {id: string, label: string}, dragSourceCol: string, dropTargetCol: string, dropIndex: number}>) {
    const { dragging, dragSourceCol, dropTargetCol, dropIndex } = e.detail;
    layoutStore.update(cols => {
      let newCols = cols.map(col => ({
        ...col,
        widgets: col.widgets.filter(id => id !== dragging.id)
      }));
      return newCols.map(col => {
        if (col.id === dropTargetCol) {
          const widgets = [...col.widgets];
          widgets.splice(dropIndex, 0, dragging.id);
          return { ...col, widgets };
        }
        return col;
      });
    });
  }

  // Видаляємо changeBoardSize та executeAction, оскільки вони належать віджетам
</script>

<!-- Розмітка залишається без змін -->
```

### Результат та Перевірка

-   **Чистота компонента:** `GameBoard.svelte` тепер є чистим компонентом-контейнером. Він не знає про конкретні ігрові дії, а лише компонує віджети та керує логікою показу модальних вікон, що є його прямою відповідальністю як "сцени".
-   **Виправлення помилок:** Помилки `svelte-check`, пов'язані з цим файлом, зникнуть.
-   **Дотримання SoC:** Відповідальність за ігрові дії тепер повністю лежить на `ControlsPanelWidget` та `gameOrchestrator`, як і було заплановано.

**Що протестувати:**
1.  Запустіть гру. Переконайтеся, що ігровий екран завантажується без помилок.
2.  Перевірте, що всі кнопки на `ControlsPanelWidget` та інших віджетах працюють.
3.  Завершіть гру (програйте). Переконайтеся, що модальне вікно з результатами з'являється коректно. Це підтвердить, що реактивний блок `$: if ($gameState.isGameOver ...)` працює правильно.