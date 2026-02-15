import { boardState } from './boardState.svelte';
import type { BoardState } from './boardStore';
import { playerState } from './playerState.svelte';
import type { PlayerState } from './playerStore';
import { uiStateStore } from './uiStateStore';
import type { UiState } from '$lib/types/uiState';
import { timerState } from './timerState.svelte';
import { animationState } from './animationState.svelte';
import { availableMovesStore } from './availableMovesStore';
import type { MoveDirectionType } from '$lib/models/Piece';
import type { Move } from '$lib/utils/gameUtils';

// Інтерфейс для Svelte 4 store (subscribe-only)
interface Subscribable<T> {
    subscribe: (fn: (v: T) => void) => (() => void);
}

// Допоміжна функція для створення реактивного стану зі стору Svelte 4
function fromStore<T>(store: Subscribable<T>, initialValue: T) {
    let state = $state<T>(initialValue);
    store.subscribe((v: T) => {
        state = v;
    });
    return {
        get current() { return state; }
    };
}

// Реактивні джерела
// Стори з Runes SSoT — читаємо напряму (без bridge)
// Стори без Runes SSoT — читаємо через fromStore (bridge)
const ui = fromStore<UiState>(uiStateStore, {} as UiState);
const availableMovesVal = fromStore<Move[]>(availableMovesStore, []);

const oppositeDirections: Record<string, string> = {
    'up': 'down', 'down': 'up',
    'left': 'right', 'right': 'left',
    'up-left': 'down-right', 'up-right': 'down-left',
    'down-left': 'up-right', 'down-right': 'up-left'
};

function calculateStartPosition(move: { direction: MoveDirectionType, distance: number, to: { row: number, col: number } }) {
    const { direction, distance, to } = move;
    const oppositeDir = oppositeDirections[direction];

    let dRow = 0;
    let dCol = 0;

    switch (oppositeDir) {
        case 'up': dRow = -1; break;
        case 'down': dRow = 1; break;
        case 'left': dCol = -1; break;
        case 'right': dCol = 1; break;
        case 'up-left': dRow = -1; dCol = -1; break;
        case 'up-right': dRow = -1; dCol = 1; break;
        case 'down-left': dRow = 1; dCol = -1; break;
        case 'down-right': dRow = 1; dCol = 1; break;
    }

    return {
        row: to.row + (dRow * distance),
        col: to.col + (dCol * distance)
    };
}

// === ОБЧИСЛЮВАЛЬНІ ЗНАЧЕННЯ ($derived) ===

export const derivedState = {
    get lastComputerMove() {
        const uiState = ui.current;
        const playerStoreVal = playerState.state;
        const boardStoreVal = boardState.state;

        if (!playerStoreVal) return null;

        if (uiState?.lastMove) {
            const p = playerStoreVal.players[uiState.lastMove.player];
            if (p?.type === 'ai' || p?.type === 'computer') {
                return {
                    direction: uiState.lastMove.direction,
                    distance: uiState.lastMove.distance
                };
            }
        }

        if (!boardStoreVal || boardStoreVal.moveQueue.length === 0) return null;
        const lastMove = boardStoreVal.moveQueue[boardStoreVal.moveQueue.length - 1];
        const pMod = playerStoreVal.players[lastMove.player - 1];
        if (pMod?.type === 'ai' || pMod?.type === 'computer') {
            return {
                direction: lastMove.direction,
                distance: lastMove.distance
            };
        }
        return null;
    },

    get lastPlayerMove() {
        const uiState = ui.current;
        const playerStoreVal = playerState.state;
        const boardStoreVal = boardState.state;

        if (!playerStoreVal) return null;

        if (uiState?.lastMove) {
            const p = playerStoreVal.players[uiState.lastMove.player];
            if (p?.type === 'human') {
                return {
                    direction: uiState.lastMove.direction,
                    distance: uiState.lastMove.distance
                };
            }
        }

        if (!boardStoreVal || boardStoreVal.moveQueue.length === 0) return null;
        const lastMove = boardStoreVal.moveQueue[boardStoreVal.moveQueue.length - 1];
        const pMod = playerStoreVal.players[lastMove.player - 1];
        if (pMod?.type === 'human') {
            return {
                direction: lastMove.direction,
                distance: lastMove.distance
            };
        }
        return null;
    },

    get isPlayerTurn() {
        if (!playerState.state) return false;
        const currentPlayerIndex = playerState.state.currentPlayerIndex;
        const currentPlayer = playerState.state.players[currentPlayerIndex];

        if (ui.current?.intendedGameType === 'online') {
            return ui.current.onlinePlayerIndex === currentPlayerIndex;
        }

        return currentPlayer?.type === 'human';
    },

    get visualPosition() {
        const boardStoreVal = boardState.state;
        const animationStoreVal = animationState.state;

        if (!boardStoreVal) return { row: null, col: null };

        // FIX: New Game Guard
        if (boardStoreVal.moveHistory.length <= 1) {
            return { row: boardStoreVal.playerRow, col: boardStoreVal.playerCol };
        }

        if (animationStoreVal.visualMoveQueue && animationStoreVal.visualMoveQueue.length > 0) {
            const lastAnimatedMove = animationStoreVal.visualMoveQueue[animationStoreVal.visualMoveQueue.length - 1];
            const targetPos = lastAnimatedMove.to || { row: lastAnimatedMove.row, col: lastAnimatedMove.col };

            return {
                row: targetPos.row ?? boardStoreVal.playerRow,
                col: targetPos.col ?? boardStoreVal.playerCol
            };
        } else if (animationStoreVal.animationQueue.length > 0) {
            const nextMove = animationStoreVal.animationQueue[0];
            if (nextMove.to && nextMove.direction && nextMove.distance) {
                return calculateStartPosition({
                    direction: nextMove.direction,
                    distance: nextMove.distance,
                    to: nextMove.to
                });
            }
        }

        return { row: boardStoreVal.playerRow, col: boardStoreVal.playerCol };
    },

    get visualCellVisitCounts() {
        const boardStoreVal = boardState.state;
        const animationStoreVal = animationState.state;
        const vPos = this.visualPosition;

        if (!boardStoreVal) return {};

        if (boardStoreVal.moveHistory.length <= 1) {
            return boardStoreVal.cellVisitCounts;
        }

        if (!animationStoreVal.isAnimating) {
            return boardStoreVal.cellVisitCounts;
        }

        if (!vPos || vPos.row === null || vPos.col === null) {
            return boardStoreVal.moveHistory[0]?.visits || {};
        }

        const relevantHistoryEntry = [...boardStoreVal.moveHistory].reverse().find(entry =>
            entry.pos.row === vPos.row && entry.pos.col === vPos.col
        );

        if (relevantHistoryEntry && relevantHistoryEntry.visits) {
            return relevantHistoryEntry.visits;
        }
        return boardStoreVal.moveHistory[boardStoreVal.moveHistory.length - 1]?.visits || {};
    },

    get currentPlayer() {
        const p = playerState.state;
        return p ? p.players[p.currentPlayerIndex] : null;
    },

    get currentPlayerColor() {
        const p = this.currentPlayer;
        return p ? p.color : null;
    },

    get availableMoves() {
        return availableMovesVal.current;
    },

    get remainingTime() {
        return timerState.state.remainingTime ?? 0;
    },

    get isGameOver() {
        return ui.current?.isGameOver ?? false;
    }
};
