import { get } from 'svelte/store';
import { animationStore, type AnimationState } from '$lib/stores/animationStore';
import { gameState } from '$lib/stores/gameState';
import { logService } from './logService';

function createAnimationService() {
  let lastProcessedMoveIndex = 0;
  let isInitialized = false;

  function addToAnimationQueue(move: any) {
    logService.animation('[AnimationService] addToAnimationQueue:', move);
    animationStore.update(state => {
      const newQueue = [...state.animationQueue, move];
      if (!state.isPlayingAnimation) {
        // Запускаємо чергу анімацій асинхронно, щоб Svelte встиг обробити зміни
        setTimeout(() => playNextAnimation(true), 0);
      }
      return { ...state, animationQueue: newQueue };
    });
  }

  function playNextAnimation(isFirstCall = false) {
    if (isFirstCall) {
      // Встановлюємо прапорці на початку всієї послідовності анімацій
      animationStore.update(s => ({ ...s, isAnimating: true, isPlayingAnimation: true, isComputerMoveCompleted: false, visualMoveQueue: [] }));
    }

    const state = get(animationStore);
    if (state.animationQueue.length === 0) {
      // Завершуємо анімацію, коли черга порожня
      animationStore.update(s => ({ ...s, isAnimating: false, isPlayingAnimation: false }));
      return;
    }

    const move = state.animationQueue[0]; // Беремо перший хід з черги
    animationStore.update(s => ({
      ...s,
      visualMoveQueue: [...s.visualMoveQueue, move] // Додаємо до візуальної черги для рендерингу
    }));

    const isPlayerMove = move.player === 1;
    const animationDuration = 500; // Тривалість CSS анімації руху
    // ЗМІНЕНО: Пауза після ходу гравця тепер 1 секунда. Це створює ефект "роздумів" комп'ютера.
    const pauseAfterMove = isPlayerMove ? 1000 : 100;

    setTimeout(() => {
      if (!isPlayerMove) {
        // Позначаємо, що анімація ходу комп'ютера завершена
        animationStore.update(s => ({ ...s, isComputerMoveCompleted: true }));
      }
      // Видаляємо оброблений хід з черги
      animationStore.update(s => ({
        ...s,
        animationQueue: s.animationQueue.slice(1)
      }));
      // Рекурсивно викликаємо для наступного ходу
      playNextAnimation(false);
    }, animationDuration + pauseAfterMove);
  }

  function initializeSubscription(): void {
    if (isInitialized) return;

    const initialGameState = get(gameState) as any;
    lastProcessedMoveIndex = initialGameState?.moveQueue?.length || 0;

    gameState.subscribe((currentState: any | null) => {
      if (!currentState) {
        animationStore.reset();
        lastProcessedMoveIndex = 0;
        return;
      }

      const newMoves = currentState.moveQueue.slice(lastProcessedMoveIndex);
      if (newMoves.length > 0) {
        newMoves.forEach(addToAnimationQueue);
        lastProcessedMoveIndex = currentState.moveQueue.length;
      }
    });

    isInitialized = true;
  }

  return {
    initialize: initializeSubscription,
    reset: () => {
      logService.animation('[AnimationService] reset() called');
      animationStore.reset();
      lastProcessedMoveIndex = 0;
    }
  };
}

export const animationService = createAnimationService();