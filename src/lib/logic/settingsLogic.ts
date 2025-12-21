import type { GameSettingsState, GameModePreset } from '$lib/stores/gameSettingsTypes';
import type { UiState } from '$lib/stores/uiStateStore';

/**
 * Чиста функція для синхронізації режиму гри з контекстом UI.
 * Визначає, який пресет налаштувань має бути активним на основі поточного стану.
 * 
 * @param currentSettings - Поточні налаштування гри
 * @param uiState - Поточний стан інтерфейсу (для визначення контексту)
 * @returns Оновлені налаштування (або ті самі, якщо змін не потрібно)
 */
export function syncGameModeLogic(currentSettings: GameSettingsState, uiState: UiState): GameSettingsState {
    // Блокуємо синхронізацію для: lockSettings, timed пресетів, або базового local пресету
    if (currentSettings.lockSettings ||
        currentSettings.gameMode === 'timed' ||
        currentSettings.gameMode === 'local' ||
        currentSettings.gameMode?.includes('timed')) {
        return currentSettings;
    }

    // Визначаємо контекст гри
    const intendedGameType = uiState.intendedGameType;
    const isLocalGameContext = intendedGameType === 'local';
    const isVirtualPlayerContext = intendedGameType === 'virtual-player';
    const isOnlineContext = intendedGameType === 'online';

    // Блокуємо синхронізацію, якщо пресет не відповідає контексту
    if (currentSettings.gameMode) {
        const currentPrefix = currentSettings.gameMode.split('-')[0];
        const expectedPrefix = intendedGameType;
        // Перевіряємо тільки якщо префікс є одним з відомих типів
        if (currentPrefix !== expectedPrefix && ['local', 'virtual', 'online'].includes(currentPrefix)) {
            return currentSettings;
        }
    }

    let newMode: GameModePreset | null = null;

    if (isLocalGameContext) {
        // Local game presets
        if (!currentSettings.autoHideBoard) {
            newMode = 'local-observer';
        } else {
            newMode = currentSettings.blockModeEnabled ? 'local-pro' : 'local-experienced';
        }
    } else if (isVirtualPlayerContext) {
        // Virtual-player presets
        if (!currentSettings.autoHideBoard) {
            newMode = 'virtual-player-beginner';
        } else {
            newMode = currentSettings.blockModeEnabled ? 'virtual-player-pro' : 'virtual-player-experienced';
        }
    } else if (isOnlineContext) {
        // Online presets
        if (!currentSettings.autoHideBoard) {
            newMode = 'online-beginner';
        } else {
            newMode = currentSettings.blockModeEnabled ? 'online-pro' : 'online-experienced';
        }
    }

    // Якщо режим змінився, повертаємо оновлений стан
    if (newMode && currentSettings.gameMode !== newMode) {
        return {
            ...currentSettings,
            gameMode: newMode
        };
    }

    return currentSettings;
}