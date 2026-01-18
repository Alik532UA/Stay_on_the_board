import { writable } from 'svelte/store';

export interface NetworkStats {
    reads: number;
    writes: number;
    bytesReceived: number; // Approximate
    bytesSent: number; // Approximate
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

let timerInterval: ReturnType<typeof setInterval> | null = null;

function createNetworkStatsStore() {
    const { subscribe, update, set } = writable<NetworkStats>(initialState);

    return {
        subscribe,
        reset: () => {
            update(s => ({
                ...initialState,
                isTracking: s.isTracking, // Keep tracking state
                elapsedSeconds: 0 // Reset time
            }));
        },
        startSession: () => {
            if (timerInterval) clearInterval(timerInterval);
            set({ ...initialState, isTracking: true });

            timerInterval = setInterval(() => {
                update(s => ({ ...s, elapsedSeconds: s.elapsedSeconds + 1 }));
            }, 1000);
        },
        stopSession: () => {
            if (timerInterval) {
                clearInterval(timerInterval);
                timerInterval = null;
            }
            update(s => ({ ...s, isTracking: false }));
        },
        recordRead: (source: string, data: any) => {
            const size = estimateSize(data);
            update(s => {
                const event = { type: 'read' as const, size, source, timestamp: Date.now() };
                return {
                    ...s,
                    reads: s.reads + 1,
                    bytesReceived: s.bytesReceived + size,
                    lastActivity: Date.now(),
                    recentEvents: [event, ...s.recentEvents].slice(0, 20)
                };
            });
        },
        recordWrite: (source: string, data: any) => {
            const size = estimateSize(data);
            update(s => {
                const event = { type: 'write' as const, size, source, timestamp: Date.now() };
                return {
                    ...s,
                    writes: s.writes + 1,
                    bytesSent: s.bytesSent + size,
                    lastActivity: Date.now(),
                    recentEvents: [event, ...s.recentEvents].slice(0, 20)
                };
            });
        }
    };
}

function estimateSize(obj: any): number {
    try {
        return new TextEncoder().encode(JSON.stringify(obj)).length;
    } catch (e) {
        return 0;
    }
}

export const networkStatsStore = createNetworkStatsStore();
