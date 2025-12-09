// src/lib/stores/tooltipStore.ts
/**
 * @file Store для керування тултіпами.
 */

import { writable } from 'svelte/store';
import { logService } from '$lib/services/logService';

export interface TooltipState {
    isVisible: boolean;
    content: string;
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

const { subscribe, update, set } = writable<TooltipState>(initialState);

function cancelScheduledShow(): void {
    update(state => {
        if (state.timeoutId) {
            clearTimeout(state.timeoutId);
            logService.tooltip('[tooltipStore] Canceled scheduled show');
        }
        return { ...state, timeoutId: null, ownerNode: null };
    });
}

export const tooltipStore = {
    subscribe,

    scheduleShow: (content: string, x: number, y: number, delay: number, ownerNode: HTMLElement): void => {
        cancelScheduledShow();
        const timeoutId = setTimeout(() => {
            logService.tooltip('[tooltipStore] setTimeout callback. Checking owner node...', ownerNode);
            if (ownerNode && document.body.contains(ownerNode)) {
                logService.tooltip('[tooltipStore] Owner node is still in DOM. Showing tooltip.');
                update(state => ({ ...state, isVisible: true, content, x, y, timeoutId: null }));
            } else {
                logService.tooltip('[tooltipStore] Owner node is NOT in DOM. Aborting tooltip show.');
                update(state => ({ ...state, timeoutId: null, ownerNode: null }));
            }
        }, delay);

        update(state => ({ ...state, timeoutId, content, x, y, ownerNode }));
        logService.tooltip('[tooltipStore] show scheduled', { content, x, y, delay, ownerNode });
    },

    move: (x: number, y: number): void => {
        update(state => ({ ...state, x, y }));
    },

    hide: (): void => {
        logService.tooltip('[tooltipStore] hide called');
        cancelScheduledShow();
        set(initialState);
    },

    hideIfOwner: (ownerNode: HTMLElement): void => {
        update(state => {
            if (state.isVisible && state.ownerNode === ownerNode) {
                logService.tooltip('[tooltipStore] hideIfOwner called for matching owner. Hiding.', ownerNode);
                return initialState;
            }
            return state;
        });
    },

    cancelForOwner: (ownerNode: HTMLElement): void => {
        update(state => {
            if (state.timeoutId && state.ownerNode === ownerNode) {
                logService.tooltip('[tooltipStore] cancelForOwner called for matching owner. Canceling.', ownerNode);
                clearTimeout(state.timeoutId);
                return initialState;
            }
            return state;
        });
    },
};
