/**
 * Типи для результатів ходу в грі та зміни рахунку.
 * Використовуються в GameModes та gameLogicService.
 */

import type { Position } from './position';
import type { MoveDirectionType } from '$lib/models/Piece';
import type { Player } from '$lib/models/player';
import type { SideEffect } from '$lib/services/sideEffectService';

/**
 * Зміни стану дошки після ходу
 */
export interface BoardStateChanges {
    playerRow: number;
    playerCol: number;
    cellVisitCounts: Record<string, number>;
    moveQueue: MoveQueueItem[];
    moveHistory: MoveHistoryItem[];
}

/**
 * Елемент черги ходів для анімації
 */
export interface MoveQueueItem {
    player: number;
    direction: MoveDirectionType;
    distance: number;
    to: Position;
}

/**
 * Елемент історії ходів
 */
export interface MoveHistoryItem {
    pos: Position;
    blocked: Position[];
    visits: Record<string, number>;
    blockModeEnabled: boolean;
    lastMove?: {
        direction: MoveDirectionType;
        distance: number;
        player: number;
    };
}

/**
 * Зміни стану гравців
 */
export interface PlayerStateChanges {
    players: Player[];
}

/**
 * Зміни рахунку
 */
export interface ScoreStateChanges {
    penaltyPoints: number;
    movesInBlockMode: number;
    jumpedBlockedCells: number;
    distanceBonus: number;
}

/**
 * Зміни UI стану
 */
export interface UIStateChanges {
    lastMove: {
        direction: MoveDirectionType;
        distance: number;
        player: number;
    } | null;
}

/**
 * Всі зміни стану після успішного ходу
 */
export interface MoveStateChanges {
    boardState: BoardStateChanges;
    playerState: PlayerStateChanges;
    scoreState: ScoreStateChanges;
    uiState: UIStateChanges;
}

/**
 * Результат успішного ходу
 */
export interface SuccessfulMoveResult {
    success: true;
    changes: MoveStateChanges;
    newPosition: Position;
    bonusPoints: number;
    penaltyPoints: number;
    sideEffects: SideEffect[];
}

/**
 * Результат невдалого ходу
 */
export interface FailedMoveResult {
    success: false;
    reason: 'out_of_bounds' | 'blocked_cell';
    changes?: Partial<MoveStateChanges>;
}

/**
 * Об'єднаний тип результату ходу
 */
export type GameMoveResult = SuccessfulMoveResult | FailedMoveResult;

/**
 * Дані для зміни рахунку, передаються в applyScoreChanges
 * Витягуються з SuccessfulMoveResult
 */
export interface ScoreChangesData {
    bonusPoints: number;
    penaltyPoints: number;
}
