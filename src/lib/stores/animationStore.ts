// src/lib/stores/animationStore.ts
import { writable, get, type Writable } from 'svelte/store';
import { gameState } from './gameState';
import { logService } from '../services/logService';

// ВАЖЛИВО! Цей store працює ЛИШЕ з візуальним станом для анімації.
// Заборонено напряму змінювати moveQueue або board логічного стану гри з animationStore!
// Всі зміни логіки гри мають відбуватися лише через централізовані сервіси/оркестратор.
//
// This store is for animation state ONLY. Never mutate game logic state (moveQueue, board) from here!
// All game logic updates must go through orchestrator/services only.
// Мокаємо requestAnimationFrame для тестового середовища
if (typeof global !== 'undefined' && !global.requestAnimationFrame) {
  global.requestAnimationFrame = (cb: FrameRequestCallback): number => setTimeout(cb, 0) as unknown as number;
}

/**
 * Інтерфейс для стану анімації
 */

function createAnimationService() {
  const { subscribe, set, update } = writable<any>({
    // Тільки візуальні прапорці та анімаційні дані
    isAnimating: false,
    gameId: Date.now(),
    currentAnimation: null,
    visualMoveQueue: [], // Черга для візуалізації
    animationQueue: [], // Черга для анімацій
    isPlayingAnimation: false,
    isComputerMoveCompleted: true, // <-- Початковий стан
  });

  let lastProcessedMoveIndex = 0;
  let isInitialized = false;

  // === ФУНКЦІЇ ДЛЯ КЕРУВАННЯ ЧЕРГОЮ АНІМАЦІЙ ===

  /**
   * Додає хід в чергу анімацій
   */
  function addToAnimationQueue(move: any) {
    logService.animation('[animationStore] addToAnimationQueue called with move:', move);
    update(state => {
      const newQueue = [...state.animationQueue, move];
      logService.animation('[animationStore] addToAnimationQueue: new queue:', newQueue);
      if (!state.isPlayingAnimation) {
        // Якщо ми починаємо нову послідовність, очищаємо стару візуальну чергу
        state.visualMoveQueue = [];
        // Встановлюємо isAnimating в true, коли починаємо обробку першого елемента черги
        setTimeout(() => playNextAnimation(true), 0); 
      }
      return {
        ...state,
        animationQueue: newQueue
      };
    });
  }

  /**
   * Відтворює наступну анімацію з черги
   */
  function playNextAnimation(isFirstCall = false) {
    if (isFirstCall) {
      // На початку послідовності скидаємо прапорець
      update(s => ({ ...s, isAnimating: true, isPlayingAnimation: true, isComputerMoveCompleted: false }));
    }

    const state = get({ subscribe });

    if (state.animationQueue.length === 0) {
      update(s => ({ ...s, isAnimating: false, isPlayingAnimation: false }));
      return;
    }

    const move = state.animationQueue[0];
    
    update(s => ({
      ...s,
      visualMoveQueue: [...s.visualMoveQueue, move]
    }));

    const isPlayerMove = move.player === 1;
    const animationDuration = 500;
    
    const pauseAfterMove = isPlayerMove ? 101 : 100;

    setTimeout(() => {
      if (!isPlayerMove) {
        // Встановлюємо прапорець після ходу комп'ютера, або після будь-якого ходу в локальній грі
        update(s => ({ ...s, isComputerMoveCompleted: true }));
      }

      update(s => ({
        ...s,
        animationQueue: s.animationQueue.slice(1)
      }));
      
      if (isPlayerMove) {
        logService.animation('[animationStore] playNextAnimation: player move animation done, signaling playerMoveAnimationDone');
      }

      playNextAnimation(false);
    }, animationDuration + pauseAfterMove);
  }

  // === ФУНКЦІЯ ІНІЦІАЛІЗАЦІЇ ПІДПИСКИ ===

  function initializeSubscription(): void {
    if (isInitialized) return;
    
    const initialGameState = get(gameState) as any;
    lastProcessedMoveIndex = initialGameState?.moveQueue?.length || 0;

    gameState.subscribe((currentState: any | null) => {
      if (!currentState) {
        // Гра завершена, скидаємо стан анімації
        set({
          isAnimating: false,
          gameId: 0,
          currentAnimation: null,
          visualMoveQueue: [],
          animationQueue: [],
          isPlayingAnimation: false,
          isComputerMoveCompleted: true,
        });
        lastProcessedMoveIndex = 0;
        return;
      }

      const animationState = get({ subscribe });

      if (currentState.gameId !== animationState.gameId) {
        logService.animation('AnimationStore: New game, gameId changed from', animationState.gameId, 'to', currentState.gameId);
        lastProcessedMoveIndex = 0;

        // КРОК 1: Миттєво скидаємо стан для нової гри
        set({
          isAnimating: false,
          gameId: currentState.gameId,
          currentAnimation: null,
          visualMoveQueue: [], // Очищаємо visualMoveQueue при зміні гри
          animationQueue: [], // Очищаємо animationQueue при зміні гри
          isPlayingAnimation: false,
          isComputerMoveCompleted: true, // <-- Додано сюди
        });
        logService.animation('AnimationStore: Cleared animationQueue on gameId change');

        return;
      }

      // Обробляємо нові ходи в moveQueue
      const newMoves = currentState.moveQueue.slice(lastProcessedMoveIndex);
      if (newMoves.length > 0) {
        newMoves.forEach((move: any) => addToAnimationQueue(move));
        lastProcessedMoveIndex = currentState.moveQueue.length;
      }
    });

    isInitialized = true;
  }

  // === ПУБЛІЧНІ МЕТОДИ ===

  return {
    subscribe,
    initialize: initializeSubscription,
    reset: () => {
      lastProcessedMoveIndex = 0;
      logService.animation('AnimationStore: reset() - clearing animationQueue');
      set({
        isAnimating: false,
        gameId: Date.now(),
        currentAnimation: null,
        visualMoveQueue: [],
        animationQueue: [],
        isPlayingAnimation: false,
        isComputerMoveCompleted: true, // <-- Додай сюди
      });
    },
    // Залишаємо тільки необхідні публічні методи
    startAnimation: () => update((state: any) => ({ ...state, isAnimating: true })),
    stopAnimation: () => update((state: any) => ({ ...state, isAnimating: false })),
  };
}

// Експортуємо єдиний екземпляр
export const animationStore = createAnimationService();

// === Оновлюємо функцію для анімації тільки останнього ходу ===