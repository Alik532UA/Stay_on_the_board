/**
 * @file This service acts as a provider for local user input,
 * decoupling UI components from the core userActionService.
 */
import { get } from 'svelte/store';
import { gameState } from '$lib/stores/gameState';
import { userActionService } from './userActionService';
import { logService } from './logService';

export const localInputProvider = {
  /**
   * Confirms a move based on the current state of the gameState.
   */
  confirmMove(): void {
    const state = get(gameState);
    if (!state || !state.selectedDirection || !state.selectedDistance) {
      logService.logicMove('[LocalInputProvider] Attempted to confirm move without direction or distance.');
      return;
    }

    userActionService.confirmMove(state.selectedDirection, state.selectedDistance);
  }
};