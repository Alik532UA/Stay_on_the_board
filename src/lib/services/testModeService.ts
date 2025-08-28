// src/lib/services/testModeService.ts
import { testModeStore } from '$lib/stores/testModeStore';
import { gameStateMutator } from '$lib/services/gameStateMutator';
import { logService } from './logService';
import type { MoveDirectionType } from '$lib/models/Figure';

let isInitialized = false;

export function initializeTestModeSync() {
  if (isInitialized) return;

  logService.init('Initializing Test Mode Sync Service...');

  testModeStore.subscribe(state => {
    if (!state.isEnabled) {
      // Якщо тестовий режим вимкнено, очищуємо будь-які перевизначення
      gameStateMutator.applyMove({ testModeOverrides: {} });
      return;
    }

    const overrides: {
      nextComputerMove?: { direction: MoveDirectionType; distance: number };
    } = {};

    // Якщо встановлено ручний хід комп'ютера, додаємо його до перевизначень
    if (state.computerMoveMode === 'manual' && state.manualComputerMove.direction && state.manualComputerMove.distance) {
      overrides.nextComputerMove = {
        direction: state.manualComputerMove.direction as MoveDirectionType,
        distance: state.manualComputerMove.distance
      };
    }
    
    logService.testMode('Applying test mode overrides to gameState', overrides);
    gameStateMutator.applyMove({ testModeOverrides: overrides });
  });

  isInitialized = true;
}