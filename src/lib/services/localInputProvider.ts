/**
 * @file This service acts as a provider for local user input,
 * decoupling UI components from the core userActionService.
 */
import { get } from 'svelte/store';
import { playerInputStore } from '$lib/stores/playerInputStore';
import { userActionService } from './userActionService';
import { logService } from './logService';

export const localInputProvider = {
  /**
   * Confirms a move based on the current state of the playerInputStore.
   */
  confirmMove(): void {
    const playerInput = get(playerInputStore);
    if (!playerInput.selectedDirection || !playerInput.selectedDistance) {
      logService.logicMove('[LocalInputProvider] Attempted to confirm move without direction or distance.');
      return;
    }

    userActionService.confirmMove(playerInput.selectedDirection, playerInput.selectedDistance);
  }
};