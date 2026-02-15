import { z } from 'zod';

export const KeybindingActionSchema = z.enum([
    'up', 'down', 'left', 'right',
    'up-left', 'up-right', 'down-left', 'down-right',
    'confirm', 'no-moves',
    'toggle-block-mode', 'toggle-board',
    'increase-board', 'decrease-board',
    'toggle-speech',
    'distance-1', 'distance-2', 'distance-3', 'distance-4',
    'distance-5', 'distance-6', 'distance-7', 'distance-8',
    'auto-hide-board', 'show-help', 'main-menu',
    'toggle-theme', 'toggle-language'
]);

export const GameModePresetSchema = z.enum([
    'virtual-player-beginner', 'virtual-player-experienced', 'virtual-player-pro', 'virtual-player-timed',
    'local-observer', 'local-experienced', 'local-pro',
    'online-beginner', 'online-experienced', 'online-pro',
    'beginner', 'experienced', 'pro', 'timed', 'local', 'online', 'observer'
]);

export const GameSettingsSchema = z.object({
    showMoves: z.boolean(),
    showBoard: z.boolean(),
    showPiece: z.boolean(),
    autoHideBoard: z.boolean(),
    showGameInfoWidget: z.enum(['hidden', 'shown', 'compact']),
    boardSize: z.number().min(2).max(20),
    blockModeEnabled: z.boolean(),
    blockOnVisitCount: z.number().min(1),
    speechEnabled: z.boolean(),
    selectedVoiceURI: z.string().nullable(),
    speechRate: z.number().min(0.1).max(10),
    speechOrder: z.enum(['dir_dist', 'dist_dir']),
    shortSpeech: z.boolean(),
    speechFor: z.object({
        player: z.boolean(),
        computer: z.boolean(),
        onlineMyMove: z.boolean(),
        onlineOpponentMove: z.boolean()
    }),
    speakModalTitles: z.boolean(),
    gameMode: GameModePresetSchema.nullable(),
    rememberGameMode: z.boolean(),
    showGameModeModal: z.boolean(),
    showDifficultyWarningModal: z.boolean(),
    lockSettings: z.boolean(),
    settingsLocked: z.boolean(),
    turnDuration: z.number().optional(),
    keybindings: z.record(KeybindingActionSchema, z.array(z.string())),
    keyConflictResolution: z.record(z.string(), KeybindingActionSchema)
});

export type GameSettings = z.infer<typeof GameSettingsSchema>;
