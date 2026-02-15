// src/lib/stores/debugLogState.svelte.ts
// SSoT для дебаг-логів. Svelte 5 Runes.

class DebugLogStateRune {
    private _state = $state<string[]>([]);

    get state() { return this._state; }

    add(message: string) {
        const newLogs = [...this._state, message];
        // Обмеження до 100 записів
        this._state = newLogs.length > 100 ? newLogs.slice(newLogs.length - 100) : newLogs;
    }

    clear() {
        this._state = [];
    }
}

export const debugLogState = new DebugLogStateRune();
