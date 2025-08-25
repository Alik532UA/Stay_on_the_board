import { get } from 'svelte/store';
import { gameStore } from '$lib/stores/gameStore';
import { settingsStore } from '$lib/stores/settingsStore';
import { gameModeStore } from '$lib/stores/gameModeStore';
import { BaseGameMode } from '$lib/gameModes/BaseGameMode';
import { TrainingGameMode } from '$lib/gameModes/TrainingGameMode';
import { LocalGameMode } from '$lib/gameModes/LocalGameMode';
import { TimedGameMode } from '$lib/gameModes/TimedGameMode';
import { logService } from './logService';

class GameModeService {
  private modes: Map<string, BaseGameMode> = new Map();

  constructor() {
    this.registerMode('training', new TrainingGameMode());
    this.registerMode('local', new LocalGameMode());
    this.registerMode('timed', new TimedGameMode());
  }

  private registerMode(name: string, mode: BaseGameMode) {
    this.modes.set(name, mode);
  }

  public initializeGameMode(modeName: string | null = null) {
    const name = modeName || get(settingsStore).gameMode;
    const mode = this.modes.get(name);

    if (mode) {
      gameStore.setMode(mode);
      gameModeStore.setActiveMode(name);
      mode.initialize();
      logService.GAME_MODE(`Game mode initialized: ${name}`);
    } else {
      logService.GAME_MODE(`Unknown game mode: ${name}`);
    }
  }

  public getCurrentMode(): BaseGameMode | null {
    return get(gameStore).mode;
  }
}

export const gameModeService = new GameModeService();