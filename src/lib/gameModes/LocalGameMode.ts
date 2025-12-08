import { get } from 'svelte/store';
import { BaseGameMode } from './index';
import type { Player } from '$lib/models/player';
import { gameSettingsStore } from '$lib/stores/gameSettingsStore';
import { gameOverStore } from '$lib/stores/gameOverStore';
import { gameEventBus } from '$lib/services/gameEventBus';
import { logService } from '$lib/services/logService';
import { animationService } from '$lib/services/animationService';
import { timeService } from '$lib/services/timeService';
import { noMovesService } from '$lib/services/noMovesService';
import { availableMovesService } from '$lib/services/availableMovesService';
import { gameService } from '$lib/services/gameService';
import { playerStore } from '$lib/stores/playerStore';
import { boardStore } from '$lib/stores/boardStore';
import { DEFAULT_PLAYER_NAMES } from '$lib/config/defaultPlayers';
import { getRandomUnusedColor } from '$lib/utils/playerUtils';
import { BASE_TURN_DURATION, DEV_TIME_MULTIPLIER } from '$lib/config/gameConfig';
import { dev } from '$app/environment';

export class LocalGameMode extends BaseGameMode {
  constructor() {
    super();
    this.turnDuration = dev ? BASE_TURN_DURATION * DEV_TIME_MULTIPLIER : BASE_TURN_DURATION;
  }

  initialize(options: { newSize?: number } = {}): void {
    gameService.initializeNewGame({
      size: options.newSize,
      players: this.getPlayersConfiguration(),
    });

    // Check for 'observer' mode to disable timer
    const currentSettings = get(gameSettingsStore);
    if (currentSettings.gameMode === 'observer') {
      this.turnDuration = 0; // Disable timer
    } else {
      // Restore default turn duration if not observer (in case of mode switch)
      this.turnDuration = dev ? BASE_TURN_DURATION * DEV_TIME_MULTIPLIER : BASE_TURN_DURATION;
    }

    gameSettingsStore.updateSettings({
      speechRate: 1.6,
      shortSpeech: true,
      speechFor: { player: false, computer: true },
    });
    animationService.initialize();
    this.checkComputerTurn();
    // this.startTurn(); // Timer will start after the first move to allow infinite setup time
  }

  async continueAfterNoMoves(): Promise<void> {
    logService.GAME_MODE(`[${this.constructor.name}] continueAfterNoMoves called`);
    const boardState = get(boardStore);
    if (!boardState) return;

    boardStore.update(s => {
      if (!s) return null;
      return {
        ...s,
        cellVisitCounts: {},
        moveHistory: [{ pos: { row: s.playerRow!, col: s.playerCol! }, blocked: [], visits: {}, blockModeEnabled: get(gameSettingsStore).blockModeEnabled }],
        moveQueue: [],
      };
    });
    availableMovesService.updateAvailableMoves();
    await this.advanceToNextPlayer();

    gameOverStore.resetGameOverState();
    animationService.reset();

    await this.checkComputerTurn();
    this.startTurn();
    gameEventBus.dispatch('CloseModal');
  }

  async handleNoMoves(playerType: 'human' | 'computer'): Promise<void> {
    noMovesService.dispatchNoMovesEvent(playerType);
  }

  getPlayersConfiguration(): Player[] {
    const playerState = get(playerStore);
    if (playerState) {
      // SSoT: Беремо поточних гравців, але ОБОВ'ЯЗКОВО скидаємо їхній рахунок до 0
      // для нової гри.
      return playerState.players.map(p => ({
        ...p,
        score: 0,
        penaltyPoints: 0,
        bonusPoints: 0,
        bonusHistory: [] as any[]
      }));
    }
    // If no players in store (e.g. F5 refresh), generate default players
    const usedColors: string[] = [];
    return DEFAULT_PLAYER_NAMES.map((name, index) => {
      const color = getRandomUnusedColor(usedColors);
      usedColors.push(color);
      return {
        id: index + 1,
        name,
        type: 'human',
        score: 0,
        color,
        isComputer: false,
        penaltyPoints: 0,
        bonusPoints: 0,
        bonusHistory: [] as any[]
      };
    });
  }

  getModeName(): 'training' | 'local' | 'timed' | 'online' | 'virtual-player' {
    return 'local';
  }

  protected async advanceToNextPlayer(): Promise<void> {
    const currentPlayerState = get(playerStore);
    if (!currentPlayerState) return;
    const nextPlayerIndex = (currentPlayerState.currentPlayerIndex + 1) % currentPlayerState.players.length;

    playerStore.update(s => s ? { ...s, currentPlayerIndex: nextPlayerIndex } : null);

    await this.checkComputerTurn();
    this.startTurn();
  }

  protected async applyScoreChanges(scoreChanges: any): Promise<void> {
    const { bonusPoints, penaltyPoints } = scoreChanges;
    const playerState = get(playerStore);
    if (!playerState) return;

    playerStore.update(s => {
      if (!s) return null;
      const newPlayers = [...s.players];
      const playerToUpdate = { ...newPlayers[s.currentPlayerIndex] };

      playerToUpdate.bonusPoints += bonusPoints;
      playerToUpdate.penaltyPoints += penaltyPoints;

      // Local Game Scoring Rule: Score = Bonuses - Penalties
      playerToUpdate.score = playerToUpdate.bonusPoints - playerToUpdate.penaltyPoints;

      newPlayers[s.currentPlayerIndex] = playerToUpdate;
      return { ...s, players: newPlayers };
    });
  }

  private async checkComputerTurn(): Promise<void> {
    // Local mode is typically Human vs Human, but keeping this for safety if mixed mode is possible
    const state = get(playerStore);
    if (!state) return;
    const currentPlayer = state.players[state.currentPlayerIndex];

    if (currentPlayer.type === 'computer' || currentPlayer.isComputer) {
      // Note: 'computer' check depends on Player model type literal. Assuming 'computer' or 'ai'.
      // Player type is 'human' | 'computer' usually.
      await new Promise(resolve => setTimeout(resolve, 1000));
      await this.triggerComputerMove();
    }
  }
}