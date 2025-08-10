// src/tests/out-of-bounds-move.test.js
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { get } from 'svelte/store';
import { gameState } from '$lib/stores/gameState.js';
import { playerInputStore } from '$lib/stores/playerInputStore.js';
import { gameOrchestrator } from '$lib/gameOrchestrator';
import * as gameLogicService from '$lib/services/gameLogicService.js';

// Мокаємо setTimeout для контролю анімацій
vi.useFakeTimers();

describe('Out of Bounds Move Handling', () => {
  beforeEach(() => {
    // Скидаємо стан перед кожним тестом
    gameState.set({
      gameId: Date.now(),
      boardSize: 4,
      board: Array(4).fill().map(() => Array(4).fill(0)),
      playerRow: 0, // Гравець на краю дошки
      playerCol: 0,
      availableMoves: [],
      players: [
        { id: 1, type: 'human', name: 'Гравець', score: 0 },
        { id: 2, type: 'ai', name: 'Комп\'ютер', score: 0 }
      ],
      currentPlayerIndex: 0,
      isGameOver: false,
      penaltyPoints: 0,
      movesInBlockMode: 0,
      jumpedBlockedCells: 0,
      finishedByFinishButton: false,
      cellVisitCounts: {},
      moveHistory: [{ pos: { row: 0, col: 0 }, blocked: [], visits: {} }],
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
  });

  describe('confirmPlayerMove - Out of Bounds', () => {
    it('повинен обробляти хід за межі дошки як поразку', async () => {
      // Встановлюємо хід, який виведе за межі дошки
      playerInputStore.set({
        selectedDirection: 'up',
        selectedDistance: 1,
        isMoveInProgress: false,
        distanceManuallySelected: false
      });

      // Мокаємо performMove щоб повернути невдалий результат
      const mockPerformMove = vi.spyOn(gameLogicService, 'performMove').mockResolvedValue({
        success: false,
        reason: 'out_of_bounds'
      });

      // Мокаємо endGame
      const mockEndGame = vi.spyOn(gameOrchestrator, 'endGame').mockResolvedValue();

      // Підтверджуємо хід гравця
      await gameOrchestrator.confirmPlayerMove();

      // Перевіряємо, що performMove був викликаний
      expect(mockPerformMove).toHaveBeenCalledWith('up', 1, 0);

      // Перевіряємо, що endGame був викликаний з правильною причиною
      expect(mockEndGame).toHaveBeenCalledWith('modal.gameOverReasonOut');

      // Перевіряємо, що гра завершена
      const state = get(gameState);
      expect(state.isGameOver).toBe(true);

      mockPerformMove.mockRestore();
      mockEndGame.mockRestore();
    });

    it('повинен обробляти хід на заблоковану клітинку як поразку', async () => {
      // Встановлюємо хід
      playerInputStore.set({
        selectedDirection: 'down',
        selectedDistance: 1,
        isMoveInProgress: false,
        distanceManuallySelected: false
      });

      // Мокаємо performMove щоб повернути невдалий результат
      const mockPerformMove = vi.spyOn(gameLogicService, 'performMove').mockResolvedValue({
        success: false,
        reason: 'blocked_cell'
      });

      // Мокаємо endGame
      const mockEndGame = vi.spyOn(gameOrchestrator, 'endGame').mockResolvedValue();

      // Підтверджуємо хід гравця
      await gameOrchestrator.confirmPlayerMove();

      // Перевіряємо, що performMove був викликаний
      expect(mockPerformMove).toHaveBeenCalledWith('down', 1, 0);

      // Перевіряємо, що endGame був викликаний з правильною причиною
      expect(mockEndGame).toHaveBeenCalledWith('modal.gameOverReasonBlocked');

      mockPerformMove.mockRestore();
      mockEndGame.mockRestore();
    });

    it('повинен обробляти успішний хід нормально', async () => {
      // Встановлюємо валідний хід
      playerInputStore.set({
        selectedDirection: 'down',
        selectedDistance: 1,
        isMoveInProgress: false,
        distanceManuallySelected: false
      });

      // Мокаємо performMove щоб повернути успішний результат
      const mockPerformMove = vi.spyOn(gameLogicService, 'performMove').mockResolvedValue({
        success: true,
        newPosition: { row: 1, col: 0 },
        bonusPoints: 0,
        penaltyPoints: 0
      });

      // Підтверджуємо хід гравця
      await gameOrchestrator.confirmPlayerMove();

      // Перевіряємо, що performMove був викликаний
      expect(mockPerformMove).toHaveBeenCalledWith('down', 1, 0);

      // Перевіряємо, що playerInput був очищений
      const playerInput = get(playerInputStore);
      expect(playerInput.selectedDirection).toBe(null);
      expect(playerInput.selectedDistance).toBe(null);

      mockPerformMove.mockRestore();
    });
  });
}); 