// src/tests/replay-functionality.test.js
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { get } from 'svelte/store';
import { gameState } from '$lib/stores/gameState.js';
import { gameOrchestrator } from '$lib/gameOrchestrator';

// Мокаємо goto та base
vi.mock('$app/navigation', () => ({
  goto: vi.fn()
}));

vi.mock('$app/paths', () => ({
  base: ''
}));

// Мокаємо sessionStorage
const mockSessionStorage = {
  setItem: vi.fn(),
  getItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};

Object.defineProperty(window, 'sessionStorage', {
  value: mockSessionStorage,
  writable: true
});

describe('Replay Functionality', () => {
  beforeEach(() => {
    // Очищаємо моки перед кожним тестом
    vi.clearAllMocks();
    
    // Скидаємо стан гри
    gameState.set({
      gameId: Date.now(),
      boardSize: 4,
      board: Array(4).fill().map(() => Array(4).fill(0)),
      playerRow: 2,
      playerCol: 2,
      availableMoves: [],
      players: [
        { id: 1, type: 'human', name: 'Player' },
        { id: 2, type: 'ai', name: 'AI' }
      ],
      currentPlayerIndex: 0,
      isGameOver: false,
      score: 10,
      penaltyPoints: 0,
      movesInBlockMode: 0,
      jumpedBlockedCells: 0,
      finishedByFinishButton: false,
      cellVisitCounts: {},
      moveHistory: [
        { pos: { row: 1, col: 1 }, blocked: [], visits: {} },
        { pos: { row: 2, col: 2 }, blocked: [], visits: {} }
      ],
      moveQueue: [],
      gameOverReasonKey: null,
      gameOverReasonValues: null,
      noMovesClaimsCount: 0,
      noMovesClaimed: false,
      isFirstMove: true,
      wasResumed: false
    });
  });

  afterEach(() => {
    // Очищаємо sessionStorage після кожного тесту
    mockSessionStorage.clear();
  });

  describe('startReplay', () => {
    it('повинен зберігати дані в sessionStorage та переходити на сторінку replay', async () => {
      const { goto } = await import('$app/navigation');
      
      // Викликаємо функцію
      await gameOrchestrator.startReplay();
      
      // Перевіряємо, що дані збережені в sessionStorage
      expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
        'replayData',
        JSON.stringify({
          moveHistory: [
            { pos: { row: 1, col: 1 }, blocked: [], visits: {} },
            { pos: { row: 2, col: 2 }, blocked: [], visits: {} }
          ],
          boardSize: 4
        })
      );
      
      // Перевіряємо, що викликається goto
      expect(goto).toHaveBeenCalledWith('/replay');
    });

    it('повинен виводити попередження, якщо немає історії ходів', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      // Встановлюємо порожню історію ходів
      gameState.set({
        ...get(gameState),
        moveHistory: []
      });
      
      // Викликаємо функцію
      await gameOrchestrator.startReplay();
      
      // Перевіряємо, що виводиться попередження
      expect(consoleSpy).toHaveBeenCalledWith("startReplay called with no move history.");
      
      // Перевіряємо, що sessionStorage не викликається
      expect(mockSessionStorage.setItem).not.toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });

    it('повинен обробляти помилки при збереженні даних', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const { goto } = await import('$app/navigation');
      
      // Симулюємо помилку при збереженні в sessionStorage
      mockSessionStorage.setItem.mockImplementation(() => {
        throw new Error('Storage error');
      });
      
      // Викликаємо функцію
      await gameOrchestrator.startReplay();
      
      // Перевіряємо, що помилка логується
      expect(consoleSpy).toHaveBeenCalledWith(
        "Failed to save replay data or navigate:",
        expect.any(Error)
      );
      
      consoleSpy.mockRestore();
    });
  });
}); 