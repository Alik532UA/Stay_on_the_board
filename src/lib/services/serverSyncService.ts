/**
 * @file Simulates a service for synchronizing game state with a server.
 * In a real application, this would involve WebSockets or HTTP requests.
 */
import { get } from 'svelte/store';
import { gameState, type GameState } from '$lib/stores/gameState';
import { logService } from './logService';

class ServerSyncService {
  /**
   * Fetches the authoritative game state from the "server".
   * @returns A promise that resolves to the server's version of the game state.
   */
  async getAuthoritativeState(): Promise<GameState> {
    logService.logicMove('[ServerSyncService] Fetching authoritative state from server...');
    
    // Simulate a network delay
    await new Promise(resolve => setTimeout(resolve, 200));

    // In a real app, this would be a network request.
    // For now, we'll return a slightly modified version of the current state
    // to simulate a desync.
    const currentState = get(gameState);
    const serverState: GameState = JSON.parse(JSON.stringify(currentState));

    // Example modification: server corrects the score
    if (serverState.players.length > 0) {
      serverState.players[0].score += 5;
    }
    
    logService.logicMove('[ServerSyncService] Received authoritative state:', serverState);
    return serverState;
  }
}

export const serverSyncService = new ServerSyncService();