/**
 * Типи для позиції та результатів руху фігури на дошці.
 * Використовуються в Piece.ts та пов'язаних модулях.
 */

import type { MoveDirectionType } from '$lib/models/Piece';

/**
 * Позиція на дошці (рядок та колонка)
 */
export interface Position {
    row: number;
    col: number;
}

/**
 * Результат виконання руху фігури
 */
export interface MoveResult {
    success: boolean;
    newPosition?: Position;
    error?: string;
}

/**
 * Доступний хід (напрямок та відстань)
 */
export interface AvailableMove {
    direction: MoveDirectionType;
    distance: number;
}
