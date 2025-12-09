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
    // selected in the GameModeModal. The specific settings for each preset (like board size)
    // are handled in gameSettingsStore.applyPreset.
    const presetToModeMap: Record<string, string> = {
      // Virtual-player presets → training implementation
      'virtual-player-beginner': 'training',
      'virtual-player-experienced': 'training',
      'virtual-player-pro': 'training',
      'virtual-player-timed': 'timed',

      // Local presets → local implementation
      'local-observer': 'local',
      'local-experienced': 'local',
      'local-pro': 'local',

      // Online presets → online implementation (майбутнє)
      'online-beginner': 'online',
      'online-experienced': 'online',
      'online-pro': 'online',

      // Legacy presets (backward compatibility)
      beginner: 'training',
      experienced: 'training',
      pro: 'training',
      timed: 'timed',
      local: 'local',
      online: 'online',
      observer: 'local', // legacy observer → local
    };
    const implementationName = name ? presetToModeMap[name] || name : 'training'; // Fallback to training if null

    const mode = this.modes.get(implementationName);

    if (mode) {
      timerStore.reset();

      // Allowed presets (new structured presets + legacy for backward compatibility)
      const allowedPresets = [
        'virtual-player-beginner', 'virtual-player-experienced', 'virtual-player-pro', 'virtual-player-timed',
        'local-observer', 'local-experienced', 'local-pro',
        'online-beginner', 'online-experienced', 'online-pro',
        // Legacy
        'beginner', 'experienced', 'pro', 'timed', 'local', 'online', 'observer'
      ];

      if (applyPresetSettings && name && allowedPresets.includes(name)) {
        gameSettingsStore.applyPreset(name as any);
      }
      mode.initialize();
      gameStore.setMode(mode);
      gameModeStore.setActiveMode(implementationName); // Store the implementation name
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