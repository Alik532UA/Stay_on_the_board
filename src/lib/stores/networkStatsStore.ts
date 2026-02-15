// src/lib/stores/networkStatsStore.ts
// Bridge pattern: writable-обгортка для Svelte 4.
// SSoT — networkStatsState.svelte.ts (Runes).

import { writable } from 'svelte/store';
import { networkStatsState } from './networkStatsState.svelte';

export type { NetworkStats } from './networkStatsState.svelte';

let timerInterval: ReturnType<typeof setInterval> | null = null;

function createNetworkStatsStore() {
    const { subscribe, set: svelteSet } = writable(networkStatsState.state);

    const syncStore = () => { svelteSet(networkStatsState.state); };

    return {
        subscribe,
        reset: () => {
            networkStatsState.reset();
            syncStore();
        },
        startSession: () => {
            if (timerInterval) clearInterval(timerInterval);
            networkStatsState.state = {
                reads: 0, writes: 0, bytesReceived: 0, bytesSent: 0,
                lastActivity: null, recentEvents: [], elapsedSeconds: 0,
                isTracking: true
            };
            syncStore();

            timerInterval = setInterval(() => {
                networkStatsState.update(s => ({ ...s, elapsedSeconds: s.elapsedSeconds + 1 }));
                syncStore();
            }, 1000);
        },
        stopSession: () => {
            if (timerInterval) {
                clearInterval(timerInterval);
                timerInterval = null;
            }
            networkStatsState.update(s => ({ ...s, isTracking: false }));
            syncStore();
        },
        recordRead: (source: string, data: unknown) => {
            const size = estimateSize(data);
            networkStatsState.update(s => {
                const event = { type: 'read' as const, size, source, timestamp: Date.now() };
                return {
                    ...s,
                    reads: s.reads + 1,
                    bytesReceived: s.bytesReceived + size,
                    lastActivity: Date.now(),
                    recentEvents: [event, ...s.recentEvents].slice(0, 20)
                };
            });
            syncStore();
        },
        recordWrite: (source: string, data: unknown) => {
            const size = estimateSize(data);
            networkStatsState.update(s => {
                const event = { type: 'write' as const, size, source, timestamp: Date.now() };
                return {
                    ...s,
                    writes: s.writes + 1,
                    bytesSent: s.bytesSent + size,
                    lastActivity: Date.now(),
                    recentEvents: [event, ...s.recentEvents].slice(0, 20)
                };
            });
            syncStore();
        }
    };
}

function estimateSize(obj: unknown): number {
    try {
        return new TextEncoder().encode(JSON.stringify(obj)).length;
    } catch (e) {
        return 0;
    }
}

export const networkStatsStore = createNetworkStatsStore();
