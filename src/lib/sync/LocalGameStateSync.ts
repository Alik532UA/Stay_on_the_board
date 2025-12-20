// src/lib/sync/LocalGameStateSync.ts
import { get } from 'svelte/store';
import type {
    IGameStateSync,
    SyncableGameState,
    SyncMoveData,
    GameStateSyncCallback,
    GameStateSyncEvent,
    VoteType
} from './gameStateSync.interface';
import { boardStore } from '$lib/stores/boardStore';
import { playerStore } from '$lib/stores/playerStore';
import { scoreStore } from '$lib/stores/scoreStore';
import { logService } from '$lib/services/logService';

/**
 * Локальна реалізація синхронізації стану гри.
 */
export class LocalGameStateSync implements IGameStateSync {
    private _sessionId: string | null = null;
    private _isConnected: boolean = false;
    private _subscribers: Set<GameStateSyncCallback> = new Set();
    private _stateVersion: number = 0;
    // Тимчасове сховище для голосів у локальному режимі (хоча воно не використовується активно)
    private _localVotes: Record<string, VoteType> = {};

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
        this._localVotes = {};
        logService.init(`[LocalGameStateSync] Initialized with session: ${this._sessionId}`);
    }

    async pushState(state: SyncableGameState): Promise<void> {
        this._stateVersion++;

        if (state.boardState) boardStore.set(state.boardState);
        if (state.playerState) playerStore.set(state.playerState);
        if (state.scoreState) scoreStore.set(state.scoreState);

        // Оновлюємо локальні голоси, якщо вони передані
        if (state.noMovesVotes) {
            this._localVotes = state.noMovesVotes;
        }

        this._notifySubscribers({
            type: 'state_updated',
            state: { ...state, version: this._stateVersion, updatedAt: Date.now() }
        });

        logService.state(`[LocalGameStateSync] State pushed, version: ${this._stateVersion}`);
    }

    // FIX: Реалізація updateVote для локального режиму
    async updateVote(playerId: string, vote: VoteType): Promise<void> {
        this._localVotes[playerId] = vote;
        logService.logicMove(`[LocalGameStateSync] Vote updated locally for ${playerId}: ${vote}`);

        // У локальному режимі ми просто імітуємо оновлення стану
        const currentState = await this.pullState();
        if (currentState) {
            this._notifySubscribers({
                type: 'state_updated',
                state: currentState
            });
        }
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
            updatedAt: Date.now(),
            noMovesVotes: this._localVotes
        };
    }

    async pushMove(moveData: SyncMoveData): Promise<void> {
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
        this._localVotes = {};
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

export const localGameStateSync = new LocalGameStateSync();