# План архітектурного рефакторингу: Підготовка до масштабування

**Мета:** Переробити поточну архітектуру для чіткого розділення відповідальності (SoC), ізолювати логіку штучного інтелекту та підготувати кодову базу до впровадження нових ігрових режимів (локальний мультиплеєр, онлайн).

**Поточна проблема:** Файл `gameStore.js` виконує занадто багато функцій: зберігання стану, ігрова логіка, керування чергою ходів та взаємодія з UI. Це ускладнює розширення та тестування.

**Цільова архітектура:**
1.  **`gameCore.js`**: Модуль із "чистими" функціями, що описують правила гри (розрахунок ходів, перевірка умов перемоги). Не знає про стан.
2.  **`playerAgents.js`**: Модуль, що визначає поведінку різних типів гравців (людина, AI). Ізолює логіку комп'ютера.
3.  **`gameOrchestrator.js`**: Модуль-диригент, що керує потоком гри (черга ходів, таймери, виклик модальних вікон, озвучення).
4.  **`gameStore.js`**: Спрощений стор, що відповідає **тільки** за зберігання та оновлення стану гри.

---

## Фаза 1: Створення чистої ігрової логіки (`gameCore.js`)

- [x] **Блок 1: Створення та наповнення `gameCore.js`**
    - [x] Створити новий файл: `svelte-app/src/lib/gameCore.js`.
    - [x] Перенести з `svelte-app/src/lib/stores/gameStore.js` до `gameCore.js` наступні "чисті" функції та константи:
        - `createEmptyBoard`
        - `getRandomCell`
        - `getAvailableMoves`
        - `dirMap`
        - `numToDir`
        - `oppositeDirections`
    - [x] Додати `export` перед кожною функцією та константою у `gameCore.js`.
    - [x] Видалити ці функції та константи з `gameStore.js`.

---

## Фаза 2: Ізоляція логіки гравців (`playerAgents.js`)

- [x] **Блок 2: Створення та наповнення `playerAgents.js`**
    - [x] Створити новий файл: `svelte-app/src/lib/playerAgents.js`.
    - [x] Перенести функцію `getRandomComputerMove` з `svelte-app/src/lib/ai.js` до `playerAgents.js`.
    - [x] Імпортувати `getAllValidMoves` з `ai.js` (тимчасово).
    - [x] Модифікувати `playerAgents.js`, щоб він експортував об'єкт `agents` з методом `getMove` для AI.
    - [x] Видалити старий файл `svelte-app/src/lib/ai.js`.

---

## Фаза 3: Створення диригента гри (`gameOrchestrator.js`)

- [x] **Блок 3: Створення та наповнення `gameOrchestrator.js`**
    - [x] Створити новий файл: `svelte-app/src/lib/gameOrchestrator.js`.
    - [x] Додати необхідні імпорти на початок файлу.
    - [x] Перенести логіку `confirmMove` з `gameStore.js` у `gameOrchestrator.js` і перейменувати її на `confirmPlayerMove`.
    - [x] Перенести логіку `makeComputerMove` з `gameStore.js` у `gameOrchestrator.js` і перейменувати її на `triggerComputerMove`.
    - [x] Перенести логіку `noMoves` з `gameStore.js` у `gameOrchestrator.js` і перейменувати її на `claimNoMoves`.
    - [x] Весь вміст файлу `gameOrchestrator.js` має виглядати так (це великий, але важливий крок).

---

## Фаза 4: Спрощення `gameStore.js`

- [x] **Блок 4: Рефакторинг `gameStore.js`**
    - [x] Відкрити `svelte-app/src/lib/stores/gameStore.js`.
    - [x] Видалити великі функції `confirmMove`, `makeComputerMove`, `noMoves`.
    - [x] Додати нові, менші, внутрішні функції, які буде викликати оркестратор. Додай `_` на початку їхніх назв, щоб позначити їх як "приватні" для цього модуля.
      ```javascript
      // Нові експортовані функції для оркестратора
      export function _performMove(newRow, newCol) {
        appState.update(state => {
          // ... логіка з функції performMove ...
          return { ...state, /* оновлені дані */ };
        });
      }

      export function _updateAvailableMoves() {
        appState.update(state => {
          // ... логіка оновлення availableMoves ...
          return { ...state, availableMoves: newAvailableMoves };
        });
      }

      export function _endGame(reasonKey, scoreDetails) {
         // ... логіка завершення гри та виклику модального вікна ...
      }
      
      // і так далі для _applyPenalty, _incrementScore...
      ```
    - [x] Переконатися, що `gameStore.js` тепер містить переважно визначення `appState` та прості функції-сетери (`setDirection`, `setDistance`, `resetGame`, `toggleBlockMode` і нові `_` функції).

---

## Фаза 5: Оновлення UI компонентів

- [x] **Блок 5: Адаптація `GameControls.svelte`**
    - [x] Відкрити `svelte-app/src/lib/components/GameControls.svelte`.
    - [x] Змінити імпорти: замість імпорту `confirmMove` та `noMoves` з `gameStore`, імпортувати `confirmPlayerMove` та `claimNoMoves` з `gameOrchestrator.js`.
    - [x] У розмітці, знайти кнопки "Підтвердити хід" та "Ходів немає" і переконатися, що їхні обробники `on:click` тепер викликають нові функції з оркестратора.
      ```html
      <button class="confirm-btn" on:click={confirmPlayerMove} ...>
      ...
      <button class="no-moves-btn" on:click={claimNoMoves} ...>
      ```

---

## Фаза 6: Фінальна перевірка та очищення

- [x] **Блок 6: Верифікація**
    - [x] Перевірити всі змінені файли на наявність невикористаних імпортів та видалити їх.
    - [x] Запустити гру і переконатися, що всі функції працюють як і раніше:
        - [x] Хід гравця виконується.
        - [x] Комп'ютер ходить у відповідь із затримкою.
        - [x] Кнопка "Ходів немає" працює коректно.
        - [x] Модальні вікна про перемогу/поразку з'являються.
        - [x] Озвучення ходу комп'ютера працює.