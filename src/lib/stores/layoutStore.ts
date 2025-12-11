// src/lib/stores/layoutStore.ts
/**
 * @file Store для керування розташуванням віджетів.
 */

import { writable } from 'svelte/store';
import { logService } from '../services/logService';

const isBrowser = typeof window !== 'undefined';

export const WIDGETS = {
    BOARD_HIDDEN_INFO: 'board-hidden-info',
    TOP_ROW: 'game-board-top-row',
    SCORE_PANEL: 'score-panel',
    BOARD_WRAPPER: 'board-bg-wrapper',
    CONTROLS_PANEL: 'game-controls-panel',
    SETTINGS_EXPANDER: 'settings-expander',
    GAME_INFO: 'game-info-widget',
    PLAYER_TURN_INDICATOR: 'player-turn-indicator',
    TIMER: 'timer-widget',
    GAME_MODE: 'game-mode-widget',
} as const;

export type WidgetId = typeof WIDGETS[keyof typeof WIDGETS];

export interface LayoutColumn {
    id: string;
    widgets: WidgetId[];
}

export type Layout = LayoutColumn[];

const defaultLayout: Layout = [
    {
        id: 'column-1',
        widgets: [WIDGETS.TOP_ROW, WIDGETS.GAME_INFO, WIDGETS.PLAYER_TURN_INDICATOR, WIDGETS.BOARD_WRAPPER, WIDGETS.SCORE_PANEL],
    },
    {
        id: 'column-2',
        widgets: [WIDGETS.CONTROLS_PANEL],
    },
    {
        id: 'column-3',
        widgets: [WIDGETS.TIMER, WIDGETS.GAME_MODE, WIDGETS.SETTINGS_EXPANDER],
    },
];

function loadLayout(): Layout {
    if (!isBrowser) return defaultLayout;
    try {
        const savedLayout = localStorage.getItem('gameLayout');
        if (savedLayout) {
            return JSON.parse(savedLayout);
        }
    } catch (e) {
        logService.init('Failed to load layout from localStorage', e);
    }
    return defaultLayout;
}

const { subscribe, set, update } = writable<Layout>(loadLayout());

function saveLayout(layout: Layout): void {
    if (isBrowser) {
        localStorage.setItem('gameLayout', JSON.stringify(layout));
    }
}

subscribe(saveLayout);

export const layoutStore = {
    subscribe,
    set,
    update,
    resetLayout: (): void => {
        set(defaultLayout);
        saveLayout(defaultLayout);
    },
};
