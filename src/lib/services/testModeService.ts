import { testModeStore, type PositionMode, type ComputerMoveMode, type TestModeState } from '$lib/stores/testModeStore';
import { uiStateStore } from '$lib/stores/uiStateStore';
import { logService } from './logService';
import type { MoveDirectionType } from '$lib/models/Piece';

let isInitialized = false;

export function initializeTestModeSync() {
  if (isInitialized) return;

  logService.init('Initializing Test Mode Sync Service...');

  testModeStore.subscribe(state => {
    // НАВІЩО: Ця підписка є "мостом" між налаштуваннями тест-режиму та ігровим станом.
    // Вона перетворює конфігурацію з testModeStore на конкретні перевизначення (overrides)
    // для uiStateStore, забезпечуючи UDF та SoC.
    logService.testMode('[testModeService] Отримано оновлення від testModeStore:', state);

    if (!state.isEnabled) {
      // Якщо тестовий режим вимкнено, очищуємо будь-які перевизначення
      uiStateStore.update(s => {
        if (s && s.testModeOverrides) {
          logService.testMode('[testModeService] Вимикаємо тестовий режим, очищуємо overrides.');
          const { testModeOverrides, ...rest } = s;
          return rest;
        }
        return s;
      });
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
    
    logService.testMode('[testModeService] Застосовуємо overrides до uiStateStore:', overrides);
    uiStateStore.update(s => s ? ({ ...s, testModeOverrides: overrides }) : s);
  });

  isInitialized = true;
}
