// src/lib/stores/replayStore.ts
/**
 * @file Store для функціональності replay гри.
 */

import { writable } from 'svelte/store';
import type { MoveHistoryEntry } from '$lib/stores/boardStore';

export type AutoPlayDirection = 'paused' | 'forward' | 'backward';

export interface ReplayState {
    isReplayMode: boolean;
    moveHistory: MoveHistoryEntry[];
    boardSize: number;
    replayCurrentStep: number;
    autoPlayDirection: AutoPlayDirection;
    limitReplayPath: boolean;
}

const initialState: ReplayState = {
    isReplayMode: false,
    moveHistory: [],
    boardSize: 4,
    replayCurrentStep: 0,
    autoPlayDirection: 'paused',
    limitReplayPath: true,
};

const { subscribe, update } = writable<ReplayState>(initialState);

export const replayStore = {
    subscribe,
    startReplay: (moveHistory: MoveHistoryEntry[], boardSize: number): void => {
        update(state => ({
            ...state,
            isReplayMode: true,
            moveHistory,
            boardSize,
            replayCurrentStep: 0,
            autoPlayDirection: 'paused'
        }));
    },
    stopReplay: (): void => {
        update(state => ({
            ...state,
            isReplayMode: false,
            moveHistory: [],
            autoPlayDirection: 'paused'
        }));
    }
};
