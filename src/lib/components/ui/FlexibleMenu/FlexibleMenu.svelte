<script lang="ts">
    import { onMount } from "svelte";
    import MenuButton from "./MenuButton.svelte";
    import SvgIcons from "$lib/components/SvgIcons.svelte";
    import type { IMenuItem, MenuPosition } from "./FlexibleMenu.types";

    // Props
    export let items: IMenuItem[] = [];
    export let position: MenuPosition = "bottom";
    export let persistenceKey: string = "";
    export let withSpacer: boolean = true;
    export let dataTestId: string = "flexible-menu-wrapper";
    export let startOpen: boolean = true;

    // State
    let isOpen = startOpen;
    let isMounted = false;

    // Determine orientation based on position
    $: isVertical = position === "left" || position === "right";
    $: displayItems = prepareItems(items);

    function prepareItems(rawItems: IMenuItem[]): IMenuItem[] {
        const result = [...rawItems];
        return result.slice(0, 5);
    }

    onMount(() => {
        if (persistenceKey) {
            const savedState = localStorage.getItem(
                `flexibleMenu:${persistenceKey}`,
            );
            if (savedState !== null) {
                isOpen = savedState === "true";
            }
        }
        isMounted = true;
    });

    function toggle() {
        isOpen = !isOpen;
        if (persistenceKey) {
            localStorage.setItem(
                `flexibleMenu:${persistenceKey}`,
                String(isOpen),
            );
        }
    }

    // Helper to determine arrow icon name based on position and state
    function getArrowIconName(pos: MenuPosition): string {
        switch (pos) {
            case "top":
                return "arrow-up";
            case "bottom":
                return "arrow-down";
            case "left":
                return "arrow-up"; // Will be rotated
            case "right":
                return "arrow-up"; // Will be rotated
            default:
                return "arrow-down";
        }
    }
</script>

{#if withSpacer}
    <div
        class="menu-spacer position-{position}"
        class:is-open={isOpen}
        aria-hidden="true"
    ></div>
{/if}

<div
    class="flexible-menu-wrapper position-{position} {isOpen
        ? 'is-open'
        : 'is-closed'}"
    data-testid={dataTestId}
>
    <!-- Main Content Panel -->
    <div class="menu-panel" data-testid="{position}-menu-panel">
        <button
            class="toggle-trigger position-{position}"
            on:click={toggle}
            aria-label={isOpen ? "Згорнути меню" : "Розгорнути меню"}
            title={isOpen ? "Згорнути" : "Розгорнути"}
            data-testid="{position}-menu-toggle-trigger"
        >
            <div class="toggle-visual">
                <div class="toggle-icon {isOpen ? 'open' : 'closed'}">
                    <SvgIcons name={getArrowIconName(position)} />
                </div>
            </div>
        </button>

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
</div>

