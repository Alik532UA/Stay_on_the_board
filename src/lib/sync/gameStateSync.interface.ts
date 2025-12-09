// src/lib/sync/gameStateSync.interface.ts
/**
 * @file Інтерфейс для абстракції синхронізації ігрового стану.
 * @description Цей інтерфейс дозволяє використовувати різні стратегії синхронізації:
 * - LocalGameStateSync: локальне зберігання в Svelte stores (поточна поведінка)
 * - FirebaseGameStateSync: синхронізація через Firebase Firestore (майбутня реалізація)
 * 
 * Це забезпечує єдину точку інтеграції для онлайн-режиму без зміни ігрової логіки.
 */

import type { BoardState } from '$lib/stores/boardStore';
import type { PlayerState } from '$lib/stores/playerStore';
import type { ScoreState } from '$lib/stores/scoreStore';

/**
 * Повний стан гри, що синхронізується між гравцями.
 */
export interface SyncableGameState {
    boardState: BoardState;
    playerState: PlayerState;
    scoreState: ScoreState;
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
 * Реалізації цього інтерфейсу відповідають за збереження та синхронізацію стану гри.
 */
export interface IGameStateSync {
    /**
     * Ідентифікатор сесії (для онлайн-режиму - roomId).
     */
    readonly sessionId: string | null;

    /**
     * Чи підключено до сервера синхронізації.
     */
    readonly isConnected: boolean;

    /**
     * Ініціалізує синхронізацію для нової гри.
     * @param sessionId - Ідентифікатор сесії (для онлайн - roomId)
     * @returns Promise що резолвиться коли з'єднання встановлено
     */
    initialize(sessionId?: string): Promise<void>;

    /**
     * Надсилає поточний стан гри для синхронізації.
     * @param state - Стан гри для синхронізації
     */
    pushState(state: SyncableGameState): Promise<void>;

    /**
     * Отримує поточний стан гри з джерела синхронізації.
     * @returns Поточний стан гри або null якщо стан недоступний
     */
    pullState(): Promise<SyncableGameState | null>;

    /**
     * Надсилає хід для синхронізації.
     * @param moveData - Дані ходу
     */
    pushMove(moveData: SyncMoveData): Promise<void>;

    /**
     * Підписується на оновлення стану гри.
     * @param callback - Функція, що викликається при оновленні
     * @returns Функція для відписки
     */
    subscribe(callback: GameStateSyncCallback): () => void;

    /**
     * Завершує синхронізацію та звільняє ресурси.
     */
    cleanup(): Promise<void>;
}
