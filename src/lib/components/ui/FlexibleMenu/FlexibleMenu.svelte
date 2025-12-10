<script lang="ts">
    import { onMount } from "svelte";
    import { fly } from "svelte/transition";
    import MenuButton from "./MenuButton.svelte";
    import SvgIcons from "$lib/components/SvgIcons.svelte";
    import type { IMenuItem, MenuPosition } from "./FlexibleMenu.types";

    // Props
    export let items: IMenuItem[] = [];
    export let position: MenuPosition = "bottom";
    export let persistenceKey: string = "";
    export let withSpacer: boolean = true;
    export let dataTestId: string = "flexible-menu-wrapper";

    // State
    let isOpen = true;
    let isMounted = false;

    // Computed
    // Ensure we exactly have 5 items, filling with dummies if needed,
    // or slicing if too many.
    // Ideally we want index 2 to be the primary one.
    $: displayItems = prepareItems(items);

    function prepareItems(rawItems: IMenuItem[]): IMenuItem[] {
        const result = [...rawItems];
        // If we have fewer than 5, fill? Or render what we have?
        // The requirement says "template for 5 buttons", "central button is round".
        // Assuming strictly 5 slots for the design to work perfectly.
        // We will just map strictly index 0..4.

        // For safe rendering, let's just use what we are given,
        // but the CSS grid will force 5 columns.
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
</script>

<!-- 
  Logic for showing/hiding:
  We use a container that is fixed/sticky?
  Usually bottom navigation is fixed.
  
  The user said "slide out".
  We will use CSS transforms for performance.
-->

{#if withSpacer}
    <div class="menu-spacer" class:is-open={isOpen} aria-hidden="true"></div>
{/if}

<div
    class="flexible-menu-wrapper position-{position} {isOpen
        ? 'is-open'
        : 'is-closed'}"
    aria-hidden={!isOpen}
    data-testid={dataTestId}
>
    <!-- Main Content Panel -->
    <div class="menu-panel" data-testid="{position}-menu-panel">
        <!-- Toggle Button ("Tongue") -->
        <!-- Position depends on main position relative to panel -->
        <button
            class="toggle-trigger position-{position}"
            on:click={toggle}
            aria-label={isOpen ? "Згорнути меню" : "Розгорнути меню"}
            title={isOpen ? "Згорнути" : "Розгорнути"}
            data-testid="{position}-menu-toggle-trigger"
        >
            <div class="toggle-visual">
                <div class="toggle-icon {isOpen ? 'open' : 'closed'}">
                    <!-- Arrow icon rotating based on state -->
                    <SvgIcons
                        name={position === "bottom" ? "arrow-down" : "arrow-up"}
                    />
                </div>
            </div>
        </button>

        <div class="menu-grid" data-testid="{position}-menu-grid">
            {#each [0, 1, 2, 3, 4] as i}
                <div
                    class="menu-slot slot-{i}"
                    data-testid="{position}-menu-slot-{i}"
                >
                    {#if displayItems[i]}
                        <!-- Force primary prop on index 2 if not explicitly set but it IS index 2 -->
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
        --menu-bg: rgba(30, 30, 30, 0.6); /* 60% opacity dark background */
        --menu-height: 80px;
        --menu-border-radius: 16px;
        --menu-z-index: 1000;
        /* Using filter: drop-shadow locally instead of box-shadow for unified shape */
        --menu-drop-shadow: drop-shadow(0 8px 32px rgba(0, 0, 0, 0.3));
    }

    .flexible-menu-wrapper {
        position: fixed;
        left: 0;
        right: 0;
        z-index: var(--menu-z-index);
        transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        display: flex;
        flex-direction: column;
        align-items: center; /* Center horizontally for desktop fit-content */
        pointer-events: none;
    }

    /* Make wrapper capture events only on its children */
    .flexible-menu-wrapper * {
        pointer-events: auto;
    }

    /* Position: Bottom */
    .flexible-menu-wrapper.position-bottom {
        bottom: 0;
        top: auto;
    }

    .flexible-menu-wrapper.position-bottom.is-closed {
        transform: translateY(100%); /* Slide down fully (toggle sticks out) */
    }

    /* Position: Top */
    .flexible-menu-wrapper.position-top {
        top: 0;
        bottom: auto;
        /* flex-direction: column-reverse;  Not needed if toggle is absolute inside */
    }

    .flexible-menu-wrapper.position-top.is-closed {
        transform: translateY(-100%);
    }

    /* Menu Panel */
    .menu-panel {
        background: var(--menu-bg);
        backdrop-filter: blur(12px); /* Glassmorphism blur */
        -webkit-backdrop-filter: blur(12px);
        width: 100%;
        max-width: 600px; /* Desktop constraint */
        height: var(--menu-height);

        /* Unified Shadow for Panel + Toggle */
        filter: var(--menu-drop-shadow);
        /* box-shadow removed to avoid double shadows */

        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0 4px; /* Reduced from 16px to 4px */
        box-sizing: border-box;
        position: relative; /* Context for absolute toggle */
    }

    /* Rounded corners depending on position */
    .position-bottom .menu-panel {
        border-top-left-radius: var(--menu-border-radius);
        border-top-right-radius: var(--menu-border-radius);
        border-bottom-left-radius: 0;
        border-bottom-right-radius: 0;
    }
    .position-top .menu-panel {
        border-bottom-left-radius: var(--menu-border-radius);
        border-bottom-right-radius: var(--menu-border-radius);
    }

    /* Grid */
    .menu-grid {
        display: grid;
        /* Widen the central column (index 2) for better balance */
        grid-template-columns: 1fr 1fr 1.3fr 1fr 1fr;
        width: 100%;
        height: 100%;
        position: relative;
    }

    .menu-slot {
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
    }

    /* Central Button Slot Layout */
    .slot-2 {
        overflow: visible;
    }

    /* Central FAB Styling */
    :global(.slot-2 .menu-button.primary) {
        width: 84px; /* Slightly smaller as requested */
        height: 84px;
        border-radius: 50%;

        /* Center vertically and horizontally relative to the slot */
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        bottom: auto; /* Reset bottom */

        /* Keep separate shadow for the floating button as it IS a separate floating layer */
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
    }

    :global(.slot-2 .menu-button.primary:hover) {
        /* Maintain centering while scaling */
        transform: translate(-50%, -50%) scale(1.05);
    }

    /* Toggle Button */
    .toggle-trigger {
        background: transparent; /* Hitbox is invisible */
        border: none;
        width: 80px; /* Wider hitbox */
        height: 48px; /* Taller hitbox */
        display: flex;
        justify-content: center;
        cursor: pointer;
        color: var(--text-secondary, #aaa);
        position: absolute;
        right: 8px; /* Adjust position */
        padding: 0;
        /* align-items is now position-dependent */
        -webkit-tap-highlight-color: transparent; /* Remove mobile tap highlight */
    }

    /* Remove focus outline and shadow for the invisible trigger */
    .toggle-trigger:focus,
    .toggle-trigger:active {
        outline: none;
        box-shadow: none;
    }

    .toggle-visual {
        background: var(--menu-bg);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        width: 60px;
        height: 24px; /* Visually smaller */
        display: flex;
        align-items: center;
        justify-content: center;
        pointer-events: none; /* Pass clicks through to the parent button */
    }

    .position-bottom .toggle-trigger {
        top: 0;
        transform: translateY(-100%);
        align-items: flex-end; /* Stick visual to the bottom of the hitbox */
    }
    .position-bottom .toggle-visual {
        border-top-left-radius: 16px;
        border-top-right-radius: 16px;
        border-bottom-left-radius: 0;
        border-bottom-right-radius: 0;
    }

    .position-top .toggle-trigger {
        bottom: 0;
        transform: translateY(100%);
        align-items: flex-start; /* Stick visual to the top of the hitbox */
    }

    .position-top .toggle-visual {
        border-bottom-left-radius: 16px;
        border-bottom-right-radius: 16px;
        border-top-left-radius: 0;
        border-top-right-radius: 0;
    }

    .toggle-icon {
        transition: transform 0.3s;
        width: 16px;
        height: 16px;
        /* Center the SVG perfectly */
        display: flex;
        align-items: center;
        justify-content: center;
    }

    /* 
       Unified rotation logic:
       When closed, rotate 180deg to indicate "expand".
       When open, default rotation (0deg) indicates "collapse".
       
       Bottom: Default (Open) = Arrow Down. Closed = Arrow Up (180deg).
       Top: Default (Open) = Arrow Up. Closed = Arrow Down (180deg).
    */
    .position-bottom .toggle-icon.closed {
        transform: rotate(180deg);
    }

    .position-top .toggle-icon.closed {
        transform: rotate(180deg);
    }

    /* Responsive */
    @media (min-width: 768px) {
        .menu-panel {
            width: auto; /* Fit content */
            min-width: 400px;
            /* Allow specific border radius rules to apply (remove !important) */
            /* border-radius: var(--menu-border-radius); */
            margin-bottom: 0;
        }

        .position-bottom .menu-panel {
            margin-bottom: 0;
            /* Ensure sharp corners on desktop too */
            border-bottom-left-radius: 0;
            border-bottom-right-radius: 0;
        }
    }

    /* Spacer for flow layout */
    .menu-spacer {
        width: 100%;
        height: 0;
        transition: height 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        flex-shrink: 0;
    }
    .menu-spacer.is-open {
        height: var(--menu-height);
    }
</style>
