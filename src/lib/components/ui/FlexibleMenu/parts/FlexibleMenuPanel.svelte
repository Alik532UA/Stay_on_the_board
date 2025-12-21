<script lang="ts">
    import MenuButton from "../MenuButton.svelte";
    import type { IMenuItem, MenuPosition } from "../FlexibleMenu.types";

    export let isOpen: boolean;
    export let isVertical: boolean;
    export let position: MenuPosition;
    export let items: IMenuItem[];

    $: displayItems = items.slice(0, 5);
</script>

<div class="menu-panel position-{position}" data-testid="{position}-menu-panel">
    <!-- Slot for the toggle button which needs to be positioned relative to this panel -->
    <slot name="toggle" />

    <div
        class="menu-grid {isVertical ? 'vertical' : 'horizontal'}"
        data-testid="{position}-menu-grid"
        aria-hidden={!isOpen}
    >
        {#each [0, 1, 2, 3, 4] as i}
            <div
                class="menu-slot slot-{i}"
                data-testid="{position}-menu-slot-{i}"
            >
                {#if displayItems[i]}
                    <MenuButton
                        item={{
                            ...displayItems[i],
                            primary:
                                displayItems[i].primary !== undefined
                                    ? displayItems[i].primary
                                    : i === 2,
                        }}
                        dataTestId={displayItems[i].dataTestId ||
                            `menu-button-${displayItems[i].id}`}
                    />
                {/if}
            </div>
        {/each}
    </div>
</div>

<style>
    /* Global vars should be defined in app.css or layout, but fallback here */
    :global(:root) {
        --menu-bg: rgba(30, 30, 30, 0.6);
        --menu-height: 80px;
        --menu-border-radius: 16px;
        --menu-drop-shadow: drop-shadow(0 8px 32px rgba(0, 0, 0, 0.3));
    }

    .menu-panel {
        background: var(--menu-bg);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        filter: var(--menu-drop-shadow);

        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0 4px;
        box-sizing: border-box;
        position: relative;

        /* FIX: Явно вмикаємо події миші для панелі, оскільки обгортка має pointer-events: none */
        pointer-events: auto;
    }

    /* Horizontal Panel Sizing */
    .menu-panel.position-top,
    .menu-panel.position-bottom {
        width: 95%;
        max-width: 600px;
        height: var(--menu-height);
    }

    /* Vertical Panel Sizing */
    .menu-panel.position-left,
    .menu-panel.position-right {
        width: var(--menu-height);
        height: 95%;
        max-height: 600px;
        flex-direction: column;
        padding: 4px 0;
    }

    /* --- Panel Margins & Border Radius --- */

    .menu-panel.position-bottom {
        margin-bottom: 10px;
        border-radius: var(--menu-border-radius);
    }
    .menu-panel.position-top {
        margin-top: 10px;
        border-radius: var(--menu-border-radius);
    }
    .menu-panel.position-left {
        margin-left: 10px;
        border-radius: var(--menu-border-radius);
    }
    .menu-panel.position-right {
        margin-right: 10px;
        border-radius: var(--menu-border-radius);
    }

    /* Desktop adjustments */
    @media (min-width: 768px) {
        .menu-panel.position-bottom {
            width: auto;
            min-width: 400px;
            margin-bottom: 0;
            border-bottom-left-radius: 0;
            border-bottom-right-radius: 0;
        }
        .menu-panel.position-top {
            width: auto;
            min-width: 400px;
            margin-top: 0;
            border-top-left-radius: 0;
            border-top-right-radius: 0;
        }
    }

    /* --- Grid Layouts --- */
    .menu-grid {
        display: grid;
        width: 100%;
        height: 100%;
        position: relative;
    }
    .menu-grid.horizontal {
        grid-template-columns: 1fr 1fr 1.3fr 1fr 1fr;
    }
    .menu-grid.vertical {
        grid-template-rows: 1fr 1fr 1.3fr 1fr 1fr;
        grid-template-columns: 1fr;
    }

    /* --- Slots --- */
    .menu-slot {
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
    }
    .slot-2 {
        overflow: visible;
    }

    /* Primary Button (Center) */
    :global(.slot-2 .menu-button.primary) {
        width: 84px;
        height: 84px;
        border-radius: 50%;
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
    }
    :global(.slot-2 .menu-button.primary:hover) {
        transform: translate(-50%, -50%) scale(1.05);
    }
</style>
