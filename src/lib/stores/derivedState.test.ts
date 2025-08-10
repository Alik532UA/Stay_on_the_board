/**
 * Тести для перевірки консистентності derived stores
 * Перевіряє, що візуальні дані завжди синхронізовані з логічними
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';
import { get } from 'svelte/store';
import { gameState } from '$lib/stores/gameState';
import { animationStore } from '$lib/stores/animationStore';

// Мокаємо requestAnimationFrame для тестів
global.requestAnimationFrame = vi.fn((cb: FrameRequestCallback) => {
  const id = setTimeout(cb, 0);
  return id as number;
});

describe('Derived State Tests', () => {
  beforeEach(() => {
    // Скидаємо стан перед кожним тестом
    gameState.set({
      playerRow: 0,
      playerCol: 0,
      boardSize: 8,
      penaltyPoints: 0,
      isGameOver: false,
      moveHistory: [],
      moveQueue: [],
      availableMoves: [],
      cellVisitCounts: {},
      board: Array(8).fill(null).map(() => Array(8).fill(0)),
      gameId: Date.now(),
      currentPlayerIndex: 0,
      players: [
        { id: 0, name: 'Player 1', type: 'human', score: 0 },
        { id: 1, name: 'AI', type: 'ai', score: 0 }
      ],
      movesInBlockMode: 0,
      jumpedBlockedCells: 0,
      finishedByFinishButton: false,
      gameOverReasonKey: null,
      gameOverReasonValues: null,
      noMovesBonus: 0,
      noMovesClaimsCount: 0,
      noMovesClaimed: false,
      isFirstMove: true,
      wasResumed: false
    });
  });

  test('зміни в animationStore не повинні впливати на логічні дані', () => {
    const initialGameState = get(gameState);
    // Змінюємо тільки візуальні прапорці через доступний метод
    animationStore.startAnimation();
    const currentGameState = get(gameState);
    
    // Логічні дані не повинні змінитися
    expect(currentGameState.playerRow).toBe(initialGameState.playerRow);
    expect(currentGameState.playerCol).toBe(initialGameState.playerCol);
  });
}); 