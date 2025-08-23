import { get } from 'svelte/store';
import { settingsStore } from '$lib/stores/settingsStore';
import { gameState } from '$lib/stores/gameState';
import { logService } from './logService';

let initialized = false;
let lastKnownBlockModeState = false;

/**
 * Initializes the synchronization service between settingsStore and gameState.
 * This ensures that changes in settings (like enabling block mode) reflect
 * correctly in the game state, maintaining a single source of truth.
 */
export function initializeStoreSync() {
  if (initialized) {
    logService.init('Store sync service already initialized.');
    return;
  }

  logService.init('Initializing store sync service...');

  // Initialize with the current state from the store
  const initialSettings = get(settingsStore);
  lastKnownBlockModeState = initialSettings.blockModeEnabled;

  settingsStore.subscribe(settings => {
    if (settings) {
      const blockModeJustEnabled = settings.blockModeEnabled && !lastKnownBlockModeState;

      if (blockModeJustEnabled) {
        logService.state('Block mode was enabled in settings, resetting game state for it.');
        gameState.resetBlockModeState();
      }

      lastKnownBlockModeState = settings.blockModeEnabled;
    }
  });

  initialized = true;
  logService.init('Store sync service initialized successfully.');
}