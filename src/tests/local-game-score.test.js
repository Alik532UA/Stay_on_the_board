import { describe, it, expect, beforeEach, vi } from 'vitest';
import { get } from 'svelte/store';
import { localGameStore } from '$lib/stores/localGameStore.js';
import { gameState } from '$lib/stores/gameState.js';
import { performMove } from '$lib/services/gameLogicService.ts';

// Мокаємо stateManager
vi.mock('$lib/services/stateManager', () => ({
  stateManager: {
    applyChanges: /** @type {any} */ (vi.fn().mockResolvedValue(undefined))
  }
}));

describe('Local Game Score', () => {
  beforeEach(() => {
    // Скидаємо локальну гру
    localGameStore.resetStore();
    
    // Скидаємо стан гри
    gameState.set({
      gameId: 1,
      boardSize: 4,
      playerRow: 2,
      playerCol: 2,
      score: 0,
      isGameOver: false,
      isFirstMove: false,
      wasResumed: false,
      currentPlayerIndex: 0,
      players: [
        { id: 1, type: 'human', name: 'Гравець 1' },
        { id: 2, type: 'human', name: 'Гравець 2' }
      ],
      moveQueue: [],
      availableMoves: [],
      cellVisitCounts: {},
      board: Array(4).fill().map(() => Array(4).fill(0)),
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

  describe('localGameStore', () => {
    it('повинен мати початковий рахунок 0 для всіх гравців', () => {
      const state = get(localGameStore);
      expect(state.players[0].score).toBe(0);
      expect(state.players[1].score).toBe(0);
    });

    it('повинен додавати бали до рахунку гравця', () => {
      const state = get(localGameStore);
      const playerId = state.players[0].id;
      
      localGameStore.addPlayerScore(playerId, 5);
      
      const updatedState = get(localGameStore);
      expect(updatedState.players[0].score).toBe(5);
      expect(updatedState.players[1].score).toBe(0);
    });

    it('повинен скидати рахунки всіх гравців', () => {
      const state = get(localGameStore);
      const player1Id = state.players[0].id;
      const player2Id = state.players[1].id;
      
      // Додаємо бали
      localGameStore.addPlayerScore(player1Id, 5);
      localGameStore.addPlayerScore(player2Id, 3);
      
      // Скидаємо
      localGameStore.resetScores();
      
      const updatedState = get(localGameStore);
      expect(updatedState.players[0].score).toBe(0);
      expect(updatedState.players[1].score).toBe(0);
    });
  });

  describe('ScorePanelWidget integration', () => {
    it('повинен показувати рахунок всіх гравців в локальній грі', () => {
      const state = get(localGameStore);
      const player1Id = state.players[0].id;
      const player2Id = state.players[1].id;
      
      // Додаємо бали
      localGameStore.addPlayerScore(player1Id, 3);
      localGameStore.addPlayerScore(player2Id, 7);
      
      const updatedState = get(localGameStore);
      expect(updatedState.players[0].score).toBe(3);
      expect(updatedState.players[1].score).toBe(7);
    });
  });
}); 