// src/lib/services/gameModeService.ts
import { get } from 'svelte/store';
import { gameStore } from '$lib/stores/gameStore';
import { gameState } from '$lib/stores/gameState';
import type { BaseGameMode } from '$lib/gameModes/BaseGameMode';
import { TrainingGameMode } from '$lib/gameModes/TrainingGameMode';
import { LocalGameMode } from '$lib/gameModes/LocalGameMode';
import { TimedGameMode } from '$lib/gameModes/TimedGameMode';
// import { OnlineGameMode } from '$lib/gameModes/OnlineGameMode';
import { logService } from './logService';

class GameModeService {
  private modes: Record<string, new () => BaseGameMode> = {
    training: TrainingGameMode,
    local: LocalGameMode,
    timed: TimedGameMode,
    // online: OnlineGameMode,
  };

  public initializeGameMode(modeName: string) {
    const ModeClass = this.modes[modeName];
    if (ModeClass) {
      const modeInstance = new ModeClass();
      gameStore.setMode(modeInstance);
      modeInstance.initialize();
      logService.GAME_MODE(`[GameModeService] Initialized ${modeName} mode.`);
    } else {
      logService.GAME_MODE(`[GameModeService] Unknown game mode: ${modeName}`);
    }
  }

  public getCurrentMode(): BaseGameMode | null {
    return get(gameStore).mode;
  }
}

export const gameModeService = new GameModeService();