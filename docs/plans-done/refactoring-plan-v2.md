---
type: improvement-plan
status: виконано
title: "Рефакторинг документації: версія 2"
id: PLAN-008
date: "2025-07-13"
author: ""
---

# Тип: План
# Статус: Виконано
# Назва: Рефакторинг-план v2
# Опис: Завершений другий варіант плану рефакторингу з оновленими етапами, цілями та підсумками виконання.

## Опис

Покращення структури документації, впровадження нових підходів до організації знань, підготовка до масштабування проекту.

---

## Фаза 1: Ізоляція логіки гравців (AI)

- [x] **Блок 1: Фіналізація `playerAgents.js`**
    - [x] Відкрити файл `svelte-app/src/lib/playerAgents.js`.
    - [x] Видалити поточний імпорт `getAllValidMoves` з `ai.js`.
    - [x] Додати правильний імпорт `getAllValidMoves` з `gameCore.js` та `settingsStore` з `settingsStore.js`:
      ```javascript
      import { getAllValidMoves } from './gameCore.js';
      import { settingsStore } from './stores/settingsStore.js';
      import { get } from 'svelte/store';
      ```
    - [x] У функції `getComputerMove` виправити отримання `blockOnVisitCount` для використання `settingsStore`:
        *   **Знайти рядок:** `const blockOnVisitCount = 0;`
        *   **Замінити на:** `const { blockOnVisitCount } = get(settingsStore);`
    - [x] Видалити файл `svelte-app/src/lib/ai.js`.

---

## Фаза 2: Створення "чистих" функцій-мутаторів у `gameStore.js`

**Мета:** Перетворити `gameStore.js` на модуль, що відповідає лише за зберігання стану та надання простих, синхронних функцій для його зміни.

- [x] **Блок 2: Ізоляція логіки `performMove`**
    - [x] Відкрити файл `svelte-app/src/lib/stores/gameStore.js`.
    - [x] Перейменувати існуючу функцію `performMove` на `_performMoveInternal`.
    - [x] Створити та експортувати нову функцію `_performMove`, яка буде викликати `appState.update` і використовувати `_performMoveInternal`.
      ```javascript
      /**
       * @param {number} newRow
       * @param {number} newCol
       */
      export function _performMove(newRow, newCol) {
        appState.update(state => _performMoveInternal(state, newRow, newCol));
      }
      ```
    - [ ] Перейменувати існуючу функцію `_performMove` (яку ми додали раніше і яка була порожньою) на `_performMoveInternal` і перенести в неї логіку з оригінальної `performMove`.

- [x] **Блок 3: Створення інших функцій-мутаторів**
    - [x] У файлі `gameStore.js` створити та експортувати наступні прості функції для зміни стану:
      ```javascript
      export function _updateAvailableMoves() {
        appState.update(state => {
          if (state.playerRow === null || state.playerCol === null) return state;
          const newAvailableMoves = getAvailableMoves(state.playerRow, state.playerCol, state.boardSize, state.cellVisitCounts, get(settingsStore).blockOnVisitCount);
          return { ...state, availableMoves: newAvailableMoves };
        });
      }

      /** @param {string} reasonKey */
      export function _endGame(reasonKey) {
        appState.update(state => {
          if (state.isGameOver) return state;
          const finalScoreDetails = calculateFinalScore(state);
          
          // Важливо: оновлюємо стан гри перед показом модального вікна
          const newState = { ...state, isGameOver: true, score: finalScoreDetails.totalScore };
          
          modalStore.showModal({
            titleKey: 'modal.gameOverTitle',
            content: { reason: get(t)(reasonKey), scoreDetails: finalScoreDetails },
            buttons: [
              { textKey: 'modal.playAgain', primary: true, onClick: resetAndCloseModal, isHot: true },
              { textKey: 'modal.watchReplay', customClass: 'blue-btn', onClick: startReplay }
            ]
          });

          return newState;
        });
      }

      /** @param {number} penalty */
      export function _applyPenalty(penalty) {
        appState.update(state => ({ ...state, penaltyPoints: state.penaltyPoints + penalty }));
      }

      /** @param {number} amount */
      export function _incrementScore(amount) {
        appState.update(state => ({ ...state, score: state.score + amount }));
      }

      export function _clearSelections() {
        appState.update(state => ({
          ...state,
          selectedDirection: null,
          selectedDistance: null,
          distanceManuallySelected: false,
          computerLastMoveDisplay: null,
          availableMoves: [],
        }));
      }
      ```
    - [x] Імпортувати `getAvailableMoves` та `calculateFinalScore` з `gameCore.js` на початку файлу `gameStore.js`.
    - [x] Імпортувати `settingsStore` з `settingsStore.js`.

