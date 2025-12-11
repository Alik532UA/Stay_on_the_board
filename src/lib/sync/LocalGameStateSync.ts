// src/lib/sync/LocalGameStateSync.ts
/**
 * @file Локальна реалізація синхронізації ігрового стану.
 * @description Ця реалізація працює з локальними Svelte stores без
 * зовнішньої синхронізації. Використовується для режимів training,
 * local та virtual-player.
 * 
 * Для онлайн-режиму буде використовуватися FirebaseGameStateSync.
 */

import { get } from 'svelte/store';
import type {
    IGameStateSync,
    SyncableGameState,
    SyncMoveData,
    GameStateSyncCallback,
    GameStateSyncEvent
} from './gameStateSync.interface';
import { boardStore } from '$lib/stores/boardStore';
import { playerStore } from '$lib/stores/playerStore';
import { scoreStore } from '$lib/stores/scoreStore';
import { logService } from '$lib/services/logService';

/**
 * Локальна реалізація синхронізації стану гри.
 * Працює безпосередньо з Svelte stores без зовнішньої синхронізації.
 */
export class LocalGameStateSync implements IGameStateSync {
    private _sessionId: string | null = null;
    private _isConnected: boolean = false;
    private _subscribers: Set<GameStateSyncCallback> = new Set();
    private _stateVersion: number = 0;

    get sessionId(): string | null {
        return this._sessionId;
    }

    get isConnected(): boolean {
        return this._isConnected;
    }

    async initialize(sessionId?: string): Promise<void> {
        this._sessionId = sessionId || `local-${Date.now()}`;
        this._isConnected = true;
        this._stateVersion = 0;
        logService.init(`[LocalGameStateSync] Initialized with session: ${this._sessionId}`);
    }

    async pushState(state: SyncableGameState): Promise<void> {
        // Локальна синхронізація: оновлюємо stores напряму
        this._stateVersion++;

        if (state.boardState) {
            boardStore.set(state.boardState);
        }
        if (state.playerState) {
            playerStore.set(state.playerState);
        }
        if (state.scoreState) {
            scoreStore.set(state.scoreState);
        }

        // Повідомляємо підписників
        this._notifySubscribers({
            type: 'state_updated',
            state: { ...state, version: this._stateVersion, updatedAt: Date.now() }
        });

        logService.state(`[LocalGameStateSync] State pushed, version: ${this._stateVersion}`);
    }

    async pullState(): Promise<SyncableGameState | null> {
        const boardState = get(boardStore);
        const playerState = get(playerStore);
        const scoreState = get(scoreStore);

        if (!boardState || !playerState || !scoreState) {
            return null;
        }

        return {
            boardState,
            playerState,
            scoreState,
            version: this._stateVersion,
            updatedAt: Date.now()
        };
    }

    async pushMove(moveData: SyncMoveData): Promise<void> {
        // Для локальної гри хід вже оброблений через gameLogicService
        // Тут просто логуємо для можливого replay
        logService.logicMove(`[LocalGameStateSync] Move pushed:`, moveData);
    }

    subscribe(callback: GameStateSyncCallback): () => void {
        this._subscribers.add(callback);
        return () => {
            this._subscribers.delete(callback);
        };
    }

    async cleanup(): Promise<void> {
        this._subscribers.clear();
        this._isConnected = false;
        this._sessionId = null;
        logService.init(`[LocalGameStateSync] Cleaned up`);
    }

    private _notifySubscribers(event: GameStateSyncEvent): void {
        this._subscribers.forEach(callback => {
            try {
                callback(event);
            } catch (error) {
                logService.error(`[LocalGameStateSync] Subscriber error:`, error);
            }
        });
    }
}

/**
 * Singleton instance для локальної синхронізації.
 */
export const localGameStateSync = new LocalGameStateSync();
