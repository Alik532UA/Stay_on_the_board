// src/lib/gameModes/TimedGameMode.ts
import { timeService } from '$lib/services/timeService';
import { endGameService } from '$lib/services/endGameService';
import { get } from 'svelte/store';
import { TrainingGameMode } from './TrainingGameMode';
import { uiStateStore } from '$lib/stores/uiStateStore';
import { timerStore } from '$lib/stores/timerStore';
import { gameSettingsStore } from '$lib/stores/gameSettingsStore';

import { type MoveDirectionType } from '$lib/models/Piece';
import { TIMED_GAME_DEFAULT_DURATION } from '$lib/config/timeConstants';

export class TimedGameMode extends TrainingGameMode {
  constructor() {
    super();
    this.gameDuration = TIMED_GAME_DEFAULT_DURATION;
  }

  getModeName(): 'training' | 'local' | 'timed' | 'online' {
    return 'timed';
  }

  initialize(options: { newSize?: number } = {}): void {
    timeService.stopGameTimer();
    super.initialize(options);
    timerStore.setRemainingTime(this.gameDuration);
    gameSettingsStore.updateSettings({
      speechRate: 1.6,
      shortSpeech: true,
      speechFor: { player: false, computer: true },
    });
  }

  async handlePlayerMove(direction: MoveDirectionType, distance: number): Promise<void> {
    const state = get(uiStateStore);
    if (state?.isFirstMove) {
      this.startGameTimer();
    } else {
      this.resumeTimers();
    }
    await super.handlePlayerMove(direction, distance);
  }

  protected startGameTimer(): void {
    if (this.gameDuration > 0) {
      timeService.startGameTimer(this.gameDuration, () => {
        endGameService.endGame('modal.gameOverReasonTimeUp');
      });
    }
  }
}
