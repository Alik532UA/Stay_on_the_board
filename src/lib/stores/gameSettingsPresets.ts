/**
 * @file Preset configurations for game modes.
 * @description Contains all preset definitions for different game modes.
 * Extracted from gameSettingsStore.ts to reduce file size.
 */

import type { GameModePreset, GameSettingsState } from './gameSettingsTypes';

/**
 * Налаштування для кожного пресету режиму гри.
 * Визначає, як змінюються налаштування при виборі пресету.
 */
export const presetConfigurations: Record<GameModePreset, Partial<GameSettingsState>> = {
    // ============================================================================
    // Virtual-Player presets (гравець проти AI)
    // ============================================================================
    'virtual-player-beginner': {
        gameMode: 'virtual-player-beginner',
        blockModeEnabled: false,
        autoHideBoard: false,
        speechEnabled: false,
        rememberGameMode: true,
        speechRate: 1,
        shortSpeech: false,
        speechFor: {
            player: true,
            computer: true,
            onlineMyMove: false,
            onlineOpponentMove: true
        },
        showGameInfoWidget: 'shown',
        showBoard: true,
        showPiece: true,
        showMoves: true,
    },
    'virtual-player-experienced': {
        gameMode: 'virtual-player-experienced',
        blockModeEnabled: false,
        autoHideBoard: true,
        speechEnabled: true,
        rememberGameMode: true,
        speechRate: 1.4,
        shortSpeech: true,
        speechFor: {
            player: false,
            computer: true,
            onlineMyMove: false,
            onlineOpponentMove: true
        },
        showGameInfoWidget: 'compact',
    },
    'virtual-player-pro': {
        gameMode: 'virtual-player-pro',
        blockModeEnabled: true,
        autoHideBoard: true,
        speechEnabled: true,
        rememberGameMode: true,
        speechRate: 1.6,
        shortSpeech: true,
        speechFor: {
            player: false,
            computer: true,
            onlineMyMove: false,
            onlineOpponentMove: true
        },
        showGameInfoWidget: 'compact',
    },
    'virtual-player-timed': {
        gameMode: 'virtual-player-timed',
        autoHideBoard: true,
        blockModeEnabled: true,
        speechEnabled: false,
        showGameInfoWidget: 'compact',
        speechRate: 1.6,
        shortSpeech: true,
        speechFor: {
            player: false,
            computer: true,
            onlineMyMove: false,
            onlineOpponentMove: true
        },
    },

    // ============================================================================
    // Local presets (локальна гра для 2+ гравців)
    // ============================================================================
    'local-observer': {
        gameMode: 'local-observer',
        autoHideBoard: false,
        blockModeEnabled: false,
        speechEnabled: false,
        showGameInfoWidget: 'compact',
        speechRate: 1.6,
        shortSpeech: true,
        speechFor: {
            player: false,
            computer: true,
            onlineMyMove: false,
            onlineOpponentMove: true
        },
    },
    'local-experienced': {
        gameMode: 'local-experienced',
        autoHideBoard: true,
        blockModeEnabled: false,
        speechEnabled: false,
        showGameInfoWidget: 'compact',
        speechRate: 1.6,
        shortSpeech: true,
        speechFor: {
            player: false,
            computer: true,
            onlineMyMove: false,
            onlineOpponentMove: true
        },
    },
    'local-pro': {
        gameMode: 'local-pro',
        autoHideBoard: true,
        blockModeEnabled: true,
        speechEnabled: false,
        showGameInfoWidget: 'compact',
        speechRate: 1.6,
        shortSpeech: true,
        speechFor: {
            player: false,
            computer: true,
            onlineMyMove: false,
            onlineOpponentMove: true
        },
    },

    // ============================================================================
    // Online presets (онлайн-гра, майбутнє)
    // ============================================================================
    'online-beginner': {
        gameMode: 'online-beginner',
        autoHideBoard: false,
        blockModeEnabled: false,
        speechEnabled: false,
        showGameInfoWidget: 'compact',
        speechRate: 1,
        shortSpeech: false,
        speechFor: {
            player: false,
            computer: true,
            onlineMyMove: false,
            onlineOpponentMove: true
        },
    },
    'online-experienced': {
        gameMode: 'online-experienced',
        autoHideBoard: true,
        blockModeEnabled: false,
        speechEnabled: false,
        showGameInfoWidget: 'compact',
        speechRate: 1.4,
        shortSpeech: true,
        speechFor: {
            player: false,
            computer: true,
            onlineMyMove: false,
            onlineOpponentMove: true
        },
    },
    'online-pro': {
        gameMode: 'online-pro',
        autoHideBoard: true,
        blockModeEnabled: true,
        speechEnabled: false,
        showGameInfoWidget: 'compact',
        speechRate: 1.6,
        shortSpeech: true,
        speechFor: {
            player: false,
            computer: true,
            onlineMyMove: false,
            onlineOpponentMove: true
        },
    },

    // ============================================================================
    // Legacy presets (зворотна сумісність, буде видалено)
    // ============================================================================
    beginner: {
        gameMode: 'virtual-player-beginner', // Auto-migrate to new preset
        blockModeEnabled: false,
        autoHideBoard: false,
        speechEnabled: false,
        rememberGameMode: true,
        speechRate: 1,
        shortSpeech: false,
        speechFor: {
            player: true,
            computer: true,
            onlineMyMove: false,
            onlineOpponentMove: true
        },
        showGameInfoWidget: 'shown',
        showBoard: true,
        showPiece: true,
        showMoves: true,
    },
    experienced: {
        gameMode: 'experienced', // Context-dependent migration needed
        blockModeEnabled: false,
        autoHideBoard: true,
        speechEnabled: true,
        rememberGameMode: true,
        speechRate: 1.4,
        shortSpeech: true,
        speechFor: {
            player: false,
            computer: true,
            onlineMyMove: false,
            onlineOpponentMove: true
        },
        showGameInfoWidget: 'compact',
    },
    pro: {
        gameMode: 'pro', // Context-dependent migration needed
        blockModeEnabled: true,
        autoHideBoard: true,
        speechEnabled: true,
        rememberGameMode: true,
        speechRate: 1.6,
        shortSpeech: true,
        speechFor: {
            player: false,
            computer: true,
            onlineMyMove: false,
            onlineOpponentMove: true
        },
        showGameInfoWidget: 'compact',
    },
    timed: {
        gameMode: 'virtual-player-timed', // Auto-migrate
        autoHideBoard: true,
        blockModeEnabled: true,
        speechEnabled: false,
        showGameInfoWidget: 'compact',
        speechRate: 1.6,
        shortSpeech: true,
        speechFor: {
            player: false,
            computer: true,
            onlineMyMove: false,
            onlineOpponentMove: true
        },
    },
    local: {
        gameMode: 'local-pro', // Default local preset
        autoHideBoard: true,
        blockModeEnabled: true,
        speechEnabled: false,
        showGameInfoWidget: 'compact',
        speechRate: 1.6,
        shortSpeech: true,
        speechFor: {
            player: false,
            computer: true,
            onlineMyMove: false,
            onlineOpponentMove: true
        },
    },
    online: {
        gameMode: 'online-pro', // Default online preset
        autoHideBoard: true,
        blockModeEnabled: true,
        speechEnabled: false,
        showGameInfoWidget: 'compact',
        speechRate: 1.6,
        shortSpeech: true,
        speechFor: {
            player: false,
            computer: true,
            onlineMyMove: false,
            onlineOpponentMove: true
        },
    },
    observer: {
        gameMode: 'local-observer', // Auto-migrate
        autoHideBoard: false,
        blockModeEnabled: false,
        speechEnabled: false,
        showGameInfoWidget: 'compact',
        speechRate: 1.6,
        shortSpeech: true,
        speechFor: {
            player: false,
            computer: true,
            onlineMyMove: false,
            onlineOpponentMove: true
        },
    },
};

/**
 * Отримати налаштування для пресету.
 * @param preset - назва пресету
 * @returns налаштування або undefined
 */
export function getPresetSettings(preset: GameModePreset): Partial<GameSettingsState> | undefined {
    return presetConfigurations[preset];
}