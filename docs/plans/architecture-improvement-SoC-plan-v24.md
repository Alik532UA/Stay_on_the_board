# План покращення архітектури (SoC) - v24

## Частина 1: Аудит та Оцінка

### Критерій: SoC (Separation of Concerns)
Аналіз коду показав, наскільки добре розділені відповідальності між станом (stores), логікою (services) та відображенням (components).

- **Сильні сторони:**
  - **SSoT:** Стан гри централізовано в `gameState.ts`.
  - **Ізоляція візуалізації:** Логіка гри та `GameInfoWidget` (`center-info`) не залежать від візуалізації дошки (`BoardWrapperWidget`), що відповідає "Золотому правилу" проєкту.
  - **Структура:** Проєкт має логічну структуру папок (`stores`, `services`, `components`).

- **Слабкі сторони:**
  - **Нечисті сервіси:** Сервіси (`gameLogicService`) напряму залежать від Svelte-сторів (`get(gameState)`), що робить їх залежними від фреймворку.
  - **Логіка в UI:** Компоненти, особливо `game/+layout.svelte`, містять бізнес-логіку (обробка гарячих клавіш, прямі виклики сервісів).
  - **Стори з побічними ефектами:** `gameState` має логіку, що реагує на зміни в `testModeStore`.

### Підсумкова оцінка SoC: 65 / 100

**Висновок:** Архітектура має міцний фундамент, але реалізація деяких патернів взаємодії між шарами потребує покращення для забезпечення гнучкості та масштабованості.

---

## Частина 2: План Покращень

Мета: Підготувати код до масштабування (нові режими, таймери, онлайн-гра, система нагород) шляхом посилення Separation of Concerns.

### Пріоритетні завдання

| Пріоритет (0-100) | Завдання | Опис |
| :--- | :--- | :--- |
| **100** | **Рефакторинг `game/+layout.svelte`** | Повністю винести логіку обробки гарячих клавіш з компонента. Створити новий `hotkeyService.ts`, який буде слухати події клавіатури і викликати відповідні методи в `userActionService`. Компонент `+layout.svelte` повинен лише ініціалізувати цей сервіс. |
| **95** | **Зробити `gameLogicService` чистим** | Провести рефакторинг `gameLogicService`, щоб його функції приймали стан як аргумент, а не отримували його через `get(gameState)`. Це зробить логіку незалежною від Svelte. |
| **90** | **Ізолювати логіку `testModeStore`** | Винести логіку, що реагує на зміни `testModeStore`, з `gameState.ts` в окремий сервіс-оркестратор (наприклад, `testModeService.ts`). Цей сервіс буде слухати `testModeStore` і оновлювати `gameState` через `gameStateMutator`. |
| **80** | **Створити `inputService`** | Узагальнити логіку вводу. `hotkeyService` та обробники кліків на UI-кнопках повинні викликати методи цього сервісу (наприклад, `inputService.confirmMove()`, `inputService.selectDirection('up')`), а вже `inputService` буде взаємодіяти з `userActionService`. Це підготує базу для онлайн-режиму, де ввід буде надходити з мережі. |
| **70** | **Рефакторинг `BoardWrapperWidget`** | Винести логіку з `onMount` та обробника правого кліку в окремі функції або в `uiService`, щоб зменшити кількість логіки в компоненті. |

### Чекбокси для виконання

- [ ] **`game/+layout.svelte`:**
  - [ ] Створити `src/lib/services/hotkeyService.ts`.
  - [ ] Перенести всю логіку з `handleHotkey` та `executeAction` в `hotkeyService.ts`.
  - [ ] `hotkeyService` має викликати `userActionService` та `settingsStore`.
  - [ ] `game/+layout.svelte` повинен лише викликати `hotkeyService.init()` в `onMount`.

- [ ] **`gameLogicService.ts`:**
  - [ ] Модифікувати функцію `performMove` та інші, щоб вони приймали `currentState` як обов'язковий параметр.
  - [ ] Оновити `userActionService` та інші сервіси, які викликають `gameLogicService`, щоб вони передавали поточний стан з `get(gameState)`.

- [ ] **Ізоляція `testMode`:**
  - [ ] Створити `src/lib/services/testModeService.ts`.
  - [ ] Перенести логіку підписки на `testModeStore` з `gameState.ts` в `testModeService.ts`.
  - [ ] `testModeService.ts` має оновлювати `gameState` через `gameStateMutator`.

- [ ] **Створення `inputService`:**
  - [ ] Створити `src/lib/services/inputService.ts`.
  - [ ] Оновити `hotkeyService` для використання `inputService`.
  - [ ] Оновити UI компоненти кнопок (`DirectionControls` і т.д.) для використання `inputService` замість прямих викликів `gameLogicService` або `userActionService`.

- [ ] **Рефакторинг `BoardWrapperWidget.svelte`:**
  - [ ] Створити відповідні функції в `uiService` або іншому відповідному сервісі.
  - [ ] Перенести логіку з `onMount` та `onCellRightClick` у ці функції.
  - [ ] Викликати ці функції з компонента.
