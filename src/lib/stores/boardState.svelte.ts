// src/lib/stores/boardState.svelte.ts
// SSoT для стану ігрової дошки. Використовує Svelte 5 Runes.
// Обгортку для Svelte 4 (writable) надає boardStore.ts (bridge pattern).

import type { BoardState } from './boardStore';
import { logService } from '$lib/services/logService';

class BoardStateRune {
    private _state = $state<BoardState | null>(null);

    get state() {
        return this._state;
    }

    set state(value: BoardState | null) {
        this._state = value;
    }

    update(fn: (s: BoardState | null) => BoardState | null) {
        this._state = fn(this._state);
    }

    movePlayer(row: number, col: number) {
        logService.piece(`(boardState) movePlayer to [${row}, ${col}]`);
        if (!this._state) return;
        const newBoard = this._state.board.map(r => [...r]);
        if (this._state.playerRow !== null && this._state.playerCol !== null) {
            newBoard[this._state.playerRow][this._state.playerCol] = 0;
        }
        newBoard[row][col] = 1;
        this._state = { ...this._state, playerRow: row, playerCol: col, board: newBoard };
    }

    incrementVisitCount(row: number, col: number) {
        if (!this._state) return;
        const key = `${row}-${col}`;
        const newCounts = { ...this._state.cellVisitCounts, [key]: (this._state.cellVisitCounts[key] || 0) + 1 };
        this._state = { ...this._state, cellVisitCounts: newCounts };
    }

    resetCellVisitCounts() {
        if (!this._state) return;
        this._state = { ...this._state, cellVisitCounts: {} };
    }

    reset() {
        this._state = null;
    }
}

export const boardState = new BoardStateRune();
