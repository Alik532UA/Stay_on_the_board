// src/lib/sync/gameStateSync.interface.ts
/**
 * @file Інтерфейс для абстракції синхронізації ігрового стану.
 */

import type { BoardState } from '$lib/stores/boardStore';
import type { PlayerState } from '$lib/stores/playerStore';
import type { ScoreState } from '$lib/stores/scoreStore';
import type { GameSettingsState } from '$lib/stores/gameSettingsStore';

/**
 * Повний стан гри, що синхронізується між гравцями.
 */
export interface SyncableGameState {
    boardState: BoardState;
    playerState: PlayerState;
    scoreState: ScoreState;
    // Додаємо налаштування для синхронізації
    settings?: Partial<GameSettingsState>;
    /** Версія стану для виявлення конфліктів */
    version: number;
    /** Час останнього оновлення */
    updatedAt: number;
}

/**
 * Дані для синхронізації ходу.
 */
export interface SyncMoveData {
    playerId: number;
    direction: string;
    distance: number;
    newPosition: { row: number; col: number };
    timestamp: number;
}

/**
 * Подія синхронізації стану.
 */
export type GameStateSyncEvent =
    | { type: 'state_updated'; state: SyncableGameState }
    | { type: 'player_joined'; playerId: number; playerName: string }
    | { type: 'player_left'; playerId: number }
    | { type: 'game_started' }
    | { type: 'game_ended'; reason: string }
    | { type: 'connection_lost' }
    | { type: 'connection_restored' };

/**
 * Callback для обробки подій синхронізації.
 */
export type GameStateSyncCallback = (event: GameStateSyncEvent) => void;

/**
 * Інтерфейс для синхронізації ігрового стану.
 */
export interface IGameStateSync {
    readonly sessionId: string | null;
    readonly isConnected: boolean;

    initialize(sessionId?: string): Promise<void>;
    pushState(state: SyncableGameState): Promise<void>;
    pullState(): Promise<SyncableGameState | null>;
    pushMove(moveData: SyncMoveData): Promise<void>;
    subscribe(callback: GameStateSyncCallback): () => void;
    cleanup(): Promise<void>;
}