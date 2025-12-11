import { get } from 'svelte/store';
import { gameStore } from '$lib/stores/gameStore';
import { gameSettingsStore } from '$lib/stores/gameSettingsStore';
import { gameModeStore } from '$lib/stores/gameModeStore';
import { BaseGameMode } from '$lib/gameModes/BaseGameMode';
import { TrainingGameMode } from '$lib/gameModes/TrainingGameMode';
import { LocalGameMode } from '$lib/gameModes/LocalGameMode';
import { TimedGameMode } from '$lib/gameModes/TimedGameMode';
import { VirtualPlayerGameMode } from '$lib/gameModes/VirtualPlayerGameMode';
import { OnlineGameMode } from '$lib/gameModes/OnlineGameMode'; // Import OnlineGameMode
import { logService } from './logService';
import { timerStore } from '$lib/stores/timerStore';

class GameModeService {
  private modes: Map<string, BaseGameMode> = new Map();

  constructor() {
    this.registerMode('training', new TrainingGameMode());
    this.registerMode('local', new LocalGameMode());
    this.registerMode('timed', new TimedGameMode());
    this.registerMode('virtual-player', new VirtualPlayerGameMode());
    this.registerMode('online', new OnlineGameMode()); // Register OnlineGameMode
  }

  private registerMode(name: string, mode: BaseGameMode) {
    this.modes.set(name, mode);
  }

  /**
   * Ініціалізує ігровий режим.
   * @param modeName Назва режиму або пресету.
   * @param applyPresetSettings Чи застосовувати налаштування з пресету.
   * @param options Додаткові параметри ініціалізації (наприклад, roomId для онлайн гри).
   */
  public initializeGameMode(modeName: string | null = null, applyPresetSettings: boolean = true, options: any = {}) {
    const name = modeName || get(gameSettingsStore).gameMode;

    const presetToModeMap: Record<string, string> = {
      'virtual-player-beginner': 'training',
      'virtual-player-experienced': 'training',
      'virtual-player-pro': 'training',
      'virtual-player-timed': 'timed',
      'local-observer': 'local',
      'local-experienced': 'local',
      'local-pro': 'local',
      'online-beginner': 'online',
      'online-experienced': 'online',
      'online-pro': 'online',
      // Legacy
      beginner: 'training',
      experienced: 'training',
      pro: 'training',
      timed: 'timed',
      local: 'local',
      online: 'online',
      observer: 'local',
    };
    const implementationName = name ? presetToModeMap[name] || name : 'training';

    const mode = this.modes.get(implementationName);

    if (mode) {
      timerStore.reset();

      const allowedPresets = [
        'virtual-player-beginner', 'virtual-player-experienced', 'virtual-player-pro', 'virtual-player-timed',
        'local-observer', 'local-experienced', 'local-pro',
        'online-beginner', 'online-experienced', 'online-pro',
        'beginner', 'experienced', 'pro', 'timed', 'local', 'online', 'observer'
      ];

      if (applyPresetSettings && name && allowedPresets.includes(name)) {
        gameSettingsStore.applyPreset(name as any);
      }

      // Передаємо options у метод initialize режиму
      mode.initialize(options);

      gameStore.setMode(mode);
      gameModeStore.setActiveMode(implementationName);
      logService.GAME_MODE(`Game mode initialized: ${implementationName} (from preset: ${name})`, options);
    } else {
      logService.GAME_MODE(`Unknown game mode or preset: ${name}`);
    }
  }

  public getCurrentMode(): BaseGameMode | null {
    return get(gameStore).mode;
  }
}

export const gameModeService = new GameModeService();