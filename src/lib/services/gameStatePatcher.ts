/**
 * @file Service for applying authoritative state to the local gameState.
 */
import { gameState, type GameState } from '$lib/stores/gameState';
import { logService } from './logService';

class GameStatePatcher {
  /**
   * Applies the server state to the local game state.
   * For now, this is a direct overwrite.
   * @param serverState The authoritative state from the server.
   */
  applyPatch(serverState: GameState): void {
    logService.logicMove('[GameStatePatcher] Applying server state to local gameState...');
    
    // TODO: Implement a more sophisticated "soft" patch instead of a direct overwrite.
    // This could involve comparing move histories and only applying deltas.
    gameState.set(serverState);
    
    logService.logicMove('[GameStatePatcher] Patch applied.');
  }
}

export const gameStatePatcher = new GameStatePatcher();