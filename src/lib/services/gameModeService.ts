/**
 * @file Manages the lifecycle of game modes (e.g., local, vs-computer, online).
 * It is responsible for initializing, restarting, and ending the game
 * within the context of the current mode.
 */
import { get } from 'svelte/store';
import { page } from '$app/stores';
import { browser } from '$app/environment';
import { gameState } from '$lib/stores/gameState';
import { gameStateMutator } from './gameStateMutator';
import { gameStore } from '$lib/stores/gameStore';
import { logService } from '$lib/services/logService.js';
import type { SideEffect } from './sideEffectService';
import { VsComputerGameMode } from '$lib/gameModes/VsComputerGameMode';
import { LocalGameMode } from '$lib/gameModes/LocalGameMode';
import { OnlineGameMode } from '$lib/gameModes/OnlineGameMode';
import { TimedVsComputerGameMode } from '$lib/gameModes/TimedVsComputerGameMode';
import { BaseGameMode } from '$lib/gameModes/BaseGameMode';

export const gameModeService = {
  setCurrentGameMode(mode: 'local' | 'vs-computer' | 'online' | 'timed-vs-computer') {
    const currentMode = get(gameStore).mode;
    const isSameMode = (currentMode instanceof LocalGameMode && mode === 'local') ||
                     (currentMode instanceof VsComputerGameMode && mode === 'vs-computer') ||
                     (currentMode instanceof OnlineGameMode && mode === 'online') ||
                     (currentMode instanceof TimedVsComputerGameMode && mode === 'timed-vs-computer');

    if (isSameMode) {
      logService.GAME_MODE(`Game mode is already set to: ${mode}. No changes needed.`);
      return;
    }

    logService.GAME_MODE(`Setting game mode to: ${mode}`);
    let gameMode: BaseGameMode;
    if (mode === 'local') {
      gameMode = new LocalGameMode();
    } else if (mode === 'online') {
      gameMode = new OnlineGameMode();
    } else if (mode === 'timed-vs-computer') {
      gameMode = new TimedVsComputerGameMode();
    } else {
      gameMode = new VsComputerGameMode();
    }
    gameStateMutator.resetGame();
    gameMode.initialize(get(gameState)!);
    gameStore.setMode(gameMode);
  },

  initializeGameMode() {
    const gameType = this._determineGameType();
    this.setCurrentGameMode(gameType as 'local' | 'vs-computer' | 'online' | 'timed-vs-computer');
  },

  _ensureGameMode(): BaseGameMode {
    let activeGameMode = get(gameStore).mode;
    if (!activeGameMode || !get(gameState)) {
      this.initializeGameMode();
      activeGameMode = get(gameStore).mode;
    }
    return activeGameMode!;
  },

  async endGame(reasonKey: string, reasonValues: Record<string, any> | null = null): Promise<void> {
    const activeGameMode = this._ensureGameMode();
    await activeGameMode.endGame(reasonKey, reasonValues);
  },

  async restartGame(): Promise<void> {
    const activeGameMode = this._ensureGameMode();
    await activeGameMode.restartGame();
  },

  async handlePlayerMove(direction: any, distance: any): Promise<void> {
    const activeGameMode = this._ensureGameMode();
    await activeGameMode.handlePlayerMove(direction, distance);
  },

  async claimNoMoves(): Promise<void> {
    const activeGameMode = this._ensureGameMode();
    await activeGameMode.claimNoMoves();
  },

  async continueAfterNoMoves(): Promise<void> {
    const activeGameMode = this._ensureGameMode();
    await activeGameMode.continueAfterNoMoves();
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
    } else if (currentPath.includes('/game/online')) {
      return 'online';
    } else if (currentPath.includes('/game/timed-vs-computer')) {
      return 'timed-vs-computer';
    }
    
    return 'vs-computer';
  },
  
  cleanupCurrentGameMode() {
    const activeGameMode = get(gameStore).mode;
    if (activeGameMode) {
      activeGameMode.cleanup();
      gameStore.setMode(null);
      gameStateMutator.destroy();
      logService.GAME_MODE('Game mode cleaned up and state destroyed.');
    }
  }
};