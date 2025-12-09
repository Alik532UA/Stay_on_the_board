/**
 * @file Types for game settings.
 * @description Contains all type definitions for the gameSettingsStore.
 * Extracted to reduce file size and improve maintainability.
 */

// ============================================================================
// Keybindings
// ============================================================================

/**
 * Доступні дії для гарячих клавіш.
 */
export type KeybindingAction =
    | 'up' | 'down' | 'left' | 'right'
    | 'up-left' | 'up-right' | 'down-left' | 'down-right'
    | 'confirm' | 'no-moves'
    | 'toggle-block-mode' | 'toggle-board'
    | 'increase-board' | 'decrease-board'
    | 'toggle-speech'
    | 'distance-1' | 'distance-2' | 'distance-3' | 'distance-4'
    | 'distance-5' | 'distance-6' | 'distance-7' | 'distance-8'
    | 'auto-hide-board' | 'show-help' | 'main-menu';

// ============================================================================
// Game Mode Presets
// ============================================================================

/**
 * Пресети для режиму "Virtual Player" (гравець проти AI).
 */
export type VirtualPlayerPreset =
    | 'virtual-player-beginner'
    | 'virtual-player-experienced'
    | 'virtual-player-pro'
    | 'virtual-player-timed';

/**
 * Пресети для локальної гри (2+ гравців на одному пристрої).
 */
export type LocalPreset =
    | 'local-observer'
    | 'local-experienced'
    | 'local-pro';

/**
 * Пресети для онлайн-гри (майбутнє).
 */
export type OnlinePreset =
    | 'online-beginner'
    | 'online-experienced'
    | 'online-pro';

/**
 * Застарілі пресети для зворотної сумісності.
 * @deprecated Використовуйте контекстні пресети замість цих.
 */
export type LegacyPreset =
    | 'beginner'
    | 'experienced'
    | 'pro'
    | 'timed'
    | 'local'
    | 'online'
    | 'observer';

/**
 * Об'єднаний тип всіх пресетів режимів гри.
 */
export type GameModePreset = VirtualPlayerPreset | LocalPreset | OnlinePreset | LegacyPreset;

// ============================================================================
// Game Settings State
// ============================================================================

/**
 * Повний стан налаштувань гри.
 * Це є SSoT (Single Source of Truth) для всіх ігрових налаштувань.
 */
export interface GameSettingsState {
    // Візуальні налаштування дошки
    showMoves: boolean;
    showBoard: boolean;
    showPiece: boolean;
    autoHideBoard: boolean;
    showGameInfoWidget: 'hidden' | 'shown' | 'compact';

    // Розмір дошки
    boardSize: number;

    // Block Mode
    blockModeEnabled: boolean;
    blockOnVisitCount: number;

    // Звукові налаштування
    speechEnabled: boolean;
    selectedVoiceURI: string | null;
    speechRate: number;
    speechOrder: 'dir_dist' | 'dist_dir';
    shortSpeech: boolean;
    speechFor: { player: boolean; computer: boolean };
    speakModalTitles: boolean;

    // Режим гри
    gameMode: GameModePreset | null;
    rememberGameMode: boolean;
    showGameModeModal: boolean;
    showDifficultyWarningModal: boolean;
    lockSettings: boolean;

    // Гарячі клавіші
    keybindings: Record<KeybindingAction, string[]>;
    keyConflictResolution: Record<string, KeybindingAction>;
}
