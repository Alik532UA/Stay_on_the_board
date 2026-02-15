// src/lib/stores/testModeStore.ts
// Bridge pattern: writable-обгортка для Svelte 4.
// SSoT — testModeState.svelte.ts (Runes).

import { writable } from 'svelte/store';
import { testModeState } from './testModeState.svelte';

export type PositionMode = 'random' | 'predictable' | 'manual';
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

const { subscribe, set: svelteSet } = writable<TestModeState>(testModeState.state);

const syncStore = () => { svelteSet(testModeState.state); };

export function toggleTestMode() {
  testModeState.toggle();
  syncStore();
}

export const testModeStore = {
  subscribe,
  update: (fn: (s: TestModeState) => TestModeState) => {
    testModeState.update(fn);
    syncStore();
  },
  set: (value: TestModeState) => {
    testModeState.state = value;
    syncStore();
  }
};
