---
type: improvement-plan
status: виконано
title: "Рефакторинг документації: версія 3"
id: PLAN-007
date: "2025-07-13"
author: ""
---

# Тип: План
# Статус: Виконано
# Назва: Рефакторинг-план v3
# Опис: Завершений третій варіант плану рефакторингу з оновленими етапами, цілями та підсумками виконання.

## Опис

Покрокове вдосконалення структури документації, впровадження нових принципів організації та стандартизації файлів.

---

## Фаза 1: Фіналізація допоміжних модулів

- [x] **Блок 1: Завершення `playerAgents.js`**
    - [x] Відкрити файл `svelte-app/src/lib/playerAgents.js`.
    - [x] Видалити рядок: `import { getAllValidMoves } from './ai.js';`.
    - [x] Додати натомість наступні імпорти:
      ```javascript
      import { getAvailableMoves } from './gameCore.js';
      import { appSettingsStore } from './stores/appSettingsStore.js';
      import { get } from 'svelte/store';
      ```
    - [x] У функції `getComputerMove`, знайти рядок `const blockOnVisitCount = 0;` і замінити його на:
      ```javascript
      const { blockOnVisitCount } = get(appSettingsStore);
      ```
    - [x] У тій же функції, знайти рядок `const moves = getAllValidMoves(board, cellVisitCounts, blockOnVisitCount, boardSize);` і замінити його на:
      ```javascript
      const moves = getAvailableMoves(state.playerRow, state.playerCol, boardSize, cellVisitCounts, blockOnVisitCount);
      ```
    - [x] Видалити файл `svelte-app/src/lib/ai.js`.

---

## Фаза 2: Перетворення `gameStore.js` на чистий менеджер стану

- [x] **Блок 2: Створення та наповнення функцій-мутаторів у `gameStore.js`**
    - [x] Відкрити файл `svelte-app/src/lib/stores/gameStore.js`.
    - [x] Видалити порожні функції-заглушки `_performMove`, `_updateAvailableMoves`, `_endGame`, `_applyPenalty`, `_incrementScore`.
    - [x] Додати необхідні імпорти з `gameCore.js` на початку файлу:
      ```javascript
      import { getAvailableMoves, calculateFinalScore } from '$lib/gameCore.js';
      ```
    - [x] Вставити наступний блок коду з новими, повністю реалізованими функціями-мутаторами в кінець файлу (перед закриваючою дужкою `)` від `writable`).
      ```javascript
      export function _performMove(newRow, newCol) {
        appState.update(state => {
          if (state.playerRow === null || state.playerCol === null) return state;
          
          const newBoard = state.board.map(row => row.slice());
          newBoard[state.playerRow][state.playerCol] = 0;
          newBoard[newRow][newCol] = 1;

          const newVisitCounts = { ...state.cellVisitCounts };
          if (state.blockModeEnabled) {
            const cellKey = `${state.playerRow}-${state.playerCol}`;
            newVisitCounts[cellKey] = (newVisitCounts[cellKey] || 0) + 1;
          }

          return {
            ...state,
            board: newBoard,
            playerRow: newRow,
            playerCol: newCol,
            cellVisitCounts: newVisitCounts,
            moveHistory: [...state.moveHistory, { pos: { row: newRow, col: newCol }, visits: newVisitCounts }],
          };
        });
      }

      export function _updateAvailableMoves() {
        appState.update(state => {
          if (state.playerRow === null || state.playerCol === null) return state;
          const newAvailableMoves = getAvailableMoves(state.playerRow, state.playerCol, state.boardSize, state.cellVisitCounts, get(appSettingsStore).blockOnVisitCount);
          return { ...state, availableMoves: newAvailableMoves };
        });
      }

      /** @param {string} reasonKey */
      export function _endGame(reasonKey) {
        appState.update(state => {
          if (state.isGameOver) return state;
          const finalScoreDetails = calculateFinalScore(state);
          
          modalStore.showModal({
            titleKey: 'modal.gameOverTitle',
            content: { reason: get(t)(reasonKey), scoreDetails: finalScoreDetails },
            buttons: [
              { textKey: 'modal.playAgain', primary: true, onClick: resetAndCloseModal, isHot: true },
              { textKey: 'modal.watchReplay', customClass: 'blue-btn', onClick: startReplay }
            ]
          });

          return { ...state, isGameOver: true, score: finalScoreDetails.totalScore };
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

---

## Фаза 3: Реалізація оркестратора

- [x] **Блок 3: Наповнення `gameOrchestrator.js` логікою**
    - [x] Відкрити файл `svelte-app/src/lib/gameOrchestrator.js`.
    - [x] Повністю замінити весь вміст файлу на новий код із плану.

---

## Фаза 4: Очищення та підключення

- [x] **Блок 4: Очищення `gameStore.js`**
    - [x] Відкрити `svelte-app/src/lib/stores/gameStore.js`.
    - [x] Повністю видалити старі функції: `confirmMove`, `makeComputerMove`, `noMoves`, `advanceTurn`.
    - [x] Видалити невикористовувані імпорти: `speakText`, `langMap`.

- [x] **Блок 5: Оновлення `GameControls.svelte`**
    - [x] Відкрити `svelte-app/src/lib/components/GameControls.svelte`.
    - [x] Видалити імпорти `confirmMove` та `noMoves` з `gameStore.js`.
    - [x] Додати імпорти `confirmPlayerMove` та `claimNoMoves` з `gameOrchestrator.js`:
      ```javascript
      import { confirmPlayerMove, claimNoMoves } from '$lib/gameOrchestrator.js';
      ```
    - [x] У функціях `onConfirmMove` та `onNoMoves` замінити виклики старих функцій на нові.

- [x] **Блок 6: Фінальна верифікація**
    - [x] Запустити гру.
    - [x] Перевірити, що хід гравця працює.
    - [x] Перевірити, що комп'ютер ходить у відповідь.
    - [x] Перевірити роботу кнопки "Ходів немає" в обох сценаріях (коли ходи є і коли їх немає).
    - [x] Перевірити, що гра коректно завершується при виході за межі дошки.
    - [x] Перевірити, що рахунок та штрафи нараховуються правильно.