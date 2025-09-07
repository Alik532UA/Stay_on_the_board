import { get } from 'svelte/store';
import { gameStore } from '$lib/stores/gameStore';
import { gameSettingsStore } from '$lib/stores/gameSettingsStore';
import { gameModeStore } from '$lib/stores/gameModeStore';
import { BaseGameMode } from '$lib/gameModes/BaseGameMode';
import { TrainingGameMode } from '$lib/gameModes/TrainingGameMode';
import { LocalGameMode } from '$lib/gameModes/LocalGameMode';
import { TimedGameMode } from '$lib/gameModes/TimedGameMode';
import { VirtualPlayerGameMode } from '$lib/gameModes/VirtualPlayerGameMode';
import { logService } from './logService';
import { timerStore } from '$lib/stores/timerStore';

class GameModeService {
  private modes: Map<string, BaseGameMode> = new Map();

  constructor() {
    this.registerMode('training', new TrainingGameMode());
    this.registerMode('local', new LocalGameMode());
    this.registerMode('timed', new TimedGameMode());
    this.registerMode('virtual-player', new VirtualPlayerGameMode());
  }

  private registerMode(name: string, mode: BaseGameMode) {
    this.modes.set(name, mode);
  }

  public initializeGameMode(modeName: string | null = null, applyPresetSettings: boolean = true) {
    const name = modeName || get(gameSettingsStore).gameMode;

    // НАВІЩО (Архітектурне рішення): Створюємо мапінг між назвами пресетів (зберігаються в налаштуваннях)
    // та назвами реалізацій ігрових режимів. Це дозволяє UI оперувати
    // зрозумілими для користувача назвами ("Новачок"), а сервісу - працювати з конкретними
    // класами (`TrainingGameMode`). Це приклад розділення відповідальностей (SoC).
    // IMPORTANT: This map defines which game mode implementation is used for each preset
    // selected in the GameModeModal. All presets from this modal should map to 'training'
    // (player vs. computer) mode. The specific settings for each preset (like board size)
    // are handled in gameSettingsStore.applyPreset.
    const presetToModeMap: Record<string, string> = {
        beginner: 'training',
        experienced: 'training',
        pro: 'training'
    };
    const implementationName = name ? presetToModeMap[name] || name : 'training'; // Fallback to training if null

    const mode = this.modes.get(implementationName);

    if (mode) {
      timerStore.reset();
      if (applyPresetSettings && name && ['beginner', 'experienced', 'pro', 'timed', 'local', 'online'].includes(name)) {
        gameSettingsStore.applyPreset(name as any);
      }
      gameStore.setMode(mode);
      gameModeStore.setActiveMode(implementationName); // Store the implementation name
      mode.initialize();
      logService.GAME_MODE(`Game mode initialized: ${implementationName} (from preset: ${name})`);
    } else {
      logService.GAME_MODE(`Unknown game mode or preset: ${name}`);
    }
  }

  public getCurrentMode(): BaseGameMode | null {
    return get(gameStore).mode;
  }
}

export const gameModeService = new GameModeService();