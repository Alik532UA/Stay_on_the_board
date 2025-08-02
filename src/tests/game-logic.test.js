// src/tests/game-logic.test.js
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { get } from 'svelte/store';
import { gameState } from '$lib/stores/gameState.js';
import { playerInputStore } from '$lib/stores/playerInputStore.js';
import { gameOrchestrator } from '$lib/gameOrchestrator';
import * as gameLogicService from '$lib/services/gameLogicService.js';

// Мокаємо setTimeout для контролю анімацій
vi.useFakeTimers();

describe('Game Logic - Правила ходів', () => {
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
  });

  describe('Хід гравця - Правила руху', () => {
    it('повинен правильно обчислювати позицію для напрямку "вниз-праворуч"', async () => {
      console.log('Тест починається');
      console.log('gameOrchestrator:', gameOrchestrator);
      console.log('confirmPlayerMove:', gameOrchestrator.confirmPlayerMove);
      
      // Встановлюємо вибір гравця
      playerInputStore.set({
        selectedDirection: 'down-right',
        selectedDistance: 1,
        isMoveInProgress: false,
        distanceManuallySelected: false
      });

      console.log('Вибір гравця встановлено');
      
      // Підтверджуємо хід гравця
      await gameOrchestrator.confirmPlayerMove();
      
      console.log('confirmPlayerMove виконано');

      // Додаємо логування для діагностики
      const state = get(gameState);
      console.log('Після ходу:', {
        playerRow: state.playerRow,
        playerCol: state.playerCol,
        boardSize: state.boardSize,
        moveQueue: state.moveQueue,
        moveHistory: state.moveHistory
      });

      // Перевіряємо, що позиція оновлена правильно
      expect(state.playerRow).toBe(2); // 1 + 1 = 2
      expect(state.playerCol).toBe(2); // 1 + 1 = 2
    });

    it('повинен правильно обчислювати позицію для напрямку "ліворуч"', async () => {
      // Встановлюємо вибір гравця
      playerInputStore.set({
        selectedDirection: 'left',
        selectedDistance: 1,
        isMoveInProgress: false,
        distanceManuallySelected: false
      });

      // Підтверджуємо хід гравця
      await gameOrchestrator.confirmPlayerMove();

      // Перевіряємо, що позиція оновлена правильно
      const state = get(gameState);
      expect(state.playerRow).toBe(1); // залишається 1
      expect(state.playerCol).toBe(0); // 1 - 1 = 0
    });
  });

  describe('Валідність ходів', () => {
    it('повинен відхиляти хід за межі дошки', async () => {
      // Встановлюємо вибір гравця для ходу за межі дошки
      playerInputStore.set({
        selectedDirection: 'up',
        selectedDistance: 3, // Достатньо, щоб вийти за межі дошки 4x4
        isMoveInProgress: false,
        distanceManuallySelected: false
      });

      // Підтверджуємо хід гравця
      await gameOrchestrator.confirmPlayerMove();

      // Перевіряємо, що позиція не змінилася (хід відхилений)
      const state = get(gameState);
      expect(state.playerRow).toBe(1); // залишається початкова позиція
      expect(state.playerCol).toBe(1);
    });

    it('повинен приймати валідний хід в межах дошки', async () => {
      // Встановлюємо вибір гравця для валідного ходу
      playerInputStore.set({
        selectedDirection: 'right',
        selectedDistance: 1,
        isMoveInProgress: false,
        distanceManuallySelected: false
      });

      // Підтверджуємо хід гравця
      await gameOrchestrator.confirmPlayerMove();

      // Перевіряємо, що позиція оновлена
      const state = get(gameState);
      expect(state.playerRow).toBe(1); // залишається 1
      expect(state.playerCol).toBe(2); // 1 + 1 = 2
    });
  });

  describe('moveQueue для анімації', () => {
    it('повинен додавати хід гравця до moveQueue', async () => {
      // Встановлюємо вибір гравця
      playerInputStore.set({
        selectedDirection: 'down',
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
        player: 1, // Гравець
        direction: 'down',
        distance: 1
      });
    });

    it('повинен додавати хід комп\'ютера до moveQueue після затримки', async () => {
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
      
      // Чекаємо завершення всіх промісів
      await vi.runAllTimersAsync();

      // Перевіряємо, що комп'ютер зробив хід
      const state = get(gameState);
      expect(state.moveQueue.length).toBeGreaterThanOrEqual(2);
      expect(state.moveQueue[1].player).toBe(2); // Комп'ютер
    }, 10000); // Збільшуємо таймаут до 10 секунд
  });

  describe('Очищення вибору гравця', () => {
    it('повинен очищати вибір гравця після ходу', async () => {
      // Встановлюємо вибір гравця
      playerInputStore.set({
        selectedDirection: 'up',
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
      expect(inputState.isMoveInProgress).toBe(false);
      expect(inputState.distanceManuallySelected).toBe(false);
    });
  });

  describe('Історія ходів', () => {
    it('повинен додавати хід до moveHistory', async () => {
      // Встановлюємо вибір гравця
      playerInputStore.set({
        selectedDirection: 'down',
        selectedDistance: 1,
        isMoveInProgress: false,
        distanceManuallySelected: false
      });

      // Підтверджуємо хід гравця
      await gameOrchestrator.confirmPlayerMove();

      // Перевіряємо, що хід додано до історії
      const state = get(gameState);
      expect(state.moveHistory).toHaveLength(2); // Початкова позиція + новий хід
      expect(state.moveHistory[1].pos).toEqual({ row: 2, col: 1 });
    });
  });
}); 