---

## Фаза 3: Перенесення складної логіки до `gameOrchestrator.js`

- [x] **Блок 4: Перенесення `confirmMove`**
    - [x] Відкрити `gameOrchestrator.js` та `gameStore.js`.
    - [x] Скопіювати тіло функції `confirmMove` з `gameStore.js` у функцію `confirmPlayerMove` в `gameOrchestrator.js`.
    - [x] Адаптувати код: замінити всі прямі оновлення стану на виклики відповідних функцій-мутаторів з `gameStore.js` (`_performMove`, `_incrementScore`, `_applyPenalty`, `_clearSelections`, `_endGame`). Замінити `advanceTurn()` на виклик `triggerComputerMove()` після ходу гравця.
    - [x] Видалити стару функцію `confirmMove` з `gameStore.js`.

- [x] **Блок 5: Перенесення `makeComputerMove`**
    - [x] Скопіювати тіло функції `makeComputerMove` з `gameStore.js` у функцію `triggerComputerMove` в `gameOrchestrator.js`.
    - [x] Адаптувати код: замінити `getRandomComputerMove` на `agents.ai.getMove`, прямі оновлення стану на виклики `_performMove` та `_updateAvailableMoves`, видалити виклик `advanceTurn()`.
    - [x] Видалити стару функцію `makeComputerMove` з `gameStore.js`.

- [x] **Блок 6: Перенесення `noMoves`**
    - [x] Скопіювати тіло функції `noMoves` з `gameStore.js` у функцію `claimNoMoves` в `gameOrchestrator.js`.
    - [x] Адаптувати код: переконатися, що функція використовує `calculateFinalScore` з `gameCore.js`, всі виклики `modalStore.showModal` працюють коректно.
    - [x] Видалити стару функцію `noMoves` з `gameStore.js`.

---

## Фаза 4: Оновлення UI та фіналізація

- [x] **Блок 7: Оновлення `GameControls.svelte`**
    - [x] Відкрити `svelte-app/src/lib/components/GameControls.svelte`.
    - [x] Видалити імпорти `confirmMove` та `noMoves` з `gameStore.js`.
    - [x] Додати імпорти `confirmPlayerMove` та `claimNoMoves` з `gameOrchestrator.js`.
    - [x] Переконатися, що `on:click` обробники кнопок "Підтвердити хід" та "Ходів немає" викликають нові функції з `gameOrchestrator.js`.

- [x] **Блок 8: Очищення `gameStore.js`**
    - [x] Відкрити `gameStore.js`.
    - [x] Видалити всі невикористовувані імпорти (наприклад, `getRandomComputerMove`, `speakText` тощо).
    - [x] Переглянути файл і переконатися, що він містить лише стан, похідні стори та прості функції-мутатори.

- [ ] **Блок 9: Фінальна верифікація**
    - [ ] Запустити гру.
    - [ ] Перевірити, що хід гравця працює.
    - [ ] Перевірити, що комп'ютер ходить у відповідь.
    - [ ] Перевірити роботу кнопки "Ходів немає" в обох сценаріях (коли ходи є і коли їх немає).
    - [ ] Перевірити, що гра коректно завершується при виході за межі дошки.
    - [ ] Перевірити, що рахунок та штрафи нараховуються правильно.