// src/lib/stores/layoutStore.ts
// Bridge pattern: writable-обгортка для Svelte 4.
// SSoT — layoutState.svelte.ts (Runes).

import { writable } from 'svelte/store';
import { logService } from '../services/logService';
import { layoutStateRune, defaultLayout } from './layoutState.svelte';
import type { Layout, LayoutColumn } from './layoutState.svelte';

// Re-export types та constants
export { WIDGETS, defaultLayout } from './layoutState.svelte';
export type { WidgetId, Layout, LayoutColumn } from './layoutState.svelte';

const isBrowser = typeof window !== 'undefined';

function loadLayout(): Layout {
    if (!isBrowser) return defaultLayout;
    try {
        const savedLayout = localStorage.getItem('gameLayout');
        if (savedLayout) {
            return JSON.parse(savedLayout);
        }
    } catch (e) {
        logService.init('Failed to load layout from localStorage', e);
    }
    return defaultLayout;
}

// Ініціалізація SSoT з localStorage
layoutStateRune.state = loadLayout();

function saveLayout(layout: Layout): void {
    if (isBrowser) {
        localStorage.setItem('gameLayout', JSON.stringify(layout));
    }
}

const { subscribe, set: svelteSet } = writable<Layout>(layoutStateRune.state);

const syncStore = () => { svelteSet(layoutStateRune.state); };

// Зберігаємо в localStorage при кожній зміні
const originalSubscribe = subscribe;

export const layoutStore = {
    subscribe: (fn: (v: Layout) => void) => {
        const unsub = originalSubscribe(fn);
        return unsub;
    },
    set: (value: Layout) => {
        layoutStateRune.state = value;
        saveLayout(value);
        syncStore();
    },
    update: (fn: (s: Layout) => Layout) => {
        layoutStateRune.update(fn);
        saveLayout(layoutStateRune.state);
        syncStore();
    },
    resetLayout: (): void => {
        layoutStateRune.reset();
        saveLayout(defaultLayout);
        syncStore();
    },
};
