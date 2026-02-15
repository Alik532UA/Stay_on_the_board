import { Piece, type MoveDirectionType } from '../models/Piece';
import { isCellBlocked } from '$lib/utils/boardUtils';
import { calculateMoveScore } from '$lib/services/scoreService';
import type { CombinedGameState, MoveResult } from '$lib/models/gameState';
import type { GameSettingsState } from '$lib/stores/gameSettingsStore';
import type { MoveHistoryEntry } from '$lib/models/moveHistory';
import { logService } from '$lib/services/logService';

/**
 * Headless ігровий рушій.
 * Містить тільки чисту логіку правил гри без залежностей від Svelte-сторів.
 */
export class GameEngine {
  private state: CombinedGameState;
  private settings: GameSettingsState;

  constructor(initialState: CombinedGameState, settings: GameSettingsState) {
    this.state = JSON.parse(JSON.stringify(initialState)); // Глибока копія для ізоляції
    this.settings = settings;
  }

  /**
   * Повертає поточний стан рушія.
   */
  public getState(): CombinedGameState {
    return this.state;
  }

  /**
   * Оновлює налаштування рушія.
   */
  public updateSettings(settings: GameSettingsState): void {
    this.settings = settings;
  }

  /**
   * Виконує хід та повертає результат і зміни стану.
   */
  public performMove(
    direction: MoveDirectionType,
    distance: number,
    playerIndex: number,
    actualGameMode: string
  ): MoveResult {
    logService.logicMove(`[GameEngine] performMove: ${direction} ${distance} (player ${playerIndex})`);

    const piece = new Piece(this.state.playerRow!, this.state.playerCol!, this.state.boardSize);
    const newPosition = piece.calculateNewPosition(direction, distance);

    // 1. Валідація меж
    if (!piece.isValidPosition(newPosition.row, newPosition.col)) {
      return { success: false, reason: 'out_of_bounds' };
    }

    // 2. Валідація заблокованих клітинок
    if (isCellBlocked(newPosition.row, newPosition.col, this.state.cellVisitCounts, this.settings)) {
      return { success: false, reason: 'blocked_cell' };
    }

    // 3. Розрахунок очок
    const scoreChanges = calculateMoveScore(this.state, newPosition, playerIndex, this.settings, distance, direction);

    // 4. Оновлення стану відвіданих клітинок
    const startCellKey = `${this.state.playerRow}-${this.state.playerCol}`;
    const updatedCellVisitCounts = { 
      ...this.state.cellVisitCounts, 
      [startCellKey]: (this.state.cellVisitCounts[startCellKey] || 0) + 1 
    };

    // 5. Визначення очок для додавання (різна логіка для режимів)
    const isLocalOrOnlineGame = actualGameMode === 'local' || actualGameMode === 'online';
    const shouldApplyBaseScore = !isLocalOrOnlineGame;
    const baseScoreToAdd = shouldApplyBaseScore ? scoreChanges.baseScoreChange : 0;

    // 6. Формування змін стану
    const changes = {
      boardState: {
        playerRow: newPosition.row,
        playerCol: newPosition.col,
        cellVisitCounts: updatedCellVisitCounts,
        moveQueue: [...this.state.moveQueue, { player: playerIndex + 1, direction, distance, to: newPosition }],
        moveHistory: [...this.state.moveHistory, { 
          pos: newPosition, 
          blocked: [] as { row: number; col: number }[], 
          visits: updatedCellVisitCounts, 
          blockModeEnabled: this.settings.blockModeEnabled, 
          lastMove: { direction, distance, player: playerIndex } 
        }] as MoveHistoryEntry[],
      },
      playerState: {
        players: this.state.players.map((p, i) => 
          i === playerIndex ? { ...p, score: p.score + baseScoreToAdd } : p
        ),
      },
      scoreState: {
        penaltyPoints: this.state.penaltyPoints + scoreChanges.penaltyPoints,
        movesInBlockMode: this.state.movesInBlockMode + scoreChanges.movesInBlockModeChange,
        jumpedBlockedCells: this.state.jumpedBlockedCells + scoreChanges.jumpedBlockedCellsChange,
        distanceBonus: (this.state.distanceBonus || 0) + scoreChanges.distanceBonusChange,
      }
    };

    // Оновлюємо внутрішній стан
    this.applyChanges(changes);

    return {
      success: true,
      changes,
      newPosition,
      bonusPoints: scoreChanges.bonusPoints,
      penaltyPoints: scoreChanges.penaltyPointsForMove
    };
  }

  /**
   * Внутрішній метод для застосування змін до стану рушія.
   */
  private applyChanges(changes: NonNullable<MoveResult['changes']>): void {
    if (changes.boardState) Object.assign(this.state, changes.boardState);
    if (changes.playerState) {
        if (changes.playerState.players) this.state.players = changes.playerState.players;
    }
    if (changes.scoreState) Object.assign(this.state, changes.scoreState);
  }
}
