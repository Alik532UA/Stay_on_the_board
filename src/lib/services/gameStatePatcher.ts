// src/lib/services/gameStatePatcher.ts
import { logService } from './logService';
import { boardStore } from '$lib/stores/boardStore';

class GameStatePatcher {
  applyPatch(serverState: any): void {
    logService.logicMove('[GameStatePatcher] Applying server state to local boardStore...');
    boardStore.set(serverState);
    logService.logicMove('[GameStatePatcher] Patch applied.');
  }
}

export const gameStatePatcher = new GameStatePatcher();
