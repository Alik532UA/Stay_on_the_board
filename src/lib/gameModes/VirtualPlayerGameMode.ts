import { TrainingGameMode } from './TrainingGameMode';
import type { Player } from '$lib/models/player';
import { createVirtualPlayerPlayers } from '$lib/utils/playerFactory';
import { gameSettingsStore } from '$lib/stores/gameSettingsStore';
import { gameOverStore } from '$lib/stores/gameOverStore';
import { logService } from '$lib/services/logService';
import { noMovesService } from '$lib/services/noMovesService';
import { timeService } from '$lib/services/timeService';
import { boardStore } from '$lib/stores/boardStore';
import { scoreStore } from '$lib/stores/scoreStore';
import type { ScoreChangesData } from '$lib/types/gameMove';
import { get } from 'svelte/store';

export class VirtualPlayerGameMode extends TrainingGameMode {

  constructor() {
    super();
  }

  initialize(options: { newSize?: number } = {}): void {
    timeService.stopGameTimer();
    // Викликаємо ініціалізацію базового класу (TrainingGameMode через super)
    // Оскільки ми наслідуємося від BaseGameMode, але хочемо логіку ініціалізації Training, 
    // треба бути обережним. VirtualPlayerGameMode насправді наслідує TrainingGameMode в оригіналі.
    // Я виправлю це на пряме наслідування від TrainingGameMode для збереження ієрархії.
    super.initialize(options);
    
    gameSettingsStore.updateSettings({
      speechRate: 1.6,
      shortSpeech: true,
      speechFor: {
        player: false,
        computer: true,
        onlineMyMove: false,
        onlineOpponentMove: true
      },
    });
  }

  getPlayersConfiguration(): Player[] {
    return createVirtualPlayerPlayers();
  }

  getModeName(): 'virtual-player' {
    return 'virtual-player';
  }

  protected async applyScoreChanges(scoreChanges: ScoreChangesData): Promise<void> {
    // No specific score changes to apply in virtual player mode
  }

  async handleNoMoves(playerType: 'human' | 'computer'): Promise<void> {
    logService.GAME_MODE(`handleNoMoves: Обробка ситуації "немає ходів" для гравця типу: ${playerType}.`);
    const boardState = get(boardStore);
    if (!boardState) return;

    gameOverStore.resetGameOverState();
    scoreStore.update(s => s ? { ...s, noMovesBonus: (s.noMovesBonus || 0) + boardState.boardSize } : null);
    noMovesService.dispatchNoMovesEvent(playerType);
  }

  protected startTurn(): void {
    timeService.stopTurnTimer();
  }
}