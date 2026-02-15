// src/lib/stores/networkStatsState.svelte.ts
// SSoT для мережевої статистики. Svelte 5 Runes.
// Таймер (setInterval) залишається в bridge-шарі.

export interface NetworkStats {
    reads: number;
    writes: number;
    bytesReceived: number;
    bytesSent: number;
    lastActivity: number | null;
    recentEvents: Array<{ type: 'read' | 'write', size: number, source: string, timestamp: number }>;
    elapsedSeconds: number;
    isTracking: boolean;
}

const initialState: NetworkStats = {
    reads: 0,
    writes: 0,
    bytesReceived: 0,
    bytesSent: 0,
    lastActivity: null,
    recentEvents: [],
    elapsedSeconds: 0,
    isTracking: false
};

class NetworkStatsStateRune {
    private _state = $state<NetworkStats>({ ...initialState });

    get state() { return this._state; }
    set state(value: NetworkStats) { this._state = value; }

    update(fn: (s: NetworkStats) => NetworkStats) {
        this._state = fn(this._state);
    }

    reset() {
        this._state = {
            ...initialState,
            isTracking: this._state.isTracking,
            elapsedSeconds: 0
        };
    }
}

export const networkStatsState = new NetworkStatsStateRune();
