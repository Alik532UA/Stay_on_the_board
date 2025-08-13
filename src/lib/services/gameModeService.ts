/**
 * @file Manages the lifecycle of game modes (e.g., local, vs-computer, online).
 * It is responsible for initializing, restarting, and ending the game
 * within the context of the current mode.
 */
import { get } from 'svelte/store';
import { gameState } from '$lib/stores/gameState';
import { gameStore } from '$lib/stores/gameStore';
import { localGameStore } from '$lib/stores/localGameStore';
import { logService } from '$lib/services/logService.js';
import { sideEffectService } from './sideEffectService';
import { VsComputerGameMode } from '$lib/gameModes/VsComputerGameMode';
import { LocalGameMode } from '$lib/gameModes/LocalGameMode';
import { BaseGameMode } from '$lib/gameModes/BaseGameMode';

export const gameModeService = {
  setCurrentGameMode(mode: 'local' | 'vs-computer') {
    logService.GAME_MODE(`Setting game mode to: ${mode}`);
    let gameMode: BaseGameMode;
    if (mode === 'local') {
      gameMode = new LocalGameMode();
    } else {
      gameMode = new VsComputerGameMode();
    }
    gameMode.initialize(get(gameState));
    gameStore.setMode(gameMode);
  },

  initializeGameMode() {
    const gameType = this._determineGameType();
    this.setCurrentGameMode(gameType as 'local' | 'vs-computer');
  },

  async endGame(reasonKey: string, reasonValues: Record<string, any> | null = null): Promise<void> {
    const activeGameMode = get(gameStore).mode;
    if (!activeGameMode) this.initializeGameMode();
    await get(gameStore).mode!.endGame(reasonKey, reasonValues);
  },

  async restartGame(): Promise<void> {
    const activeGameMode = get(gameStore).mode;
    if (!activeGameMode) this.initializeGameMode();
    await get(gameStore).mode!.restartGame();
  },

  _determineGameType(): string {
    const currentPath = sideEffectService.getCurrentPath();
    
    if (currentPath.includes('/game/local')) {
      return 'local';
    } else if (currentPath.includes('/game/vs-computer')) {
      return 'vs-computer';
    }
    
    const localGameState = get(localGameStore);
    return 'vs-computer';
  }
};