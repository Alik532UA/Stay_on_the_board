import { get } from 'svelte/store';
import { VsComputerGameMode } from './VsComputerGameMode';
import { timeService } from '$lib/services/timeService';
import { gameState, type GameState } from '$lib/stores/gameState';
import { logService } from '$lib/services/logService';
import type { MoveDirectionType } from '$lib/models/Figure';

export class TimedVsComputerGameMode extends VsComputerGameMode {
  private unsubscribe: () => void;

  initialize(initialState: GameState): void {
    super.initialize(initialState);
    timeService.startGame();
    this.unsubscribe = timeService.timeLeft.subscribe(timeLeft => {
      if (timeLeft <= 0) {
        this.endGame('modal.gameOverReasonTimeUp');
      }
    });
  }

  async handlePlayerMove(direction: MoveDirectionType, distance: number): Promise<void> {
    const moveResult = await super.handlePlayerMove(direction, distance);
    
    // Add score only on successful player move
    const state = get(gameState);
    if (state.currentPlayerIndex === 0) { // Assuming player is always at index 0
        timeService.addScore(1); // Add 1 point for each successful move
    }
  }

  async endGame(reasonKey: string, reasonValues: Record<string, any> | null = null): Promise<void> {
    timeService.stopGame();
    if (this.unsubscribe) {
      this.unsubscribe();
    }
    super.endGame(reasonKey, reasonValues);
  }

  cleanup(): void {
    super.cleanup();
    if (this.unsubscribe) {
      this.unsubscribe();
    }
    timeService.stopGame();
  }
}