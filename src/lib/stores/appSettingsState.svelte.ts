// src/lib/stores/appSettingsState.svelte.ts
// SSoT для налаштувань додатку. Svelte 5 Runes.
// localStorage-персистенція залишається в bridge-шарі.

import type { AppSettings } from '$lib/schemas/appSettingsSchema';

export type AppSettingsState = AppSettings;

export const defaultAppSettings: AppSettingsState = {
    language: 'uk',
    theme: 'dark',
    style: 'gray',
};

class AppSettingsStateRune {
    private _state = $state<AppSettingsState>({ ...defaultAppSettings });

    get state() { return this._state; }
    set state(value: AppSettingsState) { this._state = value; }

    update(fn: (s: AppSettingsState) => AppSettingsState) {
        this._state = fn(this._state);
    }

    updateSettings(newSettings: Partial<AppSettingsState>) {
        this._state = { ...this._state, ...newSettings };
    }

    reset() {
        this._state = { ...defaultAppSettings };
    }
}

export const appSettingsState = new AppSettingsStateRune();
