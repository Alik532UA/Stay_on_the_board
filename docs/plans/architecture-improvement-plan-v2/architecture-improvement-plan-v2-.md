# План Покращення Архітектури v2: Завершення та Стабілізація

**Мета:** Завершити розпочатий рефакторинг, виправити всі поточні помилки, повністю інтегрувати нові сервіси та `derived` стори, а також очистити проєкт від застарілих файлів.

---

### Фаза 1: Виправлення критичних помилок імпорту

*Це найперший крок, який зробить проєкт знову робочим.*

- [ ] **Оновити `ControlsPanelWidget.svelte`:**
    - [ ] Замінити `import { confirmPlayerMove, claimNoMoves } from '$lib/gameOrchestrator.js';` на `import { gameOrchestrator } from '$lib/gameOrchestrator.js';`.
    - [ ] Замінити виклики `confirmPlayerMove()` на `gameOrchestrator.confirmPlayerMove()`.
    - [ ] Замінити виклик `claimNoMoves` на `gameOrchestrator.claimNoMoves`.
    - [ ] Замінити імпорт `setDirection`, `setDistance` з `gameActions` на `gameLogicService`.

- [ ] **Оновити `GameBoard.svelte`:**
    - [ ] **Видалити** імпорти `confirmPlayerMove` та `claimNoMoves`. Цей компонент не повинен викликати ці дії.
    - [ ] Оновити імпорт `resetGame` та інших функцій, щоб вони вказували на `gameLogicService`.

- [ ] **Оновити `GameModeModal.svelte`:**
    - [ ] Замінити імпорт `setBoardSize` з `gameActions` на `gameLogicService`.
    - [ ] Замінити виклик `setBoardSize` на `gameOrchestrator.setBoardSize`.

- [ ] **Оновити `gameCore.test.js`:**
    - [ ] Замінити всі імпорти з `./gameCore` на `'$lib/services/gameLogicService'`.

---

### Фаза 2: Завершення рефакторингу `derived` сторів

*Робимо компоненти "тупішими" та декларативними.*

- [ ] **Спростити `ControlsPanelWidget.svelte`:**
    - [ ] Видалити реактивні змінні `buttonDisabled` та `confirmButtonBlocked`.
    - [ ] Імпортувати `isConfirmButtonDisabled` з `derivedState.ts`.
    - [ ] Використовувати `$isConfirmButtonDisabled` для стану кнопки "Підтвердити".
    - [ ] Видалити реактивний блок `$: distanceRows` та імпортувати `distanceRows` з `derivedState.ts`.

- [ ] **Спростити `MainMenu.svelte`:**
    - [ ] Видалити реактивну змінну `$: currentFlagSvg`.
    - [ ] Імпортувати `currentLanguageFlagSvg` з `derivedState.ts` та використовувати `$currentLanguageFlagSvg`.
    - [ ] Імпортувати масив `languages` з `constants.ts` для рендерингу дропдауну.

- [ ] **Спростити `BoardWrapperWidget.svelte`:**
    - [ ] Видалити реактивний блок `$: shouldHideBoard`.
    - [ ] Імпортувати `shouldHideBoard` з `derivedState.ts` та використовувати `class:hidden={$shouldHideBoard}`.

---

### Фаза 3: Очищення проєкту

*Прибираємо застарілі файли, щоб уникнути плутанини в майбутньому.*

- [ ] **Перевірити проєкт:** Запустити `npm run check`. Переконатися, що помилок немає.
- [ ] **Видалити старі файли логіки:**
    - [ ] Видалити `src/lib/gameCore.ts`.
    - [ ] Видалити `src/lib/stores/gameActions.ts`.
- [ ] **Видалити старі файли сервісів:**
    - [ ] Видалити `src/lib/stores/audioStore.js`.
    - [ ] Видалити `src/lib/utils/navigation.js`.
- [ ] **Видалити застарілі компоненти:**
    - [ ] Видалити `src/components/GameControls.svelte` (його повністю замінив `ControlsPanelWidget`).
    - [ ] Видалити `src/lib/components/GameBoard.svelte` (його замінили віджети).

---

### Фаза 4: Виправлення помилки типізації

*Забезпечуємо типізацію для надійності.*

- [ ] **Оновити `gameOrchestrator.js`:**
    - [ ] У методі `_handleComputerMoveSideEffects` додати JSDoc-коментар для `directionEn`, щоб TypeScript розумів його ключі:
      ```javascript
      /** @type {Record<import('$lib/services/gameLogicService').Direction, string>} */
      const directionEn = { /* ... */ };
      const dirKey = /** @type {import('$lib/services/gameLogicService').Direction} */ (move.direction);
      textToSpeak = `${move.distance} ${directionEn[dirKey] ?? move.direction}.`;
      ```