---
type: improvement-plan
status: виконано
title: "Дорожня карта рефакторингу документації"
id: PLAN-010
date: "2025-07-13"
author: ""
---

# Тип: План
# Статус: Виконано
# Назва: Дорожня карта рефакторингу
# Опис: Завершена дорожня карта рефакторингу з описом етапів, цілей, рішень та підсумків виконання.

## Опис

Покрокова дорожня карта для рефакторингу документації, визначення етапів, пріоритетів та очікуваних результатів для підвищення якості та підтримуваності проекту.

---

# План архітектурного рефакторингу гри

**Мета:** Покращити архітектуру коду, дотримуючись принципів Розділення Відповідальності (SoC) та Чистоти Функцій. Ми винесемо ігрову логіку та оркестрацію ходів з `gameStore.js` в окремі, спеціалізовані модулі.

**Очікуваний результат:**
1.  `gameStore.js` буде відповідати виключно за зберігання стану.
2.  `gameLogic.js` (новий файл) буде містити чисті функції для розрахунків та маніпуляцій зі станом.
3.  `turnManager.js` (новий файл) буде відповідати за послідовність ігрових дій (оркестрацію).
4.  Код стане більш модульним, легким для тестування та масштабування.

---

## Фаза 1: Ізоляція чистої ігрової логіки

**Статус:** `[ ] Виконано`

На цьому етапі ми створимо новий модуль `gameLogic.js` і перенесемо в нього всі "чисті" функції, які не мають побічних ефектів (не викликають `setTimeout`, модальні вікна тощо).

*   `[ ]` **Блок 1.1: Створення нового модуля**
    *   `[ ]` Створити нову директорію: `svelte-app/src/lib/logic/`.
    *   `[ ]` Створити новий файл: `svelte-app/src/lib/logic/gameLogic.js`.

*   `[ ]` **Блок 1.2: Перенесення констант та утиліт з `gameStore.js`**
    *   `[ ]` З файлу `svelte-app/src/lib/stores/gameStore.js`, вирізати наступні константи та функції:
        ```javascript
        const dirMap = { ... };
        const numToDir = { ... };
        const oppositeDirections = { ... };

        function createEmptyBoard(size) { ... }
        function getRandomCell(size) { ... }
        function getAvailableMoves(row, col, size, cellVisitCounts = {}, blockOnVisitCount = 0) { ... }
        ```
    *   `[ ]` Вставити скопійований код у файл `svelte-app/src/lib/logic/gameLogic.js`.
    *   `[ ]` Додати ключове слово `export` перед кожною константою та функцією у `gameLogic.js`.

*   `[ ]` **Блок 1.3: Перенесення функції `performMove`**
    *   `[ ]` З файлу `gameStore.js`, вирізати повний код функції `performMove`.
    *   `[ ]` Вставити її у `gameLogic.js` та додати `export` на початку.

*   `[ ]` **Блок 1.4: Перенесення функції `calculateFinalScore`**
    *   `[ ]` З файлу `gameStore.js`, вирізати повний код функції `calculateFinalScore`.
    *   `[ ]` Вставити її у `gameLogic.js` та додати `export` на початку.

*   `[ ]` **Блок 1.5: Оновлення імпортів у `gameStore.js`**
    *   `[ ]` У файлі `gameStore.js`, додати на початку файлу новий імпорт з `gameLogic.js`:
        ```javascript
        import {
          createEmptyBoard,
          getRandomCell,
          getAvailableMoves,
          performMove,
          calculateFinalScore,
          oppositeDirections,
          dirMap,
          numToDir
        } from '$lib/logic/gameLogic.js';
        ```
    *   `[ ]` Переконатися, що гра запускається і працює коректно після цього етапу.

---

## Фаза 2: Створення оркестратора ходів

**Статус:** `[ ] Виконано`

Створюємо серце нової архітектури — `turnManager.js`, який буде керувати послідовністю ігрових подій.

