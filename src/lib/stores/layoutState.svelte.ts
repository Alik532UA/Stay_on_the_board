// src/lib/stores/layoutState.svelte.ts
// SSoT для лейауту віджетів. Svelte 5 Runes.
// localStorage-персистенція залишається в bridge-шарі.


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

export const defaultLayout: Layout = [
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

class LayoutStateRune {
    private _state = $state<Layout>([...defaultLayout]);

    get state() { return this._state; }
    set state(value: Layout) { this._state = value; }

    update(fn: (s: Layout) => Layout) {
        this._state = fn(this._state);
    }

    reset() {
        this._state = [...defaultLayout];
    }
}

export const layoutStateRune = new LayoutStateRune();
