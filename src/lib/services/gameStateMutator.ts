// file: src/lib/services/gameStateMutator.ts
import { gameState, type GameState, createInitialState } from '$lib/stores/gameState';
import type { Player } from '$lib/models/player';
import { logService } from './logService';
import { get } from 'svelte/store';
import { settingsStore } from '$lib/stores/settingsStore';
import { generateId, getRandomUnusedColor, getRandomUnusedName } from '$lib/utils/playerUtils.ts';
import { animationService } from './animationService';
import type { Move } from '$lib/utils/gameUtils';
import { availableMovesService } from './availableMovesService';

class GameStateMutator {
  
  public applyMove(changes: Partial<GameState>) {
    logService.state('[GameStateMutator] Applying move', changes);
    gameState.update(state => {
      if (!state) return null;
      return { ...state, ...changes };
    });
  }
  
  public setCurrentPlayer(playerIndex: number) {
    logService.state('[GameStateMutator] Setting current player', playerIndex);
    gameState.update(state => {
      if (!state) return null;
      return { ...state, currentPlayerIndex: playerIndex };
    });
  }

  public setGameOver(reasonKey: string, reasonValues: Record<string, any> | null = null) {
    logService.state('[GameStateMutator] Setting game over', { reasonKey, reasonValues });
    gameState.update(state => {
      if (!state) return null;
      return {
        ...state,
        isGameOver: true,
        gameOverReasonKey: reasonKey,
        gameOverReasonValues: reasonValues,
      };
    });
  }
  
  public clearCellVisits() {
    logService.state('[GameStateMutator] Clearing cell visits');
    gameState.update(state => {
      if (!state) return null;
      return { ...state, cellVisitCounts: {} };
    });
  }
  
  public addPlayer() {
    gameState.update(state => {
      if (!state || state.players.length >= 8) return state;
      const usedColors = state.players.map(p => p.color);
      const usedNames = state.players.map(p => p.name);
      const newPlayer: Player = {
        id: generateId(),
        name: getRandomUnusedName(usedNames),
        color: getRandomUnusedColor(usedColors),
        score: 0,
        isComputer: false,
        type: 'human',
        penaltyPoints: 0,
        bonusPoints: 0,
        bonusHistory: []
      };
      return { ...state, players: [...state.players, newPlayer] };
    });
  }

  public removePlayer(playerId: number) {
    gameState.update(state => {
      if (!state || state.players.length <= 2) return state;
      return { ...state, players: state.players.filter(p => p.id !== playerId) };
    });
  }

  public updatePlayer(playerId: number, updatedData: Partial<Player>) {
    gameState.update(state => {
      if (!state) return null;
      return {
        ...state,
        players: state.players.map(p =>
          p.id === playerId ? { ...p, ...updatedData } : p
        )
      };
    });
  }

  public snapshotScores() {
    gameState.update(state => {
      if (!state) return null;
      const scores = state.players.map(p => p.bonusPoints - p.penaltyPoints);
      return { ...state, scoresAtRoundStart: scores };
    });
  }
  
  public resetScores() {
    gameState.update(state => {
      if (!state) return null;
      return {
        ...state,
        players: state.players.map(p => ({ ...p, score: 0, penaltyPoints: 0, bonusPoints: 0, bonusHistory: [] as any[] }))
      }
    });
  }

  public addPlayerBonus(playerId: number, bonusPointsToAdd: number, reason: string = '') {
    gameState.update(state => {
      if (!state) return null;
      return {
        ...state,
        players: state.players.map(p =>
          p.id === playerId ? {
            ...p,
            bonusPoints: p.bonusPoints + bonusPointsToAdd,
            bonusHistory: [...p.bonusHistory, {
              points: bonusPointsToAdd,
              reason: reason,
              timestamp: Date.now()
            }]
          } : p
        )
      }
    });
  }

  public addPlayerPenalty(playerId: number, penaltyPointsToAdd: number) {
    gameState.update(state => {
      if (!state) return null;
      return {
        ...state,
        players: state.players.map(p =>
          p.id === playerId ? { ...p, penaltyPoints: p.penaltyPoints + penaltyPointsToAdd } : p
        )
      }
    });
  }

  public resetBlockModeState() {
    gameState.update(state => {
      if (!state || state.playerRow === null || state.playerCol === null) return null;
      logService.state('Скидання стану Block Mode');
      const resetHistoryEntry = {
        pos: { row: state.playerRow, col: state.playerCol },
        blocked: [] as {row: number, col: number}[],
        visits: {},
        blockModeEnabled: true
      };
      return {
        ...state,
        cellVisitCounts: {},
        movesInBlockMode: 0,
        moveHistory: [...state.moveHistory, resetHistoryEntry]
      };
    });
  }

  public resetForNoMovesContinue(isLocalGame: boolean) {
    logService.state('[GameStateMutator] Resetting state for continue after no moves');
    gameState.update(state => {
      if (!state) return null;

      const settings = get(settingsStore);
      const bonus = state.boardSize;
      const nextPlayerIndex = isLocalGame ? (state.currentPlayerIndex + 1) % state.players.length : 0;

      // Створюємо проміжний стан з очищеною дошкою
      const intermediateState = {
          ...state,
          noMovesBonus: isLocalGame ? state.noMovesBonus : (state.noMovesBonus || 0) + bonus,
          cellVisitCounts: {},
          moveHistory: [{
              pos: { row: state.playerRow, col: state.playerCol },
              blocked: [] as {row: number, col: number}[],
              visits: {},
              blockModeEnabled: settings.blockModeEnabled
          }],
          moveQueue: [] as any[],
          noMovesClaimed: false,
          isComputerMoveInProgress: false,
          isResumedGame: true,
          isNewGame: false,
          isGameOver: false,
          gameOverReasonKey: null as (string | null),
          gameOverReasonValues: null as Record<string, any> | null,
          currentPlayerIndex: nextPlayerIndex,
      };

      // Розраховуємо нові ходи на основі чистого стану
      const newAvailableMoves = availableMovesService.getAvailableMoves(intermediateState);
      logService.logicAvailability('[GameStateMutator] Recalculated available moves after continue:', newAvailableMoves);

      // Повертаємо фінальний оновлений стан
      const finalState = {
          ...intermediateState,
          availableMoves: newAvailableMoves
      };
      
      logService.state('[GameStateMutator] State after reset for no moves:', finalState);
      return finalState;
    });
  }

  public destroy() {
    gameState.set(null);
  }
}

export const gameStateMutator = new GameStateMutator();