Звісно. Цей крок завершує централізацію логіки керування грою в `gameOrchestrator`. Компонент `GameModeModal` більше не буде напряму викликати функцію зміни стану, а буде використовувати для цього відповідний метод сервісу-оркестратора.

---

### Детальний План: Рефакторинг `GameModeModal.svelte`

**Мета:** Оновити компонент, щоб він взаємодіяв з `gameOrchestrator` для зміни розміру дошки, замість прямого виклику функції з `gameLogicService`.

---

#### Крок 1: Оновлення імпортів

Спочатку ми змінимо імпорти, щоб компонент знав про `gameOrchestrator`.

1.  **Відкрийте файл:** `src/lib/components/GameModeModal.svelte`
2.  **Знайдіть блок `<script>`**.
3.  **Замініть** імпорт `setBoardSize` на імпорт `gameOrchestrator`.

    **Було:**
    ```svelte
    <script>
      // ...
      import { setBoardSize } from '$lib/services/gameLogicService.js';
      // ...
    </script>
    ```

    **Стане:**
    ```svelte
    <script>
      // ...
      import { gameOrchestrator } from '$lib/gameOrchestrator.js'; // <-- ПРАВИЛЬНИЙ ІМПОРТ
      // ...
    </script>
    ```

**Пояснення:** Ми прибираємо пряму залежність від `gameLogicService` і будемо використовувати єдину точку входу — `gameOrchestrator`.

---

#### Крок 2: Оновлення виклику функції

Тепер ми змінимо виклик функції всередині логіки `selectMode`.

1.  **У тому ж файлі** `src/lib/components/GameModeModal.svelte` знайдіть функцію `selectMode`.
2.  **Змініть** виклики `setBoardSize(...)` на `gameOrchestrator.setBoardSize(...)`.

    **Було:**
    ```svelte
    <script>
      // ...
      function selectMode(mode) {
        // ...
        if (score === 0 && penaltyPoints === 0 && boardSize !== 4) {
          setBoardSize(4); // <-- СТАРИЙ ВИКЛИК
          gotoAfterFaq();
        } else if (boardSize !== 4) {
          modalStore.showModal({
            // ...
            onClick: () => {
              setBoardSize(4); // <-- СТАРИЙ ВИКЛИК
              modalStore.closeModal();
              gotoAfterFaq();
            }
            // ...
          });
        } else {
          gotoAfterFaq();
        }
        // ...
      }
    </script>
    ```

    **Стане:**
    ```svelte
    <script>
      // ...
      function selectMode(mode) {
        // ...
        if (score === 0 && penaltyPoints === 0 && boardSize !== 4) {
          gameOrchestrator.setBoardSize(4); // <-- НОВИЙ ВИКЛИК
          gotoAfterFaq();
        } else if (boardSize !== 4) {
          modalStore.showModal({
            // ...
            onClick: () => {
              gameOrchestrator.setBoardSize(4); // <-- НОВИЙ ВИКЛИК
              modalStore.closeModal();
              gotoAfterFaq();
            }
            // ...
          });
        } else {
          gotoAfterFaq();
        }
        // ...
      }
    </script>
    ```

---

### Фінальний вигляд `GameModeModal.svelte` (скриптова частина)

Після змін блок `<script>` виглядатиме так:

```svelte
<script>
  import { _ } from 'svelte-i18n';
  import { settingsStore } from '$lib/stores/settingsStore.js';
  import { modalStore } from '$lib/stores/modalStore.js';
  import { goto } from '$app/navigation';
  import { base } from '$app/paths';
  import { gameOrchestrator } from '$lib/gameOrchestrator.js'; // Оновлено
  import { get } from 'svelte/store';
  import { gameState } from '$lib/stores/gameState.js';
  import DontShowAgainCheckbox from './DontShowAgainCheckbox.svelte';

  /**
   * @param {'beginner' | 'experienced' | 'pro'} mode
   */
  function selectMode(mode) {
    const shouldShowFaq = settingsStore.applyGameModePreset(mode);
    const { score, penaltyPoints, boardSize } = get(gameState);
    if (score === 0 && penaltyPoints === 0 && boardSize !== 4) {
      gameOrchestrator.setBoardSize(4); // Оновлено
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
              gameOrchestrator.setBoardSize(4); // Оновлено
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
  // ... решта коду без змін
</script>
```

### Результат та Перевірка

-   **Дотримання UDF:** Компонент тепер не має прямого доступу до функцій, що змінюють стан. Він відправляє "команду" до оркестратора, який вже вирішує, як її обробити.
-   **Централізація:** Логіка, пов'язана з можливою необхідністю показувати модальне вікно перед зміною розміру дошки, тепер повністю інкапсульована в `gameOrchestrator.setBoardSize`.

**Що протестувати:**
1.  **Сценарій 1 (Нова гра):**
    *   Зайдіть у головне меню.
    *   Натисніть "Грати проти комп'ютера".
    *   У модальному вікні вибору режиму оберіть будь-який режим.
    *   **Очікуваний результат:** Вас перекине на сторінку гри з дошкою 4x4.
2.  **Сценарій 2 (Гра з рахунком):**
    *   Почніть гру, зробіть кілька ходів, щоб рахунок був > 0.
    *   Поверніться в головне меню.
    *   Знову натисніть "Грати проти комп'ютера".
    *   У модальному вікні вибору режиму оберіть будь-який режим.
    *   **Очікуваний результат:** З'явиться модальне вікно з попередженням про скидання рахунку. Натисніть "Так, змінити розмір". Вас має перекинути на нову гру з дошкою 4x4.