/**
 * @file Manages the lifecycle of game modes (e.g., local, vs-computer, online).
 * It is responsible for initializing, restarting, and ending the game
 * within the context of the current mode.
 */
import { get } from 'svelte/store';
import { page } from '$app/stores';
import { browser } from '$app/environment';
import { gameState } from '$lib/stores/gameState';
import { gameStore } from '$lib/stores/gameStore';
import { logService } from '$lib/services/logService.js';
import type { SideEffect } from './sideEffectService';
import { VsComputerGameMode } from '$lib/gameModes/VsComputerGameMode';
import { LocalGameMode } from '$lib/gameModes/LocalGameMode';
import { BaseGameMode } from '$lib/gameModes/BaseGameMode';

export const gameModeService = {
  setCurrentGameMode(mode: 'local' | 'vs-computer') {
    const currentMode = get(gameStore).mode;
    const isSameMode = (currentMode instanceof LocalGameMode && mode === 'local') || (currentMode instanceof VsComputerGameMode && mode === 'vs-computer');

    if (isSameMode) {
      logService.GAME_MODE(`Game mode is already set to: ${mode}. No changes needed.`);
      return;
    }

    logService.GAME_MODE(`Setting game mode to: ${mode}`);
    let gameMode: BaseGameMode;
    if (mode === 'local') {
      gameMode = new LocalGameMode();
    } else {
      gameMode = new VsComputerGameMode();
    }
    gameState.reset();
    gameMode.initialize(get(gameState)!);
    gameStore.setMode(gameMode);
  },

  initializeGameMode() {
    const gameType = this._determineGameType();
    this.setCurrentGameMode(gameType as 'local' | 'vs-computer');
  },

  _ensureGameMode(): BaseGameMode {
    let activeGameMode = get(gameStore).mode;
    if (!activeGameMode || !get(gameState)) {
      this.initializeGameMode();
      activeGameMode = get(gameStore).mode;
    }
    return activeGameMode!;
  },

  async endGame(reasonKey: string, reasonValues: Record<string, any> | null = null): Promise<SideEffect[]> {
    const activeGameMode = this._ensureGameMode();
    return activeGameMode.endGame(reasonKey, reasonValues);
  },

  async restartGame(): Promise<SideEffect[]> {
    const activeGameMode = this._ensureGameMode();
    return activeGameMode.restartGame();
  },

  async handlePlayerMove(direction: any, distance: any): Promise<SideEffect[]> {
    const activeGameMode = this._ensureGameMode();
    return activeGameMode.handlePlayerMove(direction, distance);
  },

  async claimNoMoves(): Promise<SideEffect[]> {
    const activeGameMode = this._ensureGameMode();
    return activeGameMode.claimNoMoves();
  },

  _determineGameType(): string {
    if (!browser) {
      return 'vs-computer'; // Default for SSR context
    }
    const currentPath = get(page).url.pathname;
    
    if (currentPath.includes('/game/local')) {
      return 'local';
    } else if (currentPath.includes('/game/vs-computer')) {
      return 'vs-computer';
    }
    
    return 'vs-computer';
  },
  
  cleanupCurrentGameMode() {
    const activeGameMode = get(gameStore).mode;
    if (activeGameMode) {
      activeGameMode.cleanup();
      gameStore.setMode(null);
      gameState.destroy();
      logService.GAME_MODE('Game mode cleaned up and state destroyed.');
    }
  }
};