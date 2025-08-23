import { get } from 'svelte/store';
import { BaseGameMode } from './BaseGameMode';
import { gameState, type GameState, type Player } from '$lib/stores/gameState';
import { logService } from '$lib/services/logService';
import { serverSyncService } from '$lib/services/serverSyncService';
import { gameStatePatcher } from '$lib/services/gameStatePatcher';

export class OnlineGameMode extends BaseGameMode {
  private syncInterval: number | null = null;

  initialize(initialState: GameState): void {
    logService.GAME_MODE('[OnlineGameMode] Initializing...');
    // TODO: Connect to the server, set up listeners for opponent moves, etc.
    this.startSync();
  }

  cleanup(): void {
    this.stopSync();
    super.cleanup();
  }

  async claimNoMoves(): Promise<void> {
    logService.GAME_MODE('[OnlineGameMode] Claiming no moves...');
    // TODO: Send "no moves" claim to the server.
  }

  async handleNoMoves(playerType: 'human' | 'computer'): Promise<void> {
    logService.GAME_MODE(`[OnlineGameMode] Handling no moves for ${playerType}...`);
    // This might be triggered by a message from the server.
  }

  getPlayersConfiguration(): Player[] {
    // Player configuration will likely come from the server.
    return [
      { id: 1, type: 'human', name: 'You', score: 0, color: '#e63946', isComputer: false, penaltyPoints: 0, bonusPoints: 0, bonusHistory: [] },
      { id: 2, type: 'human', name: 'Opponent', score: 0, color: '#457b9d', isComputer: false, penaltyPoints: 0, bonusPoints: 0, bonusHistory: [] }
    ];
  }

  async continueAfterNoMoves(): Promise<void> {
    logService.GAME_MODE('[OnlineGameMode] Continuing after no moves...');
    // Logic for this will be server-driven.
  }

  protected async advanceToNextPlayer(): Promise<void> {
    logService.GAME_MODE('[OnlineGameMode] Advancing to next player...');
    // The server will dictate whose turn it is.
  }

  protected async applyScoreChanges(scoreChanges: any): Promise<void> {
    logService.GAME_MODE('[OnlineGameMode] Applying score changes...', scoreChanges);
    // Score changes will be received from the server.
  }

  // Override handlePlayerMove to send the move to the server
  async handlePlayerMove(direction: any, distance: number): Promise<void> {
    logService.GAME_MODE(`[OnlineGameMode] Sending move to server: ${direction}, ${distance}`);
    // TODO: Implement WebSocket or API call to send the move.
    
    // For now, we can call the parent method to have some local effect for testing.
    // In a real scenario, the game state would be updated based on a message from the server.
    // await super.handlePlayerMove(direction, distance);
  }

  private startSync(): void {
    this.syncInterval = window.setInterval(async () => {
      logService.GAME_MODE('[OnlineGameMode] Syncing with server...');
      const serverState = await serverSyncService.getAuthoritativeState();
      gameStatePatcher.applyPatch(serverState);
    }, 5000); // Sync every 5 seconds
  }

  private stopSync(): void {
    if (this.syncInterval) {
      window.clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }
}