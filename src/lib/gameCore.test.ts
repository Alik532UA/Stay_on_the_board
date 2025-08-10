import { describe, test, expect, beforeEach, vi } from 'vitest';
import { get } from 'svelte/store';
import { gameState } from '$lib/stores/gameState';
import { settingsStore } from '$lib/stores/settingsStore';
import { performMove } from '$lib/services/gameLogicService';

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

  test('гра повинна ініціалізуватися правильно', () => {
    const state = get(gameState);
    expect(state.playerRow).toBe(0);
    expect(state.playerCol).toBe(0);
    expect(state.boardSize).toBe(8);
    expect(state.isGameOver).toBe(false);
  });

  test('логіка руху повинна працювати', async () => {
    const state = get(gameState);
    const settings = get(settingsStore);
    const moveResult = await performMove('down', 1, 0, state, settings);
    
    expect(moveResult.success).toBe(true);
    expect(moveResult.newPosition).toBeDefined();
    expect(moveResult.newPosition.row).toBe(1);
    expect(moveResult.newPosition.col).toBe(0);
  });

  test('перевірка меж дошки', async () => {
    const state = get(gameState);
    const settings = get(settingsStore);
    const moveResult = await performMove('up', 1, 0, state, settings);
    
    expect(moveResult.success).toBe(false);
    // Перевіряємо, що є помилка або error властивість
    expect('error' in moveResult || 'newPosition' in moveResult).toBe(true);
  });
});