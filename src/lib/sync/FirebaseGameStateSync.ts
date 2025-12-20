// src/lib/sync/FirebaseGameStateSync.ts
import {
    doc,
    getDoc,
    onSnapshot,
    updateDoc,
    collection,
    addDoc,
    serverTimestamp,
    type Unsubscribe,
    type DocumentReference,
    type Firestore
} from 'firebase/firestore';

import type {
    IGameStateSync,
    SyncableGameState,
    SyncMoveData,
    GameStateSyncCallback,
    GameStateSyncEvent,
    VoteType
} from './gameStateSync.interface';

import { getFirestoreDb, isFirebaseConfigured } from '$lib/services/firebaseService';
import { logService } from '$lib/services/logService';
import { GameStateSerializer } from './GameStateSerializer';

interface FirebaseRoomDocument {
    gameState: any; // Serialized state
    createdAt: ReturnType<typeof serverTimestamp>;
    updatedAt: ReturnType<typeof serverTimestamp>;
    hostPlayerId: number;
    players: Array<any>;
    status: 'waiting' | 'playing' | 'finished';
}

export class FirebaseGameStateSync implements IGameStateSync {
    private _sessionId: string | null = null;
    private _isConnected: boolean = false;
    private _subscribers: Set<GameStateSyncCallback> = new Set();
    private _stateVersion: number = 0;
    private _unsubscribeSnapshot: Unsubscribe | null = null;
    private _roomRef: DocumentReference | null = null;
    private _db: Firestore | null = null;

    get sessionId(): string | null {
        return this._sessionId;
    }

    get isConnected(): boolean {
        return this._isConnected;
    }

    async initialize(sessionId?: string): Promise<void> {
        if (!isFirebaseConfigured()) {
            throw new Error('Firebase не налаштовано. Перевірте .env файл.');
        }

        try {
            this._db = getFirestoreDb();

            if (sessionId) {
                this._sessionId = sessionId;
                this._roomRef = doc(this._db, 'rooms', sessionId);

                const roomSnapshot = await getDoc(this._roomRef);
                if (!roomSnapshot.exists()) {
                    throw new Error(`Кімната "${sessionId}" не знайдена.`);
                }
            } else {
                const roomsCollection = collection(this._db, 'rooms');
                const newRoomRef = await addDoc(roomsCollection, {
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                    status: 'waiting',
                    players: [],
                    gameState: null
                });

                this._sessionId = newRoomRef.id;
                this._roomRef = newRoomRef;

                logService.init(`[FirebaseGameStateSync] Created new room: ${this._sessionId}`);
            }

            this._subscribeToRoomUpdates();
            this._isConnected = true;

            logService.init(`[FirebaseGameStateSync] Connected to room: ${this._sessionId}`);
        } catch (error) {
            this._isConnected = false;
            logService.error('[FirebaseGameStateSync] Initialization error:', error);
            throw error;
        }
    }

    async pushState(state: SyncableGameState): Promise<void> {
        if (!this._roomRef || !this._isConnected) {
            logService.error('[FirebaseGameStateSync] Cannot push state: not connected');
            return;
        }

        try {
            this._stateVersion++;

            const finalState = {
                ...GameStateSerializer.serialize(state),
                version: this._stateVersion,
                updatedAt: Date.now()
            };

            await updateDoc(this._roomRef, {
                gameState: finalState,
                updatedAt: serverTimestamp()
            });

            logService.state(`[FirebaseGameStateSync] State pushed, version: ${this._stateVersion}`);
        } catch (error) {
            logService.error('[FirebaseGameStateSync] Push state error:', error);
        }
    }

    // FIX: Реалізація атомарного оновлення голосу
    async updateVote(playerId: string, vote: VoteType): Promise<void> {
        if (!this._roomRef || !this._isConnected) {
            logService.error('[FirebaseGameStateSync] Cannot update vote: not connected');
            return;
        }

        try {
            // Використовуємо Dot Notation для оновлення конкретного поля в мапі
            // Це запобігає перезапису голосів інших гравців (Race Condition)
            const fieldPath = `gameState.noMovesVotes.${playerId}`;

            await updateDoc(this._roomRef, {
                [fieldPath]: vote,
                updatedAt: serverTimestamp()
            });

            logService.logicMove(`[FirebaseGameStateSync] Vote updated atomically for ${playerId}: ${vote}`);
        } catch (error) {
            logService.error('[FirebaseGameStateSync] Update vote error:', error);
        }
    }

    async pullState(): Promise<SyncableGameState | null> {
        if (!this._roomRef) return null;

        try {
            const snapshot = await getDoc(this._roomRef);
            if (!snapshot.exists()) return null;

            const data = snapshot.data() as FirebaseRoomDocument;
            return GameStateSerializer.deserialize(data.gameState);
        } catch (error) {
            logService.error('[FirebaseGameStateSync] Pull state error:', error);
            return null;
        }
    }

    async pushMove(moveData: SyncMoveData): Promise<void> {
        if (!this._roomRef || !this._db) {
            logService.error('[FirebaseGameStateSync] Cannot push move: not connected');
            return;
        }

        try {
            const movesCollection = collection(this._roomRef, 'moves');
            await addDoc(movesCollection, {
                ...moveData,
                createdAt: serverTimestamp()
            });

            logService.logicMove('[FirebaseGameStateSync] Move pushed:', moveData);
        } catch (error) {
            logService.error('[FirebaseGameStateSync] Push move error:', error);
        }
    }

    subscribe(callback: GameStateSyncCallback): () => void {
        this._subscribers.add(callback);
        return () => {
            this._subscribers.delete(callback);
        };
    }

    async cleanup(): Promise<void> {
        if (this._unsubscribeSnapshot) {
            this._unsubscribeSnapshot();
            this._unsubscribeSnapshot = null;
        }

        this._subscribers.clear();
        this._isConnected = false;
        this._sessionId = null;
        this._roomRef = null;
        this._db = null;

        logService.init('[FirebaseGameStateSync] Cleaned up');
    }

    private _subscribeToRoomUpdates(): void {
        if (!this._roomRef) return;

        this._unsubscribeSnapshot = onSnapshot(
            this._roomRef,
            (snapshot) => {
                if (!snapshot.exists()) {
                    this._notifySubscribers({ type: 'game_ended', reason: 'room_deleted' });
                    return;
                }

                const data = snapshot.data() as FirebaseRoomDocument;

                if (data.gameState) {
                    // Приймаємо будь-яке оновлення, навіть якщо версія не змінилася (для голосування)
                    // Але оновлюємо локальну версію, якщо вона більша
                    if (data.gameState.version >= this._stateVersion) {
                        this._stateVersion = data.gameState.version;
                    }

                    const remoteState = GameStateSerializer.deserialize(data.gameState);

                    if (remoteState) {
                        this._notifySubscribers({
                            type: 'state_updated',
                            state: remoteState
                        });
                    }
                }
            },
            (error) => {
                logService.error('[FirebaseGameStateSync] Snapshot error:', error);
                this._isConnected = false;
                this._notifySubscribers({ type: 'connection_lost' });
            }
        );
    }

    private _notifySubscribers(event: GameStateSyncEvent): void {
        this._subscribers.forEach((callback) => {
            try {
                callback(event);
            } catch (error) {
                logService.error('[FirebaseGameStateSync] Subscriber error:', error);
            }
        });
    }
}

export function createFirebaseGameStateSync(): FirebaseGameStateSync {
    return new FirebaseGameStateSync();
}