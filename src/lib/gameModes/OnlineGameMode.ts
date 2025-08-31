// src/lib/gameModes/OnlineGameMode.ts
import { BaseGameMode } from './BaseGameMode';
import type { Player } from '$lib/models/player';
import { logService } from '$lib/services/logService';
import { gameService } from '$lib/services/gameService';
import { gameSettingsStore } from '$lib/stores/gameSettingsStore';
import { animationService } from '$lib/services/animationService';

export class OnlineGameMode extends BaseGameMode {
  constructor() {
    super();
    this.turnDuration = 15;
  }

  initialize(options: { newSize?: number } = {}): void {
    gameService.initializeNewGame({
      size: options.newSize,
      players: this.getPlayersConfiguration(),
    });
    gameSettingsStore.updateSettings({
      speechRate: 1.6,
      shortSpeech: true,
      speechFor: { player: false, computer: true },
    });
    animationService.initialize();
    this.startTurn();
  }

  cleanup(): void {
    super.cleanup();
  }

  async claimNoMoves(): Promise<void> {
    logService.GAME_MODE('[OnlineGameMode] Claiming no moves...');
  }

  async handleNoMoves(playerType: 'human' | 'computer'): Promise<void> {
    logService.GAME_MODE(`[OnlineGameMode] Handling no moves for ${playerType}...`);
  }

  getPlayersConfiguration(): Player[] {
    return [
      { id: 1, type: 'human', name: 'You', score: 0, color: '#e63946', isComputer: false, penaltyPoints: 0, bonusPoints: 0, bonusHistory: [] },
      { id: 2, type: 'human', name: 'Opponent', score: 0, color: '#457b9d', isComputer: false, penaltyPoints: 0, bonusPoints: 0, bonusHistory: [] }
    ];
  }

  getModeName(): 'training' | 'local' | 'timed' | 'online' {
    return 'online';
  }

  async continueAfterNoMoves(): Promise<void> {
    logService.GAME_MODE('[OnlineGameMode] Continuing after no moves...');
  }

  protected async advanceToNextPlayer(): Promise<void> {
    logService.GAME_MODE('[OnlineGameMode] Advancing to next player...');
  }

  protected async applyScoreChanges(scoreChanges: any): Promise<void> {
    logService.GAME_MODE('[OnlineGameMode] Applying score changes...', scoreChanges);
  }
}