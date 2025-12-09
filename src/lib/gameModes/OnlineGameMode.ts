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
      { id: 1, type: 'human', name: 'You', score: 0, color: '#000000', isComputer: false, penaltyPoints: 0, bonusPoints: 0, bonusHistory: [], roundScore: 0 },
      { id: 2, type: 'human', name: 'Opponent', score: 0, color: '#ffffff', isComputer: false, penaltyPoints: 0, bonusPoints: 0, bonusHistory: [], roundScore: 0 }
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
    // Implement Fair Scoring flush logic here if/when online state sync is implemented.
    // For now, logging the intent.
  }

  protected async applyScoreChanges(scoreChanges: any): Promise<void> {
    logService.GAME_MODE('[OnlineGameMode] Applying score changes...', scoreChanges);
    // Implement Fair Scoring logic here if/when online state sync is implemented.
  }
}