import { get } from 'svelte/store';
import { gameSettingsStore, type KeybindingAction } from '../stores/gameSettingsStore';
import hotkeyService from './hotkeyService';
import { logService } from './logService';

let unsubscribeGameSettings: (() => void) | null = null;
let registeredGameActionHandlers: Partial<Record<KeybindingAction, (event?: KeyboardEvent) => void>> = {};

export function registerGameAction(action: KeybindingAction, handler: (event?: KeyboardEvent) => void) {
    logService.action(`[gameHotkeyService] Registering game action: ${action}`);
    registeredGameActionHandlers[action] = handler;
    // If already initialized, re-register hotkeys immediately for this action
    if (unsubscribeGameSettings) {
        const settings = get(gameSettingsStore);
        const keys = settings.keybindings[action];
        if (keys && keys.length > 0) {
            keys.forEach(key => {
                hotkeyService.register('game', key, handler);
            });
        }
    }
}

export function initializeGameHotkeys() {
    logService.init('[gameHotkeyService] Initializing game hotkeys.');

    if (unsubscribeGameSettings) {
        unsubscribeGameSettings();
    }

    unsubscribeGameSettings = gameSettingsStore.subscribe(settings => {
        logService.action('[gameHotkeyService] Game settings changed, re-registering hotkeys.');
        // Unregister all game-specific hotkeys before re-registering
        hotkeyService.unregister('game');

        for (const action in settings.keybindings) {
            const keys = settings.keybindings[action as KeybindingAction];
            const handler = registeredGameActionHandlers[action as KeybindingAction];

            if (handler && keys && keys.length > 0) {
                keys.forEach(key => {
                    hotkeyService.register('game', key, handler);
                });
            }
        }
    });
}

export function cleanupGameHotkeys() {
    logService.init('[gameHotkeyService] Cleaning up game hotkeys.');
    if (unsubscribeGameSettings) {
        unsubscribeGameSettings();
        unsubscribeGameSettings = null;
    }
    hotkeyService.unregister('game');
}