*   `[ ]` **Блок 2.1: Створення файлу `turnManager.js`**
    *   `[ ]` Створити новий файл: `svelte-app/src/lib/logic/turnManager.js`.
    *   `[ ]` Вставити у нього наступний початковий код-каркас:
        ```javascript
        import { get } from 'svelte/store';
        import { appState } from '$lib/stores/gameStore.js';
        import { appSettingsStore } from '$lib/stores/appSettingsStore.js';
        import { modalStore } from '$lib/stores/modalStore.js';
        import { performMove, getAvailableMoves, calculateFinalScore, oppositeDirections, dirMap } from './gameLogic.js';
        import { getRandomComputerMove } from '$lib/ai.js';
        import { speakText, langMap } from '$lib/speech.js';
        import { _ as t } from 'svelte-i18n';
        import { resetAndCloseModal, startReplay, continueGameAndClearBlocks, finishGameWithBonus } from '$lib/stores/gameStore.js';

        // Ця функція буде керувати всім ігровим циклом
        async function advanceTurn() {
            // ... логіка буде додана тут ...
        }

        // Публічна функція, яку буде викликати UI
        export async function confirmPlayerMove() {
            // ... логіка буде додана тут ...
        }
        ```

*   `[ ]` **Блок 2.2: Перенесення логіки `confirmMove`**
    *   `[ ]` З файлу `gameStore.js`, скопіювати **весь вміст** функції `confirmMove`.
    *   `[ ]` Вставити цей код всередину нової функції `confirmPlayerMove` у `turnManager.js`.
    *   `[ ]` У `turnManager.js`, замінити всі виклики `appState.update(...)` на прямі зміни локальної копії стану, а в кінці викликати `appState.set(state)`. (Цей крок потребує ретельного переписування логіки, щоб вона не була прив'язана до `update` колбеку).
    *   `[ ]` **Важливо:** Замінити виклик `advanceTurn()` в кінці на прямий виклик `await handleComputerTurn()`.

*   `[ ]` **Блок 2.3: Перенесення логіки `makeComputerMove`**
    *   `[ ]` Створити нову асинхронну функцію `handleComputerTurn` у `turnManager.js`.
    *   `[ ]` З файлу `gameStore.js`, скопіювати **весь вміст** функції `makeComputerMove`.
    *   `[ ]` Вставити цей код всередину `handleComputerTurn`.
    *   `[ ]` Адаптувати код, щоб він працював з `get(appState)` та оновлював стан через `appState.update`.

*   `[ ]` **Блок 2.4: Рефакторинг `GameControls.svelte`**
    *   `[ ]` Відкрити `svelte-app/src/lib/components/GameControls.svelte`.
    *   `[ ]` Змінити імпорт: замість `import { confirmMove } from '$lib/stores/gameStore.js'` імпортувати `import { confirmPlayerMove } from '$lib/logic/turnManager.js'`.
    *   `[ ]` У розмітці та функціях, замінити всі виклики `confirmMove()` на `confirmPlayerMove()`.

*   `[ ]` **Блок 2.5: Очищення `gameStore.js`**
    *   `[ ]` У файлі `gameStore.js`, повністю видалити функції `confirmMove` та `makeComputerMove`.
    *   `[ ]` Видалити функцію `advanceTurn`.

---

## Фаза 3: Декомпозиція компонента `GameControls.svelte`

**Статус:** `[ ] Виконано`

Для покращення читабельності та дотримання принципу єдиної відповідальності, винесемо блок налаштувань в окремий компонент.

*   `[ ]` **Блок 3.1: Створення компонента `GameSettings.svelte`**
    *   `[ ]` Створити новий файл: `svelte-app/src/lib/components/GameSettings.svelte`.
    *   `[ ]` З файлу `GameControls.svelte`, вирізати весь блок `<details class="settings-expander">...</details>`.
    *   `[ ]` Вставити цей блок у `GameSettings.svelte`.

*   `[ ]` **Блок 3.2: Перенесення логіки та імпортів**
    *   `[ ]` З тегу `<script>` файлу `GameControls.svelte`, скопіювати всі необхідні імпорти (`appSettingsStore`, `modalStore`, `SvgIcons`, `_` тощо) та логіку, що стосується налаштувань (функції `onBlockModeChange`, `onSpeechChange`, `selectBlockCount`, `changeBoardSize` тощо) у тег `<script>` нового компонента `GameSettings.svelte`.
    *   `[ ]` Переконатися, що всі змінні, які використовуються в розмітці `GameSettings.svelte`, визначені.

*   `[ ]` **Блок 3.3: Інтеграція нового компонента**
    *   `[ ]` У файлі `GameControls.svelte`, додати імпорт нового компонента: `import GameSettings from './GameSettings.svelte';`.
    *   `[ ]` У тому місці, де раніше був блок `<details>`, вставити тег `<GameSettings />`.
    *   `[ ]` Видалити непотрібні імпорти та змінні з `GameControls.svelte`.
