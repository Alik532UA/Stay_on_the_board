// src/lib/stores/animationStore.js
import { writable, get } from 'svelte/store';
import { gameState } from './gameState.js';

/**
 * @typedef {Object} VisualState
 * @property {number | null} row
 * @property {number | null} col
 * @property {import('./gameState').CellVisitCounts} cellVisitCounts
 * @property {boolean} showAvailableMoveDots
 * @property {number} gameId // Для відстеження перезапуску гри
 */

/**
 * @returns {import('svelte/store').Writable<VisualState>}
 */
function createAnimationStore() {
  const initialGameState = get(gameState);

  const { subscribe, set, update } = writable({
    row: initialGameState.playerRow,
    col: initialGameState.playerCol,
    cellVisitCounts: initialGameState.cellVisitCounts,
    showAvailableMoveDots: true,
    gameId: initialGameState.gameId,
  });

  let isAnimating = false;
  let lastProcessedMoveIndex = 0;

  gameState.subscribe(currentState => {
    const visualState = get({ subscribe });

    // Завжди синхронізуємо стан клітинок, якщо він не відповідає анімації
    if (!isAnimating && visualState.cellVisitCounts !== currentState.cellVisitCounts) {
      update(v => ({ ...v, cellVisitCounts: currentState.cellVisitCounts }));
    }

    // Сценарій 1: Почалася нова гра
    if (currentState.gameId !== visualState.gameId) {
      isAnimating = false;
      lastProcessedMoveIndex = 0;
      set({
        row: currentState.playerRow,
        col: currentState.playerCol,
        cellVisitCounts: currentState.cellVisitCounts,
        showAvailableMoveDots: false, // Спершу ховаємо
        gameId: currentState.gameId,
      });
      // Показуємо точки після анімації появи ферзя
      setTimeout(() => {
        update(v => ({ ...v, showAvailableMoveDots: true }));
      }, 550);
      return;
    }

    // Сценарій 2: З'явилися нові ходи в черзі
    if (currentState.moveQueue.length > lastProcessedMoveIndex && !isAnimating) {
      processQueue();
    }
  });

  function processQueue() {
    isAnimating = true;
    const currentGameState = get(gameState);
    const queue = currentGameState.moveQueue;

    if (lastProcessedMoveIndex >= queue.length) {
      isAnimating = false;
      update(v => ({ ...v, showAvailableMoveDots: true }));
      return;
    }

    // Ховаємо точки перед початком анімації
    update(v => ({ ...v, showAvailableMoveDots: false }));

    const nextMoveInHistory = currentGameState.moveHistory[lastProcessedMoveIndex + 1];

    if (nextMoveInHistory) {
      // Оновлюємо візуальний стан для наступного кроку анімації
      update(v => ({
        ...v,
        row: nextMoveInHistory.pos.row,
        col: nextMoveInHistory.pos.col,
        cellVisitCounts: nextMoveInHistory.visits || {},
      }));

      setTimeout(() => {
        lastProcessedMoveIndex++;
        processQueue(); // Рекурсивно викликаємо для наступного елемента черги
      }, 600); // Тривалість анімації + буфер
    } else {
      // Якщо щось пішло не так, завершуємо анімацію
      isAnimating = false;
      update(v => ({ ...v, showAvailableMoveDots: true }));
    }
  }

  return {
    subscribe,
    set,
    update
  };
}

export const animationStore = createAnimationStore(); 