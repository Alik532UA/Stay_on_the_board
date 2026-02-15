// src/lib/stores/notificationState.svelte.ts
// SSoT для нотифікацій. Svelte 5 Runes.
// Побічні ефекти (setTimeout) залишаються в bridge-шарі.

import type { Notification } from '$lib/types/notification';

class NotificationStateRune {
    private _state = $state<Notification[]>([]);

    get state() { return this._state; }
    set state(value: Notification[]) { this._state = value; }

    add(notification: Notification) {
        this._state = [...this._state, notification];
    }

    remove(id: string) {
        this._state = this._state.filter(item => item.id !== id);
    }

    clear() {
        this._state = [];
    }
}

export const notificationState = new NotificationStateRune();
