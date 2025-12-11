// src/lib/sync/gameStateSync.interface.ts
import type { BoardState } from '$lib/stores/boardStore';
import type { PlayerState } from '$lib/stores/playerStore';
import type { ScoreState } from '$lib/stores/scoreStore';
import type { GameSettingsState } from '$lib/stores/gameSettingsStore';
import type { GameOverPayload } from '$lib/stores/gameOverStore';

export interface SyncableGameState {
    boardState: BoardState;
    playerState: PlayerState;
    scoreState: ScoreState;
    settings?: Partial<GameSettingsState>;
    version: number;
    updatedAt: number;
    // Додаємо стан завершення гри
    gameOver?: GameOverPayload | null;
    // Додаємо стан запитів на рестарт
    restartRequests?: Record<string, boolean>; // playerId -> true
}

export interface SyncMoveData {
    playerId: number;
    direction: string;
    distance: number;
    newPosition: { row: number; col: number };
    timestamp: number;
}

export type GameStateSyncEvent =
    | { type: 'state_updated'; state: SyncableGameState }
    | { type: 'player_joined'; playerId: number; playerName: string }
    | { type: 'player_left'; playerId: number }
    | { type: 'game_started' }
    | { type: 'game_ended'; reason: string }
    | { type: 'connection_lost' }
    | { type: 'connection_restored' }
    | { type: 'game_over_sync'; payload: GameOverPayload }; // Нова подія

export type GameStateSyncCallback = (event: GameStateSyncEvent) => void;

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