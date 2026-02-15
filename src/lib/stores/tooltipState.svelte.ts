// src/lib/stores/tooltipState.svelte.ts
// SSoT для тултіпів. Svelte 5 Runes.
// Побічні ефекти (setTimeout, DOM) залишаються в bridge-шарі.

export interface HotkeyData {
    text: string;
    singleChar: boolean;
}

export interface TooltipData {
    title?: string;
    hotkeys: HotkeyData[];
}

export interface TooltipState {
    isVisible: boolean;
    content: string | TooltipData;
    x: number;
    y: number;
    timeoutId: ReturnType<typeof setTimeout> | null;
    ownerNode: HTMLElement | null;
}

const initialState: TooltipState = {
    isVisible: false,
    content: '',
    x: 0,
    y: 0,
    timeoutId: null,
    ownerNode: null,
};

class TooltipStateRune {
    private _state = $state<TooltipState>({ ...initialState });

    get state() { return this._state; }
    set state(value: TooltipState) { this._state = value; }

    update(fn: (s: TooltipState) => TooltipState) {
        this._state = fn(this._state);
    }

    reset() {
        this._state = { ...initialState };
    }
}

export const tooltipState = new TooltipStateRune();
export { initialState as tooltipInitialState };
