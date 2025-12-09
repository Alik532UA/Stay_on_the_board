// src/lib/services/localInputProvider.ts
import { get } from 'svelte/store';
import { uiStateStore } from '$lib/stores/uiStateStore';
import { userActionService } from './userActionService';
import { logService } from './logService';

export const localInputProvider = {
  confirmMove(): void {
    const state = get(uiStateStore);
    if (!state || !state.selectedDirection || !state.selectedDistance) {
      logService.logicMove('[LocalInputProvider] Attempted to confirm move without direction or distance.');
      return;
    }

    userActionService.confirmMove();
  }
};
