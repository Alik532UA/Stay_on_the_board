import { describe, it, expect, beforeEach, vi } from 'vitest';
import { get } from 'svelte/store';
import { gameState } from '$lib/stores/gameState.js';
import { playerInputStore } from '$lib/stores/playerInputStore.js';
import { gameOrchestrator } from '$lib/gameOrchestrator.js';
import * as gameLogicService from '$lib/services/gameLogicService.js';

// Мокаємо setTimeout для контролю анімацій
vi.useFakeTimers();

describe('Multiplayer Game Logic', () => {
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
        { id: 1, type: 'human', name: 'Гравець 1', score: 0 },
        { id: 2, type: 'human', name: 'Гравець 2', score: 0 },
        { id: 3, type: 'ai', name: 'Комп\'ютер', score: 0 }
      ],
      currentPlayerIndex: 0,
      isGameOver: false,
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

  describe('Перемикання ходів між гравцями', () => {
    it('повинен правильно перемикати хід між людьми', async () => {
      const initialState = get(gameState);
      expect(initialState.currentPlayerIndex).toBe(0);
      expect(initialState.players[0].type).toBe('human');
      expect(initialState.players[1].type).toBe('human');

      // Симулюємо хід першого гравця
      playerInputStore.set({
        selectedDirection: 'right',
        selectedDistance: 1,
        isMoveInProgress: false,
        distanceManuallySelected: false
      });

      await gameOrchestrator.confirmPlayerMove();

      const stateAfterFirstMove = get(gameState);
      expect(stateAfterFirstMove.currentPlayerIndex).toBe(1);
      expect(stateAfterFirstMove.players[stateAfterFirstMove.currentPlayerIndex].name).toBe('Гравець 2');
    });

    it('повинен запускати хід AI після ходу людини', async () => {
      // Встановлюємо поточного гравця як людину перед AI
      gameState.update(state => ({
        ...state,
        currentPlayerIndex: 1 // Гравець 2 (людина)
      }));

      const stateBeforeMove = get(gameState);
      expect(stateBeforeMove.players[stateBeforeMove.currentPlayerIndex].type).toBe('human');
      expect(stateBeforeMove.players[2].type).toBe('ai');

      // Симулюємо хід людини
      playerInputStore.set({
        selectedDirection: 'left',
        selectedDistance: 1,
        isMoveInProgress: false,
        distanceManuallySelected: false
      });

      await gameOrchestrator.confirmPlayerMove();

      const stateAfterMove = get(gameState);
      expect(stateAfterMove.currentPlayerIndex).toBe(2); // AI
      expect(stateAfterMove.players[stateAfterMove.currentPlayerIndex].type).toBe('ai');
    });

    it('повинен циклічно перемикати ходи', async () => {
      const initialState = get(gameState);
      expect(initialState.currentPlayerIndex).toBe(0);

      // Робимо хід першого гравця
      playerInputStore.set({
        selectedDirection: 'up',
        selectedDistance: 1,
        isMoveInProgress: false,
        distanceManuallySelected: false
      });
      await gameOrchestrator.confirmPlayerMove();

      let state = get(gameState);
      expect(state.currentPlayerIndex).toBe(1); // Гравець 2

      // Робимо хід другого гравця
      playerInputStore.set({
        selectedDirection: 'down',
        selectedDistance: 1,
        isMoveInProgress: false,
        distanceManuallySelected: false
      });
      await gameOrchestrator.confirmPlayerMove();

      state = get(gameState);
      expect(state.currentPlayerIndex).toBe(2); // AI

      // Після ходу AI повинен повернутися до першого гравця
      // (це відбувається в _triggerComputerMove, який ми мокаємо)
    });
  });

  describe('Інтеграція з gameLogicService', () => {
    it('повинен використовувати правильний індекс гравця для performMove', async () => {
      const performMoveSpy = vi.spyOn(gameLogicService, 'performMove');
      
      // Встановлюємо поточного гравця
      gameState.update(state => ({
        ...state,
        currentPlayerIndex: 1
      }));

      playerInputStore.set({
        selectedDirection: 'right',
        selectedDistance: 1,
        isMoveInProgress: false,
        distanceManuallySelected: false
      });

      await gameOrchestrator.confirmPlayerMove();

      expect(performMoveSpy).toHaveBeenCalledWith('right', 1, 1);
      performMoveSpy.mockRestore();
    });
  });

  describe('Обробка різних типів гравців', () => {
    it('повинен правильно обробляти гру тільки з людьми', async () => {
      // Налаштовуємо гру тільки з людьми
      gameState.set({
        ...get(gameState),
        players: [
          { id: 1, type: 'human', name: 'Гравець 1', score: 0 },
          { id: 2, type: 'human', name: 'Гравець 2', score: 0 },
          { id: 3, type: 'human', name: 'Гравець 3', score: 0 }
        ]
      });

      const initialState = get(gameState);
      expect(initialState.players.every(p => p.type === 'human')).toBe(true);

      // Робимо хід першого гравця
      playerInputStore.set({
        selectedDirection: 'right',
        selectedDistance: 1,
        isMoveInProgress: false,
        distanceManuallySelected: false
      });

      await gameOrchestrator.confirmPlayerMove();

      const stateAfterMove = get(gameState);
      expect(stateAfterMove.currentPlayerIndex).toBe(1);
      expect(stateAfterMove.players[stateAfterMove.currentPlayerIndex].name).toBe('Гравець 2');
    });

    it('повинен правильно обробляти гру тільки з AI', async () => {
      // Налаштовуємо гру тільки з AI
      gameState.set({
        ...get(gameState),
        players: [
          { id: 1, type: 'ai', name: 'AI 1', score: 0 },
          { id: 2, type: 'ai', name: 'AI 2', score: 0 }
        ],
        currentPlayerIndex: 0
      });

      const initialState = get(gameState);
      expect(initialState.players.every(p => p.type === 'ai')).toBe(true);

      // Симулюємо хід AI
      playerInputStore.set({
        selectedDirection: 'right',
        selectedDistance: 1,
        isMoveInProgress: false,
        distanceManuallySelected: false
      });

      await gameOrchestrator.confirmPlayerMove();

      const stateAfterMove = get(gameState);
      expect(stateAfterMove.currentPlayerIndex).toBe(1);
    });
  });

  describe('Граничні випадки', () => {
    it('повинен правильно обробляти гру з одним гравцем', async () => {
      gameState.set({
        ...get(gameState),
        players: [
          { id: 1, type: 'human', name: 'Єдиний гравець', score: 0 }
        ],
        currentPlayerIndex: 0
      });

      const initialState = get(gameState);
      expect(initialState.players).toHaveLength(1);

      playerInputStore.set({
        selectedDirection: 'right',
        selectedDistance: 1,
        isMoveInProgress: false,
        distanceManuallySelected: false
      });

      await gameOrchestrator.confirmPlayerMove();

      const stateAfterMove = get(gameState);
      expect(stateAfterMove.currentPlayerIndex).toBe(0); // Повертається до того ж гравця
    });

    it('повинен правильно обробляти гру з багатьма гравцями', async () => {
      const manyPlayers = Array.from({ length: 5 }, (_, i) => ({
        id: i + 1,
        type: /** @type {const} */ ('human'),
        name: `Гравець ${i + 1}`,
        score: 0
      }));

      gameState.set({
        ...get(gameState),
        players: manyPlayers,
        currentPlayerIndex: 0
      });

      const initialState = get(gameState);
      expect(initialState.players).toHaveLength(5);

      // Робимо кілька ходів
      for (let i = 0; i < 3; i++) {
        playerInputStore.set({
          selectedDirection: 'right',
          selectedDistance: 1,
          isMoveInProgress: false,
          distanceManuallySelected: false
        });

        await gameOrchestrator.confirmPlayerMove();

        const state = get(gameState);
        expect(state.currentPlayerIndex).toBe((i + 1) % 5);
      }
    });
  });

  describe('Інтеграція з UI компонентами', () => {
    it('повинен правильно відображати поточного гравця в UI', () => {
      const state = get(gameState);
      const currentPlayer = state.players[state.currentPlayerIndex];
      
      expect(currentPlayer).toBeDefined();
      expect(currentPlayer.name).toBe('Гравець 1');
      expect(currentPlayer.type).toBe('human');
    });

    it('повинен правильно визначати кількість гравців-людей', () => {
      const state = get(gameState);
      const humanPlayers = state.players.filter(p => p.type === 'human');
      
      expect(humanPlayers).toHaveLength(2);
      expect(humanPlayers[0].name).toBe('Гравець 1');
      expect(humanPlayers[1].name).toBe('Гравець 2');
    });
  });
}); 