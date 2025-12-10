import type { GameSettingsState } from '$lib/stores/gameSettingsStore';
import type { SyncableGameState } from '$lib/sync/gameStateSync.interface';

export interface OnlinePlayer {
    id: string;
    name: string;
    color: string;
    isReady: boolean;
    joinedAt: number;
    isOnline: boolean;
}

export interface Room {
    id: string;
    name: string;
    hostId: string;
    status: 'waiting' | 'playing' | 'finished';
    createdAt: number;
    lastActivity: number;
    isPrivate: boolean;
    settingsLocked: boolean; // Блокування під час гри
    allowGuestSettings: boolean; // Дозвіл гостям змінювати налаштування в лобі

    // Стан гри (може бути null, якщо гра ще не почалася)
    gameState: SyncableGameState | null;

    // Мапа гравців: playerId -> OnlinePlayer
    players: Record<string, OnlinePlayer>;

    // Налаштування гри
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