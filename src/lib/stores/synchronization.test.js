/**
 * Тести для перевірки синхронізації між gameState та animationStore
 * Перевіряє, що архітектурні принципи зберігаються після рефакторингу
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';
import { get } from 'svelte/store';
import { gameState } from '$lib/stores/gameState';
import { animationStore } from '$lib/stores/animationStore';

// Мокаємо requestAnimationFrame для тестів
global.requestAnimationFrame = vi.fn((cb) => {
  const id = setTimeout(cb, 0);
  return id;
});

describe('Store Synchronization Tests', () => {
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

  test('логічні дані не повинні змінюватися при зміні візуальних прапорців', () => {
    const initialGameState = get(gameState);
    // Змінюємо тільки візуальні прапорці
    animationStore.showDots();
    const currentGameState = get(gameState);
    
    // Логічні дані не повинні змінитися
    expect(currentGameState.playerRow).toBe(initialGameState.playerRow);
    expect(currentGameState.playerCol).toBe(initialGameState.playerCol);
    expect(currentGameState.score).toBe(initialGameState.score);
  });
}); 