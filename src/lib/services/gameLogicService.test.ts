/**
 * Тести для gameLogicService
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';
import { get } from 'svelte/store';
import { gameState } from '$lib/stores/gameState';
import { settingsStore } from '$lib/stores/settingsStore';
import { performMove, resetGame } from '$lib/services/gameLogicService';

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
        { id: 0, name: 'Player 1', type: 'human', score: 0, color: '#e63946', isComputer: false, penaltyPoints: 0, bonusPoints: 0, bonusHistory: [] },
        { id: 1, name: 'AI', type: 'ai', score: 0, color: '#457b9d', isComputer: true, penaltyPoints: 0, bonusPoints: 0, bonusHistory: [] }
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
      wasResumed: false,
      settings: {
        boardSize: 8,
        blockModeEnabled: false,
        autoHideBoard: false,
        lockSettings: false
      },
      scoresAtRoundStart: [0, 0]
    });
  });

  test('performMove повинен працювати правильно', async () => {
    const state = get(gameState);
    const moveResult = await performMove('down', 1, 0, get(gameState), get(settingsStore));
    
    expect(moveResult.success).toBe(true);
    expect(moveResult.newPosition).toBeDefined();
    expect(moveResult.newPosition.row).toBe(1);
    expect(moveResult.newPosition.col).toBe(0);
  });

  test('performMove повинен перевіряти межі дошки', async () => {
    const moveResult = await performMove('up', 1, 0, get(gameState), get(settingsStore));
    
    expect(moveResult.success).toBe(false);
    // Перевіряємо, що є помилка або error властивість
    expect('error' in moveResult || 'newPosition' in moveResult).toBe(true);
  });

  test('resetGame повинен створювати новий стан з правильним розміром', () => {
    // Спочатку встановлюємо поточний розмір 8
    gameState.update(state => ({ ...state, boardSize: 8 }));
    
    // Скидаємо гру з новим розміром 6
    resetGame({ newSize: 6 }, get(gameState));
    
    const newState = get(gameState);
    
    expect(newState.boardSize).toBe(6);
    expect(newState.board.length).toBe(6);
    expect(newState.board[0].length).toBe(6);
    expect(newState.availableMoves.length).toBeGreaterThan(0);
    expect(newState.playerRow).toBeGreaterThanOrEqual(0);
    expect(newState.playerCol).toBeGreaterThanOrEqual(0);
    expect(newState.playerRow).toBeLessThan(6);
    expect(newState.playerCol).toBeLessThan(6);
  });

  test('resetGame повинен використовувати поточний розмір якщо новий не вказаний', () => {
    // Встановлюємо поточний розмір 5
    gameState.update(state => ({ ...state, boardSize: 5 }));
    
    // Скидаємо гру без вказівки нового розміру
    resetGame({}, get(gameState));
    
    const newState = get(gameState);
    
    expect(newState.boardSize).toBe(5);
    expect(newState.board.length).toBe(5);
    expect(newState.board[0].length).toBe(5);
  });

  test('resetGame повинен встановлювати налаштування видимості', () => {
    // Спочатку вимикаємо всі налаштування видимості
    settingsStore.updateSettings({
      showBoard: false,
      showPiece: false,
      showMoves: false
    });
    
    // Скидаємо гру
    resetGame({}, get(gameState));
    
    const settings = get(settingsStore);
    
    // Перевіряємо, що налаштування видимості встановлені в true
    expect(settings.showBoard).toBe(true);
    expect(settings.showPiece).toBe(true);
    expect(settings.showMoves).toBe(true);
  });
}); 