// src/lib/stores/animationStore.js
import { writable, get } from 'svelte/store';
import { gameState } from './gameState.js';

/**
 * @typedef {Object} VisualState
 * @property {number | null} visualRow
 * @property {number | null} visualCol
 * @property {import('./gameState').CellVisitCounts} visualCellVisitCounts
 * @property {boolean} showAvailableMoveDots // <-- ПОВЕРТАЄМО ЦЕЙ ПРАПОРЕЦЬ
 * @property {number} gameId
 * @property {boolean} isAnimating
 */

function createAnimationService() {
  const initialGameState = get(gameState);

  /** @type {import('svelte/store').Writable<VisualState>} */
  const { subscribe, set, update } = writable({
    // Ініціалізуємо з поточного стану гри, але ВИМИКАЄМО точки для безпеки
    visualRow: initialGameState.playerRow,
    visualCol: initialGameState.playerCol,
    visualCellVisitCounts: { ...initialGameState.cellVisitCounts },
    showAvailableMoveDots: false, // <-- ВАЖЛИВО: початково false для уникнення блимання
    gameId: initialGameState.gameId,
    isAnimating: false,
  });

  let lastProcessedMoveIndex = initialGameState.moveQueue.length;
  /** @type {ReturnType<typeof setTimeout> | null} */
  let queenDotsTimeout = null;

  // Якщо гра вже йде (є ходи в історії), вмикаємо точки відразу
  // АЛЕ: для нової гри завжди вимикаємо точки, навіть якщо є стара історія
  if (initialGameState.moveHistory.length > 1 && initialGameState.moveQueue.length === 0) {
    update(v => ({ ...v, showAvailableMoveDots: true }));
  } else {
    // Для нової гри точки будуть вмикатися через setTimeout
    console.log('AnimationStore: Нова гра, точки будуть вмикатися через анімацію');
  }

  gameState.subscribe(currentState => {
    const visualState = get({ subscribe });

    if (currentState.gameId !== visualState.gameId) {
      console.log('AnimationStore: Нова гра, gameId змінився з', visualState.gameId, 'на', currentState.gameId);
      lastProcessedMoveIndex = 0;

      // Скасовуємо попередній таймер, якщо він був
      if (queenDotsTimeout) {
        clearTimeout(queenDotsTimeout);
        console.log('AnimationStore: Скасовано попередній таймер');
      }
      // КРОК 1: Миттєво оновлюємо позицію, але ВИМИКАЄМО точки
      set({
        visualRow: currentState.playerRow,
        visualCol: currentState.playerCol,
        visualCellVisitCounts: { ...currentState.cellVisitCounts },
        showAvailableMoveDots: false, // <-- Гарантовано вимикаємо
        gameId: currentState.gameId,
        isAnimating: false,
      });

      console.log('AnimationStore: Встановлено початковий стан, showAvailableMoveDots = false');

      // КРОК 2: Через паузу, яка дорівнює анімації появи ферзя, ВМИКАЄМО точки
      console.log('AnimationStore: Запускаємо setTimeout на 550ms');
      queenDotsTimeout = setTimeout(() => {
        console.log('AnimationStore: setTimeout 550ms спрацював, вмикаємо точки');
        const currentVisualState = get({ subscribe });
        const currentGameState = get(gameState);
        console.log('AnimationStore: Поточний стан перед оновленням:', currentVisualState);
        console.log('AnimationStore: Поточний gameId:', currentGameState.gameId, 'visual gameId:', currentVisualState.gameId);
        
        // Перевіряємо, чи не змінився gameId
        if (currentGameState.gameId !== currentVisualState.gameId) {
          console.log('AnimationStore: gameId змінився, не оновлюємо стан');
          return;
        }
        set({
          ...currentVisualState,
          showAvailableMoveDots: true
        });
        // --- Додаємо явне оновлення доступних ходів після появи ферзя ---
        import('$lib/services/gameLogicService').then(mod => {
          mod.updateAvailableMoves();
        });
        console.log('AnimationStore: set() виконано, showAvailableMoveDots = true');
        setTimeout(() => {
          const updatedState = get({ subscribe });
          console.log('AnimationStore: Стан після set:', updatedState);
        }, 10);
      }, 550);

      // АЛЬТЕРНАТИВНИЙ ПІДХІД: використовуємо requestAnimationFrame для більш надійної анімації
      let frameCount = 0;
      const maxFrames = 33; // ~550ms при 60fps
      
      function animateDots() {
        frameCount++;
        if (frameCount >= maxFrames) {
          const currentVisualState = get({ subscribe });
          const currentGameState = get(gameState);
          
          if (currentGameState.gameId === currentVisualState.gameId && !currentVisualState.showAvailableMoveDots) {
            console.log('AnimationStore: requestAnimationFrame вмикає точки');
            set({
              ...currentVisualState,
              showAvailableMoveDots: true
            });
            console.log('AnimationStore: set() виконано з requestAnimationFrame, showAvailableMoveDots = true');
          }
          return;
        }
        requestAnimationFrame(animateDots);
      }
      
      requestAnimationFrame(animateDots);
      return;
    }

    if (currentState.moveQueue.length > lastProcessedMoveIndex && !visualState.isAnimating) {
      processQueue();
    }
  });

  function processQueue() {
    const currentGameState = get(gameState);
    const queue = currentGameState.moveQueue;

    if (lastProcessedMoveIndex >= queue.length) {
      update(v => ({ ...v, isAnimating: false, showAvailableMoveDots: true }));
      return;
    }

    update(v => ({ ...v, isAnimating: true, showAvailableMoveDots: false }));

    const nextMoveInHistory = currentGameState.moveHistory[lastProcessedMoveIndex + 1];

    if (nextMoveInHistory) {
      update(v => ({
        ...v,
        visualRow: nextMoveInHistory.pos.row,
        visualCol: nextMoveInHistory.pos.col,
      }));

      setTimeout(() => {
        update(v => ({ ...v, visualCellVisitCounts: nextMoveInHistory.visits || {} }));
        lastProcessedMoveIndex++;
        processQueue();
      }, 600);
    } else {
      update(v => ({ ...v, isAnimating: false, showAvailableMoveDots: true }));
    }
  }

  return {
    subscribe,
    update,
  };
}

export const animationStore = createAnimationService(); 