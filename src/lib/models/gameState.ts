// src/lib/models/gameState.ts
/**
 * @file Типи для ігрового стану.
 * @description Централізоване визначення типів для роботи з ігровим станом.
 * Замінює використання `any` в gameLogicService та інших місцях.
 */

import type { BoardState } from '$lib/stores/boardStore';
import type { PlayerState } from '$lib/stores/playerStore';
import type { ScoreState } from '$lib/stores/scoreStore';
import type { UiState } from '$lib/stores/uiStateStore';
import type { GameSettingsState } from '$lib/stores/gameSettingsStore';
import type { MoveDirectionType } from './Piece';

/**
 * Комбінований стан гри для передачі в gameLogicService.
 */
export interface CombinedGameState extends BoardState, PlayerState, ScoreState {
    /** Прапорці з uiState */
    isFirstMove?: boolean;
    selectedDirection?: string | null;
    selectedDistance?: number | null;
}

/**
 * Результат обчислення очок за хід.
 */
export interface ScoreChanges {
    /** Базові очки за хід (залежить від видимості дошки) */
    baseScoreChange: number;
    /** Бонусні очки (дистанція, стрибки) */
    bonusPoints: number;
    /** Штрафні очки за хід */
    penaltyPointsForMove: number;
    /** Загальні штрафні очки */
    penaltyPoints: number;
    /** Зміна лічильника ходів у режимі блокування */
    movesInBlockModeChange: number;
    /** Зміна лічильника стрибків через заблоковані клітинки */
    jumpedBlockedCellsChange: number;
    /** Зміна бонусу за дистанцію */
    distanceBonusChange: number;
}

/**
 * Результат виконання ходу.
 */
export interface MoveResult {
    success: boolean;
    reason?: 'out_of_bounds' | 'blocked_cell' | string;
    changes?: {
        boardState: Partial<BoardState>;
        playerState: Partial<PlayerState>;
        scoreState: Partial<ScoreState>;
        uiState: Partial<UiState>;
    };
    newPosition?: { row: number; col: number };
    bonusPoints?: number;
    penaltyPoints?: number;
    sideEffects?: SideEffect[];
}

/**
 * Побічний ефект (speak_move, тощо).
 */
export interface SideEffect {
    type: 'speak_move' | string;
    payload: {
        move?: { direction: MoveDirectionType; distance: number };
        lang?: string;
        voiceURI?: string | null;
        onEndCallback?: () => void;
    };
}

/**
 * Тип режиму гри.
 */
export type GameModeType = 'training' | 'local' | 'timed' | 'online' | 'virtual-player';

/**
 * Конфігурація гравця для ініціалізації.
 */
export interface PlayerConfig {
    id: number;
    name: string;
    type: 'human' | 'computer' | 'ai';
    color: string;
    isComputer: boolean;
}
