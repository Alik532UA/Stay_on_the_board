// src/tests/animation-test.js
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { get } from 'svelte/store';
import { gameState } from '$lib/stores/gameState.js';
import { playerInputStore } from '$lib/stores/playerInputStore.js';
import { animationStore } from '$lib/stores/animationStore.js';
import { gameOrchestrator } from '$lib/gameOrchestrator';

// Мокаємо setTimeout для контролю анімацій
vi.useFakeTimers();

describe('Animation and Move Flow', () => {
  beforeEach(() => {
    // Скидаємо стан перед кожним тестом
    gameState.set({
      gameId: Date.now(),
      boardSize: 4,
      board: Array(4).fill().map(() => Array(4).fill(0)),
      playerRow: 1,
      playerCol: 1,
      availableMoves: [],
      players: [
        { id: 1, type: 'human', name: 'Гравець' },
        { id: 2, type: 'ai', name: 'Комп\'ютер' }
      ],
      currentPlayerIndex: 0,
      isGameOver: false,
      score: 0,
      penaltyPoints: 0,
      movesInBlockMode: 0,
      jumpedBlockedCells: 0,
      finishedByFinishButton: false,
      cellVisitCounts: {},
      moveHistory: [{ pos: { row: 1, col: 1 }, blocked: [], visits: {} }],
      gameOverReasonKey: null,
      gameOverReasonValues: null,
      moveQueue: [],
      noMovesClaimsCount: 0,
      noMovesClaimed: false,
      isFirstMove: true,
      wasResumed: false
    });

    playerInputStore.set({
      selectedDirection: null,
      selectedDistance: null,
      isMoveInProgress: false,
      distanceManuallySelected: false
    });

    animationStore.reset();
  });

  it('should animate player move correctly', async () => {
    // Встановлюємо вибір гравця
    playerInputStore.set({
      selectedDirection: 'up',
      selectedDistance: 1,
      isMoveInProgress: false,
      distanceManuallySelected: false
    });

    // Підтверджуємо хід гравця
    await gameOrchestrator.confirmPlayerMove();

    // Перевіряємо, що хід додано до moveQueue
    const state = get(gameState);
    expect(state.moveQueue).toHaveLength(1);
    expect(state.moveQueue[0]).toEqual({
      player: 1,
      direction: 'up',
      distance: 1
    });

    // Перевіряємо, що позиція оновлена
    expect(state.playerRow).toBe(0); // 1 - 1 = 0
    expect(state.playerCol).toBe(1); // залишається 1
  });

  it('should trigger computer move after player move', async () => {
    // Встановлюємо вибір гравця
    playerInputStore.set({
      selectedDirection: 'right',
      selectedDistance: 1,
      isMoveInProgress: false,
      distanceManuallySelected: false
    });

    // Підтверджуємо хід гравця
    await gameOrchestrator.confirmPlayerMove();

    // Переміщуємо час вперед на 1 секунду для ходу комп'ютера
    vi.advanceTimersByTime(1000);

    // Перевіряємо, що комп'ютер зробив хід
    const state = get(gameState);
    expect(state.moveQueue).toHaveLength(2);
    expect(state.moveQueue[1].player).toBe(2); // Комп'ютер
  });

  it('should show animation during moves', async () => {
    // Встановлюємо вибір гравця
    playerInputStore.set({
      selectedDirection: 'down',
      selectedDistance: 1,
      isMoveInProgress: false,
      distanceManuallySelected: false
    });

    // Підтверджуємо хід гравця
    await gameOrchestrator.confirmPlayerMove();

    // Перевіряємо, що анімація активна
    const animState = get(animationStore);
    expect(animState.isAnimating).toBe(true);

    // Переміщуємо час вперед для завершення анімації
    vi.advanceTimersByTime(500);

    // Перевіряємо, що анімація завершена
    const finalAnimState = get(animationStore);
    expect(finalAnimState.isAnimating).toBe(false);
  });

  it('should clear player input after move', async () => {
    // Встановлюємо вибір гравця
    playerInputStore.set({
      selectedDirection: 'left',
      selectedDistance: 1,
      isMoveInProgress: false,
      distanceManuallySelected: false
    });

    // Підтверджуємо хід гравця
    await gameOrchestrator.confirmPlayerMove();

    // Перевіряємо, що вибір очищено
    const inputState = get(playerInputStore);
    expect(inputState.selectedDirection).toBe(null);
    expect(inputState.selectedDistance).toBe(null);
  });
}); 