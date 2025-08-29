// src/lib/stores/testModeStore.ts
import { writable, get } from 'svelte/store';
import { logService } from '$lib/services/logService';

export type PositionMode = 'random' | 'predictable' | 'manual'; // predictable = 0,0
export type ComputerMoveMode = 'random' | 'manual';

export interface TestModeState {
  isEnabled: boolean;
  startPositionMode: PositionMode;
  manualStartPosition: { x: number; y: number } | null;
  computerMoveMode: ComputerMoveMode;
  manualComputerMove: {
    direction: string | null;
    distance: number | null;
  };
}

export const initialState: TestModeState = {
  isEnabled: false,
  startPositionMode: 'random',
  manualStartPosition: null,
  computerMoveMode: 'random',
  manualComputerMove: {
    direction: null,
    distance: null,
  },
};

const store = writable<TestModeState>(initialState);

// НАВІЩО: Створюємо єдину функцію для керування станом тестового режиму.
// Це забезпечує SSoT та SoC. Вся логіка, пов'язана зі зміною цього стану,
// інкапсульована тут, а не розпорошена по UI компонентах.
export function toggleTestMode() {
  store.update(state => {
    const isEnabled = !state.isEnabled;
    logService.testMode(`Test mode toggled: ${isEnabled ? 'ON' : 'OFF'}`);

    if (isEnabled) {
      // Встановлюємо значення за замовчуванням для ввімкненого режиму
      return {
        ...state,
        isEnabled: true,
        startPositionMode: 'manual',
        manualStartPosition: { x: 0, y: 0 },
        computerMoveMode: 'manual',
        manualComputerMove: { direction: 'down', distance: 1 }
      };
    } else {
      // Повертаємо до стандартних значень для вимкненого режиму
      return {
        ...state,
        isEnabled: false,
        startPositionMode: 'random',
        manualStartPosition: null,
        computerMoveMode: 'random',
        manualComputerMove: { direction: null, distance: null }
      };
    }
  });
}

export const testModeStore = {
  subscribe: store.subscribe,
  update: store.update,
  set: store.set
};