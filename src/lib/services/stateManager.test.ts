/**
 * Тести для StateManager
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';
import { get } from 'svelte/store';
import { gameState } from '$lib/stores/gameState';
import { stateManager } from '$lib/services/stateManager';

// Мокаємо requestAnimationFrame
global.requestAnimationFrame = vi.fn((cb: FrameRequestCallback) => {
  const id = setTimeout(cb, 0);
  return id as number;
});

describe('StateManager', () => {
  beforeEach(async () => {
    // Скидаємо стан перед кожним тестом
    gameState.set({
      playerRow: 0,
      playerCol: 0,
      boardSize: 8,
      score: 0,
      penaltyPoints: 0,
      isGameOver: false,
      moveHistory: [{ pos: { row: 0, col: 0 }, blocked: [], visits: {} }],
      moveQueue: [],
      availableMoves: [],
      cellVisitCounts: {},
      board: Array(8).fill(null).map(() => Array(8).fill(0)),
      gameId: Date.now(),
      currentPlayerIndex: 0,
      players: [
        { id: 0, name: 'Player 1', type: 'human' },
        { id: 1, name: 'AI', type: 'ai' }
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

    // Очищаємо історію
    stateManager.clearHistory();
    vi.clearAllMocks();
  });

  test('stateManager повинен ініціалізуватися правильно', async () => {
    const state = get(gameState);
    expect(state.playerRow).toBe(0);
    expect(state.playerCol).toBe(0);
    expect(state.isGameOver).toBe(false);
  });

  test('stateManager повинен валідувати зміни стану', async () => {
    const validationResult = await stateManager.validateChanges('MOVE_PLAYER', {
      playerRow: 1,
      playerCol: 1
    });
    
    expect(validationResult.isValid).toBe(true);
  });

  test('stateManager повинен застосовувати зміни стану', async () => {
    const changes = {
      playerRow: 2,
      playerCol: 2,
      score: 10
    };

    const result = await stateManager.applyChanges('MOVE_PLAYER', changes, 'Test move');
    expect(result).toBe(true);
    
    const state = get(gameState);
    expect(state.playerRow).toBe(2);
    expect(state.playerCol).toBe(2);
    expect(state.score).toBe(10);
  });
}); 