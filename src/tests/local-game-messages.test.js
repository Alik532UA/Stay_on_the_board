import { describe, it, expect, beforeEach, vi } from 'vitest';
import { get } from 'svelte/store';
import { gameState } from '$lib/stores/gameState.js';
import { lastPlayerMove, lastComputerMove, isPauseBetweenMoves } from '$lib/stores/derivedState.ts';

// Мокаємо svelte-i18n
vi.mock('svelte-i18n', () => ({
  _: vi.fn((/** @type {string} */ key, /** @type {any} */ options) => {
         const translations = {
       'localGame.gameStarted': 'Гра почалась!\n{playerName} ваша черга робити хід',
       'localGame.playerMadeMove': '{playerName} зробив хід: {direction} на {distance}.\n{nextPlayerName} ваша черга робити хід!',
      'localGame.playerTurn': 'Хід гравця: {playerName}',
      'gameBoard.directions.up': 'вгору',
      'gameBoard.directions.down': 'вниз',
      'gameBoard.directions.left': 'вліво',
      'gameBoard.directions.right': 'вправо',
      'gameBoard.directions.upLeft': 'вгору-вліво',
      'gameBoard.directions.upRight': 'вгору-вправо',
      'gameBoard.directions.downLeft': 'вниз-вліво',
      'gameBoard.directions.downRight': 'вниз-вправо'
    };
    
    if (options && options.values) {
      let result = /** @type {string} */ (translations[/** @type {keyof typeof translations} */ (key)] || key);
      Object.entries(options.values).forEach(([placeholder, value]) => {
        result = result.replace(`{${placeholder}}`, value);
      });
      return result;
    }
    
    return /** @type {string} */ (translations[/** @type {keyof typeof translations} */ (key)] || key);
  })
}));

describe('Local Game Messages', () => {
  beforeEach(() => {
    // Скидаємо стан гри
    gameState.set({
      gameId: 1,
      boardSize: 5,
      playerRow: 2,
      playerCol: 2,
      isGameOver: false,
      isFirstMove: false,
      wasResumed: false,
      currentPlayerIndex: 0,
      players: [
        /** @type {any} */ ({ name: 'Гравець 1', type: 'human', color: '#ff0000', score: 0 }),
        /** @type {any} */ ({ name: 'Гравець 2', type: 'human', color: '#00ff00', score: 0 })
      ],
      moveQueue: [],
      availableMoves: [],
      cellVisitCounts: {},
      board: Array(5).fill().map(() => Array(5).fill(0)),
      penaltyPoints: 0,
      movesInBlockMode: 0,
      jumpedBlockedCells: 0,
      finishedByFinishButton: false,
      moveHistory: [],
      gameOverReasonKey: null,
      gameOverReasonValues: null,
      noMovesClaimsCount: 0,
      noMovesClaimed: false,
      noMovesBonus: 0
    });
  });

  describe('lastPlayerMove derived store', () => {
    it('повинен повертати null для порожньої черги', () => {
      const result = get(lastPlayerMove);
      expect(result).toBeNull();
    });

    it('повинен повертати останній хід гравця', () => {
      // Додаємо хід гравця
      gameState.update(state => ({
        ...state,
        moveQueue: [
          { player: 1, direction: 'up', distance: 1, row: 1, col: 2 }
        ]
      }));

      const result = get(lastPlayerMove);
      expect(result).toEqual({
        direction: 'up',
        distance: 1
      });
    });

    it('повинен оновлюватися після ходу другого гравця', () => {
      // Додаємо хід першого гравця
      gameState.update(state => ({
        ...state,
        moveQueue: [
          { player: 1, direction: 'up', distance: 1, row: 1, col: 2 }
        ]
      }));

      let result = get(lastPlayerMove);
      expect(result).toEqual({
        direction: 'up',
        distance: 1
      });

      // Додаємо хід другого гравця
      gameState.update(state => ({
        ...state,
        moveQueue: [
          { player: 1, direction: 'up', distance: 1, row: 1, col: 2 },
          { player: 1, direction: 'down', distance: 1, row: 3, col: 2 }
        ]
      }));

      result = get(lastPlayerMove);
      expect(result).toEqual({
        direction: 'down',
        distance: 1
      });
    });

    it('повинен повертати null для гри з комп\'ютером', () => {
      // Змінюємо на гру з комп'ютером
      gameState.update(state => ({
        ...state,
        players: [
          { id: 1, name: 'Гравець', type: 'human', score: 0 },
          { id: 2, name: 'Комп\'ютер', type: 'ai', score: 0 }
        ],
        moveQueue: [
          { player: 1, direction: 'up', distance: 1, row: 1, col: 2 }
        ]
      }));

      const result = get(lastPlayerMove);
      expect(result).toBeNull();
    });
  });

  describe('lastComputerMove derived store', () => {
    it('повинен повертати null для локальної гри', () => {
      // Додаємо хід гравця в локальній грі
      gameState.update(state => ({
        ...state,
        moveQueue: [
          { player: 1, direction: 'up', distance: 1, row: 1, col: 2 },
          { player: 1, direction: 'down', distance: 1, row: 3, col: 2 }
        ]
      }));

      const result = get(lastComputerMove);
      expect(result).toBeNull();
    });

    it('повинен повертати хід комп\'ютера для гри з комп\'ютером', () => {
      // Змінюємо на гру з комп'ютером і додаємо хід комп'ютера
      gameState.update(state => ({
        ...state,
        players: [
          { id: 1, name: 'Гравець', type: 'human', score: 0 },
          { id: 2, name: 'Комп\'ютер', type: 'ai', score: 0 }
        ],
        moveQueue: [
          { player: 1, direction: 'up', distance: 1, row: 1, col: 2 },
          { player: 2, direction: 'down', distance: 1, row: 3, col: 2 }
        ]
      }));

      const result = get(lastComputerMove);
      expect(result).toEqual({
        direction: 'down',
        distance: 1
      });
    });
  });

  describe('isPauseBetweenMoves derived store', () => {
    it('повинен повертати false для локальної гри після ходу гравця', () => {
      // Додаємо хід гравця
      gameState.update(state => ({
        ...state,
        moveQueue: [
          { player: 1, direction: 'up', distance: 1, row: 1, col: 2 }
        ]
      }));

      const result = get(isPauseBetweenMoves);
      expect(result).toBe(false);
    });

    it('повинен повертати true для гри з комп\'ютером після ходу гравця', () => {
      // Змінюємо на гру з комп'ютером
      gameState.update(state => ({
        ...state,
        players: [
          { id: 1, name: 'Гравець', type: 'human', score: 0 },
          { id: 2, name: 'Комп\'ютер', type: 'ai', score: 0 }
        ],
        moveQueue: [
          { player: 1, direction: 'up', distance: 1, row: 1, col: 2 }
        ]
      }));

      const result = get(isPauseBetweenMoves);
      expect(result).toBe(true);
    });

    it('повинен повертати false для гри з комп\'ютером після ходу комп\'ютера', () => {
      // Змінюємо на гру з комп'ютером і додаємо хід комп'ютера
      gameState.update(state => ({
        ...state,
        players: [
          { id: 1, name: 'Гравець', type: 'human', score: 0 },
          { id: 2, name: 'Комп\'ютер', type: 'ai', score: 0 }
        ],
        moveQueue: [
          { player: 1, direction: 'up', distance: 1, row: 1, col: 2 },
          { player: 2, direction: 'down', distance: 1, row: 3, col: 2 }
        ]
      }));

      const result = get(isPauseBetweenMoves);
      expect(result).toBe(false);
    });
  });
}); 