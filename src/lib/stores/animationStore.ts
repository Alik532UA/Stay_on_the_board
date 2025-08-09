// src/lib/stores/animationStore.ts
import { writable, get, type Writable } from 'svelte/store';
import { isLocalGame } from './derivedState';

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
export interface AnimationState {
  isAnimating: boolean;
  gameId: number;
  currentAnimation: any | null;
  // Черга для візуалізації (тільки анімовані ходи)
  visualMoveQueue: any[];
  // Окрема черга для анімацій
  animationQueue: any[];
  isPlayingAnimation: boolean;
  isComputerMoveCompleted: boolean; // <-- НОВИЙ ПРАПОРЕЦЬ
}

/**
 * Інтерфейс для анімації
 */
export interface Animation {
  type: string;
  duration: number;
  data?: any;
}

/**
 * Інтерфейс для gameState
 */
export interface GameState {
  gameId: number;
  moveQueue: any[];
  moveHistory: any[];
  [key: string]: any;
}

/**
 * Тип для gameState store
 */
export type GameStateStore = Writable<GameState>;

export const playerMoveAnimationDone = writable(false);

function createAnimationService() {
  const { subscribe, set, update } = writable<AnimationState>({
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
  let gameState: GameStateStore | null = null; // Відкладаємо імпорт

  // === ФУНКЦІЇ ДЛЯ КЕРУВАННЯ ЧЕРГОЮ АНІМАЦІЙ ===

  /**
   * Додає хід в чергу анімацій
   */
  function addToAnimationQueue(move: any) {
    console.log('[animationStore] addToAnimationQueue викликано з move:', move);
    update(state => {
      const newQueue = [...state.animationQueue, move];
      console.log('[animationStore] addToAnimationQueue: нова черга:', newQueue);
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
    console.log('[animationStore] playNextAnimation: анімуємо хід:', move);
    
    update(s => ({
      ...s,
      visualMoveQueue: [...s.visualMoveQueue, move]
    }));

    const isPlayerMove = move.player === 1;
    const animationDuration = 500;
    
    const pauseAfterMove = isPlayerMove && !get(isLocalGame) ? 1000 : 100;

    setTimeout(() => {
      if (!isPlayerMove || get(isLocalGame)) {
        // Встановлюємо прапорець після ходу комп'ютера, або після будь-якого ходу в локальній грі
        update(s => ({ ...s, isComputerMoveCompleted: true }));
      }

      update(s => ({
        ...s,
        animationQueue: s.animationQueue.slice(1)
      }));
      
      if (isPlayerMove) {
        console.log('[animationStore] playNextAnimation: хід гравця завершено, сигналізуємо playerMoveAnimationDone');
        playerMoveAnimationDone.set(true);
      }

      playNextAnimation(false);
    }, animationDuration + pauseAfterMove);
  }

  // === ФУНКЦІЯ ІНІЦІАЛІЗАЦІЇ ПІДПИСКИ ===

  function initializeSubscription(): void {
    if (isInitialized) return;
    
    // Відкладаємо імпорт gameState до моменту використання
    if (!gameState) {
      try {
        // Використовуємо динамічний імпорт
        import('./gameState.js').then((module: any) => {
          gameState = module.gameState;
          initializeSubscription(); // Рекурсивно викликаємо після імпорту
        }).catch((err: Error) => {
          console.error('AnimationStore: Не вдалося імпортувати gameState:', err);
        });
        return;
      } catch (error) {
        console.error('AnimationStore: Помилка імпорту gameState:', error);
        return;
      }
    }
    
    // Захист від undefined gameState
    if (!gameState || typeof gameState.subscribe !== 'function') {
      console.error('AnimationStore: gameState is not properly initialized');
      return;
    }

    const initialGameState = get(gameState);
    lastProcessedMoveIndex = initialGameState?.moveQueue?.length || 0;

    gameState.subscribe((currentState: GameState) => {
      const animationState = get({ subscribe });

      if (currentState.gameId !== animationState.gameId) {
        console.log('AnimationStore: Нова гра, gameId змінився з', animationState.gameId, 'на', currentState.gameId);
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
        console.log('AnimationStore: Очищено animationQueue при зміні gameId');

        return;
      }

      // Обробляємо нові ходи в moveQueue
      const newMoves = currentState.moveQueue.slice(lastProcessedMoveIndex);
      if (newMoves.length > 0) {
        newMoves.forEach(move => addToAnimationQueue(move));
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
      console.log('AnimationStore: reset() - очищаємо animationQueue');
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
    startAnimation: () => update((state: AnimationState) => ({ ...state, isAnimating: true })),
    stopAnimation: () => update((state: AnimationState) => ({ ...state, isAnimating: false })),
  };
}

// Експортуємо єдиний екземпляр
export const animationStore = createAnimationService();

// === Оновлюємо функцію для анімації тільки останнього ходу ===
export function animateLastMove(move: any) {
  if (!move) return;
  // Додаємо хід в чергу анімацій через внутрішню логіку
  // Ця функція тепер не потрібна, оскільки анімація керується автоматично через підписку на gameState
  console.log('[animateLastMove] Функція застаріла, анімація керується автоматично');
} 