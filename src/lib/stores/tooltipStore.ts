// src/lib/stores/tooltipStore.ts
// Bridge pattern: writable-обгортка для Svelte 4.
// SSoT — tooltipState.svelte.ts (Runes).

import { writable } from 'svelte/store';
import { logService } from '$lib/services/logService';
import { tooltipState, tooltipInitialState } from './tooltipState.svelte';

export type { HotkeyData, TooltipData, TooltipState } from './tooltipState.svelte';

const { subscribe, set: svelteSet } = writable(tooltipState.state);

const syncStore = () => { svelteSet(tooltipState.state); };

function cancelScheduledShow(): void {
    tooltipState.update(state => {
        if (state.timeoutId) {
            clearTimeout(state.timeoutId);
            logService.tooltip('[tooltipStore] Canceled scheduled show');
        }
        return { ...state, timeoutId: null, ownerNode: null };
    });
    syncStore();
}

export const tooltipStore = {
    subscribe,

    scheduleShow: (content: string | import('./tooltipState.svelte').TooltipData, x: number, y: number, delay: number, ownerNode: HTMLElement): void => {
        cancelScheduledShow();
        const timeoutId = setTimeout(() => {
            logService.tooltip('[tooltipStore] setTimeout callback. Checking owner node...', ownerNode);
            if (ownerNode && document.body.contains(ownerNode)) {
                logService.tooltip('[tooltipStore] Owner node is still in DOM. Showing tooltip.');
                tooltipState.update(state => ({ ...state, isVisible: true, content, x, y, timeoutId: null }));
            } else {
                logService.tooltip('[tooltipStore] Owner node is NOT in DOM. Aborting tooltip show.');
                tooltipState.update(state => ({ ...state, timeoutId: null, ownerNode: null }));
            }
            syncStore();
        }, delay);

        tooltipState.update(state => ({ ...state, timeoutId, content, x, y, ownerNode }));
        syncStore();
        logService.tooltip('[tooltipStore] show scheduled', { content, x, y, delay, ownerNode });
    },

    move: (x: number, y: number): void => {
        tooltipState.update(state => ({ ...state, x, y }));
        syncStore();
    },

    hide: (): void => {
        logService.tooltip('[tooltipStore] hide called');
        cancelScheduledShow();
        tooltipState.reset();
        syncStore();
    },

    hideIfOwner: (ownerNode: HTMLElement): void => {
        tooltipState.update(state => {
            if (state.isVisible && state.ownerNode === ownerNode) {
                logService.tooltip('[tooltipStore] hideIfOwner called for matching owner. Hiding.', ownerNode);
                return tooltipInitialState;
            }
            return state;
        });
        syncStore();
    },

    cancelForOwner: (ownerNode: HTMLElement): void => {
        tooltipState.update(state => {
            if (state.timeoutId && state.ownerNode === ownerNode) {
                logService.tooltip('[tooltipStore] cancelForOwner called for matching owner. Canceling.', ownerNode);
                clearTimeout(state.timeoutId);
                return tooltipInitialState;
            }
            return state;
        });
        syncStore();
    },
};
