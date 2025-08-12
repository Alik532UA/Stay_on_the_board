// src/lib/stores/testModeStore.ts
import { writable } from 'svelte/store';

export type PositionMode = 'random' | 'predictable' | 'manual'; // predictable = 0,0
export type ComputerMoveMode = 'random' | 'manual';

export interface TestModeState {
  startPositionMode: PositionMode;
  manualStartPosition: { x: number; y: number } | null;
  computerMoveMode: ComputerMoveMode;
  manualComputerMove: {
    direction: string | null;
    distance: number | null;
  };
}

const initialState: TestModeState = {
  startPositionMode: 'predictable', // За замовчуванням, для стабільності тестів
  manualStartPosition: null,
  computerMoveMode: 'random',
  manualComputerMove: {
    direction: null,
    distance: null,
  },
};

export const testModeStore = writable<TestModeState>(initialState);