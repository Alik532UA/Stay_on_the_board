import { describe, it, expect } from 'vitest';
import { syncGameModeLogic } from './settingsLogic';
import type { GameSettingsState } from '$lib/stores/gameSettingsStore';
import type { UiState } from '$lib/stores/uiStateStore';
import { defaultGameSettings } from '$lib/stores/gameSettingsDefaults';
import { initialUIState } from '$lib/stores/uiStateStore';

describe('settingsLogic', () => {
    const baseSettings: GameSettingsState = { ...defaultGameSettings };
    const baseUiState: UiState = { ...initialUIState };

    it('should not change mode if settings are locked', () => {
        const settings: GameSettingsState = { ...baseSettings, lockSettings: true, gameMode: 'local-experienced' };
        const uiState: UiState = { ...baseUiState, intendedGameType: 'virtual-player' }; // Context mismatch

        const result = syncGameModeLogic(settings, uiState);

        expect(result.gameMode).toBe('local-experienced');
    });

    it('should not change mode if current mode is timed', () => {
        const settings: GameSettingsState = { ...baseSettings, gameMode: 'virtual-player-timed' };
        const uiState: UiState = { ...baseUiState, intendedGameType: 'virtual-player' };

        const result = syncGameModeLogic(settings, uiState);

        expect(result.gameMode).toBe('virtual-player-timed');
    });

    describe('Local Game Context', () => {
        const localUiState: UiState = { ...baseUiState, intendedGameType: 'local' };

        it('should switch to local-observer if autoHideBoard is false', () => {
            const settings: GameSettingsState = { ...baseSettings, gameMode: 'local-pro', autoHideBoard: false };
            const result = syncGameModeLogic(settings, localUiState);
            expect(result.gameMode).toBe('local-observer');
        });

        it('should switch to local-experienced if autoHideBoard is true and blockMode is false', () => {
            const settings: GameSettingsState = { ...baseSettings, gameMode: 'local-observer', autoHideBoard: true, blockModeEnabled: false };
            const result = syncGameModeLogic(settings, localUiState);
            expect(result.gameMode).toBe('local-experienced');
        });

        it('should switch to local-pro if autoHideBoard is true and blockMode is true', () => {
            const settings: GameSettingsState = { ...baseSettings, gameMode: 'local-experienced', autoHideBoard: true, blockModeEnabled: true };
            const result = syncGameModeLogic(settings, localUiState);
            expect(result.gameMode).toBe('local-pro');
        });
    });

    describe('Virtual Player Context', () => {
        const vpUiState: UiState = { ...baseUiState, intendedGameType: 'virtual-player' };

        it('should switch to virtual-player-beginner if autoHideBoard is false', () => {
            const settings: GameSettingsState = { ...baseSettings, gameMode: 'virtual-player-pro', autoHideBoard: false };
            const result = syncGameModeLogic(settings, vpUiState);
            expect(result.gameMode).toBe('virtual-player-beginner');
        });

        it('should switch to virtual-player-experienced if autoHideBoard is true and blockMode is false', () => {
            const settings: GameSettingsState = { ...baseSettings, gameMode: 'virtual-player-beginner', autoHideBoard: true, blockModeEnabled: false };
            const result = syncGameModeLogic(settings, vpUiState);
            expect(result.gameMode).toBe('virtual-player-experienced');
        });

        it('should switch to virtual-player-pro if autoHideBoard is true and blockMode is true', () => {
            const settings: GameSettingsState = { ...baseSettings, gameMode: 'virtual-player-experienced', autoHideBoard: true, blockModeEnabled: true };
            const result = syncGameModeLogic(settings, vpUiState);
            expect(result.gameMode).toBe('virtual-player-pro');
        });
    });

    describe('Online Context', () => {
        const onlineUiState: UiState = { ...baseUiState, intendedGameType: 'online' };

        it('should switch to online-beginner if autoHideBoard is false', () => {
            const settings: GameSettingsState = { ...baseSettings, gameMode: 'online-pro', autoHideBoard: false };
            const result = syncGameModeLogic(settings, onlineUiState);
            expect(result.gameMode).toBe('online-beginner');
        });

        it('should switch to online-pro if autoHideBoard is true and blockMode is true', () => {
            const settings: GameSettingsState = { ...baseSettings, gameMode: 'online-beginner', autoHideBoard: true, blockModeEnabled: true };
            const result = syncGameModeLogic(settings, onlineUiState);
            expect(result.gameMode).toBe('online-pro');
        });
    });
});