<style>
    :global(:root) {
        --menu-bg: rgba(30, 30, 30, 0.6);
        --menu-height: 80px; /* Width for vertical menus */
        --menu-border-radius: 16px;
        --menu-z-index: 1000;
        --menu-drop-shadow: drop-shadow(0 8px 32px rgba(0, 0, 0, 0.3));
    }

    .flexible-menu-wrapper {
        position: fixed;
        z-index: var(--menu-z-index);
        transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        display: flex;
        pointer-events: none;
    }

    .flexible-menu-wrapper * {
        pointer-events: auto;
    }

    /* --- Positioning Logic --- */

    /* Bottom */
    .flexible-menu-wrapper.position-bottom {
        bottom: 0;
        left: 0;
        right: 0;
        flex-direction: column;
        align-items: center;
    }
    .flexible-menu-wrapper.position-bottom.is-closed {
        transform: translateY(100%);
    }

    /* Top */
    .flexible-menu-wrapper.position-top {
        top: 0;
        left: 0;
        right: 0;
        flex-direction: column;
        align-items: center;
    }
    .flexible-menu-wrapper.position-top.is-closed {
        transform: translateY(-100%);
    }

    /* Left */
    .flexible-menu-wrapper.position-left {
        left: 0;
        top: 0;
        bottom: 0;
        flex-direction: row;
        align-items: center; /* Center vertically */
    }
    .flexible-menu-wrapper.position-left.is-closed {
        transform: translateX(-100%);
    }

    /* Right */
    .flexible-menu-wrapper.position-right {
        right: 0;
        top: 0;
        bottom: 0;
        flex-direction: row-reverse; /* Handle inside */
        align-items: center; /* Center vertically */
    }
    .flexible-menu-wrapper.position-right.is-closed {
        transform: translateX(100%);
    }

    /* --- Menu Panel --- */
    .menu-panel {
        background: var(--menu-bg);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        filter: var(--menu-drop-shadow);

        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0 4px; /* Default for horizontal */
        box-sizing: border-box;
        position: relative;
    }

    /* Horizontal Panel Sizing */
    .position-top .menu-panel,
    .position-bottom .menu-panel {
        width: 95%;
        max-width: 600px;
        height: var(--menu-height);
    }

    /* Vertical Panel Sizing */
    .position-left .menu-panel,
    .position-right .menu-panel {
        width: var(--menu-height);
        height: 95%; /* Like width: 95% for horizontal */
        max-height: 600px;
        flex-direction: column;
        padding: 4px 0; /* Vertical padding */
    }

    /* --- Panel Margins & Border Radius --- */

    /* Bottom specific */
    .position-bottom .menu-panel {
        margin-bottom: 10px;
        border-radius: var(--menu-border-radius);
    }
    /* Top specific */
    .position-top .menu-panel {
        margin-top: 10px;
        border-radius: var(--menu-border-radius);
    }
    /* Left specific */
    .position-left .menu-panel {
        margin-left: 10px;
        border-radius: var(--menu-border-radius);
    }
    /* Right specific */
    .position-right .menu-panel {
        margin-right: 10px;
        border-radius: var(--menu-border-radius);
    }

    /* Desktop adjustments for horizontal menus (docked look) */
    @media (min-width: 768px) {
        .position-bottom .menu-panel {
            width: auto;
            min-width: 400px;
            margin-bottom: 0;
            border-bottom-left-radius: 0;
            border-bottom-right-radius: 0;
        }
        .position-top .menu-panel {
            width: auto;
            min-width: 400px;
            margin-top: 0;
            border-top-left-radius: 0;
            border-top-right-radius: 0;
        }
        /* Vertical menus can stay floating or dock too? Let's keep them floating for now as user didn't specify strict docking for side menus */
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

    /* --- Toggle Trigger --- */
    .toggle-trigger {
        background: transparent;
        border: none;
        display: flex;
        justify-content: center; /* Centers visual horizontally (or vertically if flex-col) */
        cursor: pointer;
        color: var(--text-secondary, #aaa);
        position: absolute;
        padding: 0;
        -webkit-tap-highlight-color: transparent;
        z-index: -1; /* Behind panel? No, needs to be clickable. */
    }
    .toggle-trigger:focus,
    .toggle-trigger:active {
        outline: none;
        box-shadow: none;
    }

    .toggle-visual {
        background: var(--menu-bg);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        display: flex;
        align-items: center;
        justify-content: center;
        pointer-events: none;
    }

    /* Position-Specific Toggle Styles */

    /* Bottom: Trigger on Top */
    .position-bottom .toggle-trigger {
        width: 80px;
        height: 48px;
        top: 0;
        right: 8px;
        transform: translateY(-100%);
        align-items: flex-end;
    }
    .position-bottom .toggle-visual {
        width: 60px;
        height: 24px;
        border-radius: 16px 16px 0 0;
    }

    /* Top: Trigger on Bottom */
    .position-top .toggle-trigger {
        width: 80px;
        height: 48px;
        bottom: 0;
        right: 8px;
        transform: translateY(100%);
        align-items: flex-start;
    }
    .position-top .toggle-visual {
        width: 60px;
        height: 24px;
        border-radius: 0 0 16px 16px;
    }

    /* Left: Trigger on Right */
    .position-left .toggle-trigger {
        width: 48px;
        height: 80px;
        right: 0;
        top: 8px; /* Offset from top */
        transform: translateX(100%);
        align-items: center; /* Center vertically */
        justify-content: flex-start; /* Align left (towards menu) */
    }
    .position-left .toggle-visual {
        width: 24px;
        height: 60px;
        border-radius: 0 16px 16px 0;
    }

    /* Right: Trigger on Left */
    .position-right .toggle-trigger {
        width: 48px;
        height: 80px;
        left: 0;
        top: 8px;
        transform: translateX(-100%);
        align-items: center;
        justify-content: flex-end; /* Align right (towards menu) */
    }
    .position-right .toggle-visual {
        width: 24px;
        height: 60px;
        border-radius: 16px 0 0 16px;
    }

    /* --- Toggle Icon Rotation --- */
    .toggle-icon {
        transition: transform 0.3s;
        width: 16px;
        height: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    /* Icon Rotation Logic */
    /* 
       State | Pos    | Icon (Base) | Visual Goal | Rotation Needed
       ------|--------|-------------|-------------|----------------
       Open  | Bottom | Down        | Down        | 0
       Close | Bottom | Down        | Up          | 180
       Open  | Top    | Up          | Up          | 0
       Close | Top    | Up          | Down        | 180
       
       Left uses 'arrow-up' (pointing up).
       Open  | Left   | Up          | Left (<)    | -90
       Close | Left   | Up          | Right (>)   | 90
       
       Right uses 'arrow-up'.
       Open  | Right  | Up          | Right (>)   | 90
       Close | Right  | Up          | Left (<)    | -90
    */

    .position-bottom .toggle-icon.closed {
        transform: rotate(180deg);
    }
    .position-top .toggle-icon.closed {
        transform: rotate(180deg);
    }

    .position-left .toggle-icon.open {
        transform: rotate(-90deg);
    }
    .position-left .toggle-icon.closed {
        transform: rotate(90deg);
    }

    .position-right .toggle-icon.open {
        transform: rotate(90deg);
    }
    .position-right .toggle-icon.closed {
        transform: rotate(-90deg);
    }

    /* --- Spacer Logic --- */
    .menu-spacer {
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        flex-shrink: 0;
    }

    .menu-spacer.position-bottom,
    .menu-spacer.position-top {
        width: 100%;
        height: 0;
    }
    .menu-spacer.position-bottom.is-open,
    .menu-spacer.position-top.is-open {
        height: var(--menu-height);
    }

    /* For side menus, spacer might need to be width-based if consumer wants layout shift */
    .menu-spacer.position-left,
    .menu-spacer.position-right {
        height: 100%;
        width: 0;
    }
    /* Note: Usually side menus overlay or push body. Here we just offer validation for simple flow. */
    .menu-spacer.position-left.is-open,
    .menu-spacer.position-right.is-open {
        width: var(--menu-height);
    }
</style>
