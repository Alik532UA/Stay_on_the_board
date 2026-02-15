// src/lib/stores/versionState.svelte.ts
// SSoT для версії додатку. Svelte 5 Runes.

class VersionStateRune {
    private _state = $state<string | null>(null);

    get state() { return this._state; }
    set state(value: string | null) { this._state = value; }
}

export const versionState = new VersionStateRune();
