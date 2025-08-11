# План декомпозиції `gameOrchestrator.ts`

**Мета:** Рефакторинг `gameOrchestrator.ts` шляхом його розділення на менші, більш сфокусовані сервіси. Це покращить архітектуру проєкту, спростить її розуміння та підтримку, а також підготує кодову базу до масштабування та впровадження онлайн-режиму.

---

## 1. Поточні проблеми

`gameOrchestrator.ts` наразі є "божественним об'єктом" (God Object), що призводить до наступних проблем:

-   **Порушення принципу єдиної відповідальності (SoC):** Файл змішує логіку керування ігровими режимами, обробку дій користувача, керування модальними вікнами та побічні ефекти (навігація, озвучення).
-   **Складний потік даних (UDF):** Важко відстежити, як і звідки змінюється стан, оскільки багато різних методів можуть прямо чи опосередковано викликати `stateManager`.
-   **Низька тестованість:** Тестувати такий великий та багатофункціональний модуль складно.
-   **Складність підтримки та розширення:** Додавання нової функціональності (наприклад, онлайн-режим) вимагатиме значних змін у цьому файлі, що підвищує ризик виникнення помилок.

---

## 2. Пропонована архітектура

Замість одного `gameOrchestrator` ми впровадимо кілька спеціалізованих сервісів:

1.  **`UserActionService`**: Єдина точка входу для всіх дій, ініційованих користувачем (кліки, хоткеї). Цей сервіс приймає намір користувача і делегує його виконання іншим сервісам.
2.  **`GameModeService`**: Керує життєвим циклом ігрових режимів (`local`, `vs-computer`, майбутній `online`). Відповідає за ініціалізацію, перезапуск та завершення гри в контексті поточного режиму.
3.  **`ModalService`**: Інкапсулює всю логіку, пов'язану зі створенням, показом та керуванням модальними вікнами.
4.  **`SideEffectService`**: Ізолює всі "нечисті" операції, такі як навігація (`goto`), озвучення (`speakText`), робота з `localStorage` та `window`.

**Новий потік даних буде виглядати так:**

`UI Component` -> `UserActionService` -> `GameModeService` / `ModalService` -> `stateManager` -> `gameState` -> `UI Component` (оновлення)

---

## 3. План реалізації

### Фаза 1: Створення нових сервісів

-   [ ] Створити файл `src/lib/services/userActionService.ts`.
-   [ ] Створити файл `src/lib/services/gameModeService.ts`.
-   [ ] Створити файл `src/lib/services/modalService.ts`.
-   [ ] Створити файл `src/lib/services/sideEffectService.ts`.

### Фаза 2: Міграція логіки з `gameOrchestrator.ts`

#### 2.1. `SideEffectService`
-   [ ] Перенести логіку виклику `goto` з `gameOrchestrator.startReplay` в `sideEffectService.navigateToReplay()`.
-   [ ] Перенести логіку виклику `speakText` з `gameOrchestrator.confirmPlayerMove` в `sideEffectService.speakMove()`.
-   [ ] Перенести логіку роботи з `window.location.pathname` з `_determineGameType` в `sideEffectService.getCurrentPath()`.

#### 2.2. `ModalService`
-   [ ] Перенести метод `_getCurrentModalContext` в `ModalService`.
-   [ ] Перенести всю логіку, що викликає `modalStore.showModal` (наприклад, з `setBoardSize`), в окремі методи `modalService` (напр. `modalService.showResetScoreConfirmation()`).

#### 2.3. `GameModeService`
-   [ ] Перенести `setCurrentGameMode`, `initializeGameMode` та `_determineGameType` в `GameModeService`.
-   [ ] `GameModeService` буде використовувати `sideEffectService` для визначення поточного шляху.
-   [ ] Методи `endGame` та `restartGame` з `gameOrchestrator` перенести сюди. Вони будуть викликати відповідні методи активного ігрового режиму.

#### 2.4. `UserActionService`
-   [ ] Створити методи, що відповідають діям користувача: `confirmMove`, `claimNoMoves`, `changeBoardSize`, `requestRestart`, `requestReplay`, `finishWithBonus`, `continueAfterNoMovesClaim`.
-   [ ] `changeBoardSize` буде викликати `modalService` для підтвердження, якщо це необхідно.
-   [ ] `confirmMove` буде викликати `gameModeService.handlePlayerMove()` та `sideEffectService.speakMove()`.
-   [ ] `requestReplay` буде викликати `replayService.saveReplayData()` та `sideEffectService.navigateToReplay()`.

### Фаза 3: Рефакторинг та видалення `gameOrchestrator.ts`

-   [ ] Поступово замінити виклики `gameOrchestrator` в UI компонентах на виклики відповідних нових сервісів.
    -   *Приклад:* В `GameControls.svelte` виклик `gameOrchestrator.confirmPlayerMove()` замінити на `userActionService.confirmMove()`.
-   [ ] Після того, як вся логіка буде перенесена, видалити файл `src/lib/gameOrchestrator.ts`.
-   [ ] Провести регресивне тестування, щоб переконатися, що функціональність не порушена.

---

## 4. Застосування принципів

-   **SoC:** Кожен сервіс має чітку та єдину зону відповідальності.
-   **UDF:** Потік даних стає строго односпрямованим та передбачуваним. Дії користувача завжди проходять через `UserActionService`.
-   **SSoT:** `gameState` залишається єдиним джерелом правди. Сервіси змінюють його лише через `stateManager`.
-   **Чистота та Побічні ефекти:** Всі "нечисті" операції ізольовані в `SideEffectService`. Інші сервіси стають більш "чистими" та легшими для тестування.
-   **KISS:** Архітектура стає простішою для розуміння, оскільки складається з невеликих, логічно завершених модулів.
-   **DRY:** Централізація логіки в спеціалізованих сервісах допоможе уникнути дублювання в майбутньому.
-   **Композиція:** UI компоненти стають простішими, оскільки вони лише викликають методи сервісів, не займаючись оркестрацією.
-   **Документація:** Кожен новий сервіс та його методи будуть задокументовані за допомогою JSDoc.