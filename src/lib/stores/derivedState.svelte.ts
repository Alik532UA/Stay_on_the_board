import { boardStore } from './boardStore';
import { playerStore } from './playerStore';
import { uiStateStore } from './uiStateStore';
import { animationStore, initialState as initialAnimationState } from './animationStore';
import { timerStore } from './timerStore';
import { appSettingsStore } from './appSettingsStore';
import { availableMovesStore } from './availableMovesStore';
import { languages } from '$lib/constants';
import type { MoveDirectionType } from '$lib/models/Piece';

// Допоміжна функція для створення реактивного стану зі стору Svelte 4
function fromStore<T>(store: any, initialValue: T) {
    let state = $state<T>(initialValue);
    store.subscribe((v: T) => {
        state = v;
    });
    return {
        get current() { return state; }
    };
}

// Реактивні джерела ( Runes-версії існуючих сторів )
const board = fromStore(boardStore, null);
const player = fromStore(playerStore, null);
const ui = fromStore(uiStateStore, null);
const animation = fromStore(animationStore, initialAnimationState);
const timer = fromStore(timerStore, {});
const appSettings = fromStore(appSettingsStore, {});
const availableMovesVal = fromStore(availableMovesStore, []);

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
        const playerStore = player.current;
        const boardStore = board.current;

        if (!playerStore) return null;

        if (uiState?.lastMove) {
            const p = playerStore.players[uiState.lastMove.player];
            if (p?.type === 'ai' || p?.type === 'computer') {
                return {
                    direction: uiState.lastMove.direction,
                    distance: uiState.lastMove.distance
                };
            }
        }

        if (!boardStore || boardStore.moveQueue.length === 0) return null;
        const lastMove = boardStore.moveQueue[boardStore.moveQueue.length - 1];
        const pMod = playerStore.players[lastMove.player - 1];
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
        const playerStore = player.current;
        const boardStore = board.current;

        if (!playerStore) return null;

        if (uiState?.lastMove) {
            const p = playerStore.players[uiState.lastMove.player];
            if (p?.type === 'human') {
                return {
                    direction: uiState.lastMove.direction,
                    distance: uiState.lastMove.distance
                };
            }
        }

        if (!boardStore || boardStore.moveQueue.length === 0) return null;
        const lastMove = boardStore.moveQueue[boardStore.moveQueue.length - 1];
        const pMod = playerStore.players[lastMove.player - 1];
        if (pMod?.type === 'human') {
            return {
                direction: lastMove.direction,
                distance: lastMove.distance
            };
        }
        return null;
    },

    get isPlayerTurn() {
        if (!player.current) return false;
        const currentPlayerIndex = player.current.currentPlayerIndex;
        const currentPlayer = player.current.players[currentPlayerIndex];

        if (ui.current?.intendedGameType === 'online') {
            return ui.current.onlinePlayerIndex === currentPlayerIndex;
        }

        return currentPlayer?.type === 'human';
    },

    get visualPosition() {
        const boardStoreVal = board.current;
        const animationStoreVal = animation.current;

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
                return calculateStartPosition(nextMove as any);
            }
        }

        return { row: boardStoreVal.playerRow, col: boardStoreVal.playerCol };
    },

    get visualCellVisitCounts() {
        const boardStoreVal = board.current;
        const animationStoreVal = animation.current;
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
        const p = player.current;
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
        return (timer.current as any).remainingTime ?? 0;
    },

    get isGameOver() {
        return ui.current?.isGameOver ?? false;
    }
};
