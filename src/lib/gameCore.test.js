import { describe, test, expect, beforeEach, vi } from 'vitest';
import { get } from 'svelte/store';
import { gameState } from '$lib/stores/gameState';
import { gameLogicService } from '$lib/services/gameLogicService';

// Мокаємо requestAnimationFrame ПЕРЕД імпортом
global.requestAnimationFrame = vi.fn((cb: FrameRequestCallback) => {
  const id = setTimeout(cb, 0);
  return id as number;
});

describe('Game Core Logic', () => {
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

  test('гра повинна ініціалізуватися правильно', () => {
    const state = get(gameState);
    expect(state.playerRow).toBe(0);
    expect(state.playerCol).toBe(0);
    expect(state.boardSize).toBe(8);
    expect(state.score).toBe(0);
    expect(state.isGameOver).toBe(false);
  });

  test('логіка руху повинна працювати', () => {
    const state = get(gameState);
    const moveResult = gameLogicService.performMove('down', 1);
    
    expect(moveResult.success).toBe(true);
    expect(moveResult.newRow).toBe(1);
    expect(moveResult.newCol).toBe(0);
  });

  test('перевірка меж дошки', () => {
    const state = get(gameState);
    const moveResult = gameLogicService.performMove('up', 1);
    
    expect(moveResult.success).toBe(false);
    expect(moveResult.reason).toBe('out_of_bounds');
  });
});