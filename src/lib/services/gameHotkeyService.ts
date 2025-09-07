import { get } from 'svelte/store';
import { gameSettingsStore, type KeybindingAction } from '../stores/gameSettingsStore';
import hotkeyService from './hotkeyService';
import { logService } from './logService';
import { showArrowKeyHintModal } from './arrowKeyHintService';
import { modalStore } from '../stores/modalStore';
import { _ } from 'svelte-i18n';

let unsubscribeGameSettings: (() => void) | null = null;
let registeredGameActionHandlers: Partial<Record<KeybindingAction, (event?: KeyboardEvent) => void>> = {};

function showKeyConflictModal(key: string, actions: KeybindingAction[]) {
    logService.action(`[gameHotkeyService] Key '${key}' has a conflict. Showing resolution modal for actions:`, actions);
    
    const t = get(_);

    modalStore.showModal({
        titleKey: 'modal.keyConflictTitle',
        contentKey: 'modal.keyConflictContent',
        contentPayload: { key },
        buttons: actions.map(action => ({
            text: t(`gameControls.${action}`), // Dynamically get button text from translations
            primary: true,
            onClick: () => {
                logService.action(`[gameHotkeyService] User resolved conflict for '${key}'. Chose action: ${action}`);
                
                const settings = get(gameSettingsStore);
                const newKeybindings = { ...settings.keybindings };

                // Go through all actions that were in conflict for this key
                actions.forEach(conflictingAction => {
                    if (conflictingAction !== action) {
                        // If it's not the chosen action, remove the key from it
                        const keys = newKeybindings[conflictingAction];
                        if (keys) {
                            newKeybindings[conflictingAction] = keys.filter(k => k !== key);
                        }
                    }
                });

                gameSettingsStore.updateSettings({
                    keybindings: newKeybindings,
                    keyConflictResolution: { ...settings.keyConflictResolution, [key]: action }
                });

                modalStore.closeModal();
            }
        })),
        dataTestId: 'key-conflict-modal'
    });
}

export function registerGameAction(action: KeybindingAction, handler: (event?: KeyboardEvent) => void) {
    logService.action(`[gameHotkeyService] Registering game action handler: ${action}`);
    registeredGameActionHandlers[action] = handler;
    // Hotkeys are now only registered in the central subscribe callback, so no need to do anything else here.
}

export function initializeGameHotkeys() {
    logService.init('[gameHotkeyService] Initializing game hotkeys.');

    if (unsubscribeGameSettings) {
        unsubscribeGameSettings();
    }

    unsubscribeGameSettings = gameSettingsStore.subscribe(settings => {
        logService.action('[gameHotkeyService] Game settings changed, re-registering all hotkeys.');
        hotkeyService.unregister('game');

        // 1. Create a reverse map from key to a list of actions
        const keyToActionMap = new Map<string, KeybindingAction[]>();
        for (const action in settings.keybindings) {
            const keys = settings.keybindings[action as KeybindingAction];
            if (keys) {
                keys.forEach(key => {
                    if (!keyToActionMap.has(key)) {
                        keyToActionMap.set(key, []);
                    }
                    keyToActionMap.get(key)!.push(action as KeybindingAction);
                });
            }
        }

        // 2. Iterate through the map and register hotkeys
        keyToActionMap.forEach((actions, key) => {
            const handler = registeredGameActionHandlers[actions[0]];
            if (!handler) return;

            if (actions.length === 1) {
                // No conflict, register directly
                hotkeyService.register('game', key, handler);
            } else {
                // Conflict detected!
                const resolvedAction = settings.keyConflictResolution[key];
                if (resolvedAction && actions.includes(resolvedAction)) {
                    // Conflict was previously resolved
                    const resolvedHandler = registeredGameActionHandlers[resolvedAction];
                    if (resolvedHandler) {
                        logService.action(`[gameHotkeyService] Registering '${key}' to resolved action: ${resolvedAction}`);
                        hotkeyService.register('game', key, resolvedHandler);
                    }
                } else {
                    // Conflict is new, register to show modal
                    logService.action(`[gameHotkeyService] Registering '${key}' to conflict resolution modal for actions: ${actions.join(', ')}`);
                    hotkeyService.register('game', key, () => showKeyConflictModal(key, actions));
                }
            }
        });

        // Register arrow key hints separately as they don't have a standard action
        hotkeyService.register('game', 'ArrowUp', showArrowKeyHintModal);
        hotkeyService.register('game', 'ArrowDown', showArrowKeyHintModal);
        hotkeyService.register('game', 'ArrowLeft', showArrowKeyHintModal);
        hotkeyService.register('game', 'ArrowRight', showArrowKeyHintModal);
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