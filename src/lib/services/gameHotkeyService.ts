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
        content: { key },
        buttons: actions.map(action => ({
            text: t(`gameControls.${action}`),
            primary: true,
            onClick: () => {
                logService.action(`[gameHotkeyService] User resolved conflict for '${key}'. Chose action: ${action}`);

                const settings = get(gameSettingsStore);
                const newKeybindings = { ...settings.keybindings };

                actions.forEach(conflictingAction => {
                    if (conflictingAction !== action) {
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
    // Змінено на hotkey
    logService.hotkey(`[gameHotkeyService] Registering game action handler: ${action}`);
    registeredGameActionHandlers[action] = handler;
}

export function initializeGameHotkeys() {
    logService.init('[gameHotkeyService] Initializing game hotkeys.');

    if (unsubscribeGameSettings) {
        unsubscribeGameSettings();
    }

    unsubscribeGameSettings = gameSettingsStore.subscribe(settings => {
        // Змінено на hotkey
        logService.hotkey('[gameHotkeyService] Game settings changed, re-registering all hotkeys.');
        hotkeyService.unregister('game');

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

        keyToActionMap.forEach((actions, key) => {
            const handler = registeredGameActionHandlers[actions[0]];
            if (!handler) return;

            if (actions.length === 1) {
                hotkeyService.register('game', key, handler);
            } else {
                const resolvedAction = settings.keyConflictResolution[key];
                if (resolvedAction && actions.includes(resolvedAction)) {
                    const resolvedHandler = registeredGameActionHandlers[resolvedAction];
                    if (resolvedHandler) {
                        // Змінено на hotkey
                        logService.hotkey(`[gameHotkeyService] Registering '${key}' to resolved action: ${resolvedAction}`);
                        hotkeyService.register('game', key, resolvedHandler);
                    }
                } else {
                    // Змінено на hotkey
                    logService.hotkey(`[gameHotkeyService] Registering '${key}' to conflict resolution modal for actions: ${actions.join(', ')}`);
                    hotkeyService.register('game', key, () => showKeyConflictModal(key, actions));
                }
            }
        });

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