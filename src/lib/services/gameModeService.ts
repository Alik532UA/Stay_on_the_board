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
import { timeService } from '$lib/services/timeService';
import type { SideEffect } from './sideEffectService';
import { TrainingGameMode } from '$lib/gameModes/TrainingGameMode';
import { LocalGameMode } from '$lib/gameModes/LocalGameMode';
import { OnlineGameMode } from '$lib/gameModes/OnlineGameMode';
import { TimedVsComputerGameMode } from '$lib/gameModes/TimedVsComputerGameMode';
import { TimedGameMode } from '$lib/gameModes/TimedGameMode';
import { BaseGameMode } from '$lib/gameModes/BaseGameMode';
import { endGameService } from './endGameService';

export const gameModeService = {
  setCurrentGameMode(mode: 'local' | 'training' | 'online' | 'timed' | 'timed-vs-computer') {
    const currentMode = get(gameStore).mode;
    const isSameMode = (currentMode instanceof LocalGameMode && mode === 'local') ||
                     (currentMode instanceof TrainingGameMode && mode === 'training') ||
                     (currentMode instanceof TimedGameMode && mode === 'timed') ||
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
    } else if (mode === 'timed') {
      gameMode = new TimedGameMode();
    } else {
      gameMode = new TrainingGameMode();
    }
    gameStateMutator.resetGame();
    gameMode.initialize(get(gameState)!);
    timeService.initializeTimers(gameMode.gameDuration, gameMode.turnDuration);
    gameStore.setMode(gameMode);
  },

  initializeGameMode() {
    const gameType = this._determineGameType();
    this.setCurrentGameMode(gameType as 'local' | 'training' | 'online' | 'timed' | 'timed-vs-computer');
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
    await endGameService.endGame(reasonKey, reasonValues);
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
      return 'training'; // Default for SSR context
    }
    const currentPath = get(page).url.pathname;
    
    if (currentPath.includes('/game/local')) {
      return 'local';
    } else if (currentPath.includes('/game/training')) {
      return 'training';
    } else if (currentPath.includes('/game/timed')) {
      return 'timed';
    } else if (currentPath.includes('/game/online')) {
      return 'online';
    } else if (currentPath.includes('/game/timed-vs-computer')) {
      return 'timed-vs-computer';
    }
    
    return 'training';
  },
  
  cleanupCurrentGameMode() {
    const activeGameMode = get(gameStore).mode;
    if (activeGameMode) {
      activeGameMode.cleanup();
      gameStore.setMode(null);
      gameStateMutator.destroy();
      logService.GAME_MODE('Game mode cleaned up and state destroyed.');
    }
  },

  getCurrentGameMode(): BaseGameMode | null {
    return get(gameStore).mode;
  }
};