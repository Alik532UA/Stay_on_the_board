/**
 * Тести для gameLogicService
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';
import { get } from 'svelte/store';
import { gameState } from '$lib/stores/gameState';
import { performMove } from '$lib/services/gameLogicService';

// Мокаємо stateManager
vi.mock('./stateManager.js', () => ({
  stateManager: {
    applyChanges: vi.fn(),
    applyPlayerInputChanges: vi.fn()
  }
}));

describe('Game Logic Service', () => {
  beforeEach(() => {
    // Скидаємо стан перед кожним тестом
    gameState.set({
      playerRow: 0,
      playerCol: 0,
      boardSize: 8,
      score: 0,
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
        { id: 0, name: 'Player 1', type: 'human' },
        { id: 1, name: 'AI', type: 'ai' }
      ],
      movesInBlockMode: 0,
      jumpedBlockedCells: 0,
      finishedByFinishButton: false,
      gameOverReasonKey: null,
      gameOverReasonValues: null,
      noMovesBonus: 0,
      noMovesClaimsCount: 0
    });
  });

  test('performMove повинен працювати правильно', async () => {
    const state = get(gameState);
    const moveResult = await performMove('down', 1, get(gameState));
    
    expect(moveResult.success).toBe(true);
    expect(moveResult.newPosition).toBeDefined();
    expect(moveResult.newPosition.row).toBe(1);
    expect(moveResult.newPosition.col).toBe(0);
  });

  test('performMove повинен перевіряти межі дошки', async () => {
    const moveResult = await performMove('up', 1, get(gameState));
    
    expect(moveResult.success).toBe(false);
    expect(moveResult.error).toBeDefined();
  });
}); 