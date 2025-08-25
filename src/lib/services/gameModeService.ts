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
import { TrainingGameMode } from '$lib/gameModes/TrainingGameMode';
import { LocalGameMode } from '$lib/gameModes/LocalGameMode';
import { OnlineGameMode } from '$lib/gameModes/OnlineGameMode';
import { TimedGameMode } from '$lib/gameModes/TimedGameMode';
import { BaseGameMode } from '$lib/gameModes/BaseGameMode';
import { endGameService } from './endGameService';
import { settingsStore } from '$lib/stores/settingsStore';
import { modalStore } from '$lib/stores/modalStore';

// НАВІЩО: Створюємо об'єкт, який містить всі публічні методи.
// Потім експортуємо цей об'єкт. Це виправляє помилку, через яку
// інші модулі не могли отримати доступ до методів сервісу.
const service = {
  setCurrentGameMode(mode: 'local' | 'training' | 'online' | 'timed' | 'timed-vs-computer') {
    const currentMode = get(gameStore).mode;
    const isSameMode = (currentMode instanceof LocalGameMode && mode === 'local') ||
                     (currentMode instanceof TrainingGameMode && mode === 'training') ||
                     (currentMode instanceof TimedGameMode && mode === 'timed') ||
                     (currentMode instanceof OnlineGameMode && mode === 'online');

    if (isSameMode && get(gameState)) {
      logService.GAME_MODE(`Game mode is already set to: ${mode}. No changes needed.`);
      return;
    }

    logService.GAME_MODE(`Setting game mode to: ${mode}`);
    let gameMode: BaseGameMode;
    if (mode === 'local') {
      gameMode = new LocalGameMode();
    } else if (mode === 'online') {
      gameMode = new OnlineGameMode();
    } else if (mode === 'timed') {
      gameMode = new TimedGameMode();
    } else {
      gameMode = new TrainingGameMode();
    }
    
    gameMode.initialize();
    
    timeService.initializeTimers(gameMode.gameDuration, gameMode.turnDuration);
    gameStore.setMode(gameMode);
  },

  initializeGameMode() {
    const gameType = service._determineGameType();
    service.setCurrentGameMode(gameType as 'local' | 'training' | 'online' | 'timed' | 'timed-vs-computer');
  },

  _ensureGameMode(): BaseGameMode {
    let activeGameMode = get(gameStore).mode;
    if (!activeGameMode || !get(gameState)) {
      service.initializeGameMode();
      activeGameMode = get(gameStore).mode;
    }
    return activeGameMode!;
  },

  async endGame(reasonKey: string, reasonValues: Record<string, any> | null = null): Promise<void> {
    const activeGameMode = service._ensureGameMode();
    await endGameService.endGame(reasonKey, reasonValues);
  },

  async restartGame(options: { newSize?: number } = {}): Promise<void> {
    const activeGameMode = service._ensureGameMode();
    await activeGameMode.restartGame(options);
  },

  async handlePlayerMove(direction: any, distance: any): Promise<void> {
    const activeGameMode = service._ensureGameMode();
    await activeGameMode.handlePlayerMove(direction, distance);
  },

  async claimNoMoves(): Promise<void> {
    const activeGameMode = service._ensureGameMode();
    await activeGameMode.claimNoMoves();
  },

  async continueAfterNoMoves(): Promise<void> {
    const activeGameMode = service._ensureGameMode();
    await activeGameMode.continueAfterNoMoves();
  },

  _determineGameType(): string {
    if (!browser) {
      return 'training';
    }
    const currentPath = get(page).url.pathname;
    
    if (currentPath.includes('/game/local')) return 'local';
    if (currentPath.includes('/game/training')) return 'training';
    if (currentPath.includes('/game/timed')) return 'timed';
    if (currentPath.includes('/game/online')) return 'online';
    
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
  },

  applyGameModePreset: (mode: 'beginner' | 'experienced' | 'pro') => {
    let settingsToApply: Partial<any> = {};
    let showFaq = false;
    const gameStateValue = get(gameState);
    const isNewGame = !gameStateValue || gameStateValue.isNewGame;
  
    const presets = {
      beginner: { showPiece: true, showMoves: true, showGameInfoWidget: 'shown', blockModeEnabled: false, speechEnabled: false, autoHideBoard: false },
      experienced: { showPiece: true, showMoves: true, showGameInfoWidget: 'compact', blockModeEnabled: false, speechEnabled: true, autoHideBoard: true },
      pro: { showPiece: true, showMoves: true, showGameInfoWidget: 'hidden', blockModeEnabled: true, blockOnVisitCount: 0, speechEnabled: true, autoHideBoard: true }
    };
  
    settingsToApply = presets[mode];
    if (mode === 'beginner') {
      showFaq = true;
    }
  
    if (isNewGame) {
      settingsToApply.showBoard = true;
      logService.state('[gameModeService]', 'Setting showBoard to true for new game.');
    }
  
    settingsToApply.gameMode = mode;
    settingsToApply.rememberGameMode = get(settingsStore).showGameModeModal ? false : true;
  
    settingsStore.updateSettings(settingsToApply);
    modalStore.closeModal();
    return showFaq;
  },
};

export const gameModeService = service;