import type { GameSettingsState } from '$lib/stores/gameSettingsStore';
import type { SyncableGameState } from '$lib/sync/gameStateSync.interface';

export interface OnlinePlayer {
    id: string;
    name: string;
    color: string;
    isReady: boolean;
    joinedAt: number;
    isOnline: boolean;
    isWatchingReplay?: boolean; // Нове поле
    lastSeen?: number; // Timestamp of last heartbeat
    isDisconnected?: boolean; // True if player missed heartbeats
    disconnectStartedAt?: number; // Timestamp when disconnect was detected

export interface Room {
    id: string;
    name: string;
    hostId: string;
    status: 'waiting' | 'playing' | 'finished';
    createdAt: number;
    lastActivity: number;
    isPrivate: boolean;
    settingsLocked: boolean;
    allowGuestSettings: boolean;

    gameState: SyncableGameState | null;
    players: Record<string, OnlinePlayer>;
    settings: GameSettingsState;
}

export interface RoomSummary {
    id: string;
    name: string;
    status: 'waiting' | 'playing' | 'finished';
    playerCount: number;
    maxPlayers: number;
    isPrivate: boolean;
}