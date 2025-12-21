<script lang="ts">
    import { onMount } from "svelte";
    import MenuToggleTrigger from "./parts/MenuToggleTrigger.svelte";
    import FlexibleMenuPanel from "./parts/FlexibleMenuPanel.svelte";
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
    <FlexibleMenuPanel {isOpen} {isVertical} {position} {items}>
        <div slot="toggle">
            <MenuToggleTrigger {isOpen} {position} onToggle={toggle} />
        </div>
    </FlexibleMenuPanel>
</div>

<style>
    /* Styles for wrapper and spacer (layout related) */
    :global(:root) {
        --menu-z-index: 1000;
        --menu-height: 80px;
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

    .menu-spacer.position-left,
    .menu-spacer.position-right {
        height: 100%;
        width: 0;
    }
    .menu-spacer.position-left.is-open,
    .menu-spacer.position-right.is-open {
        width: var(--menu-height);
    }
</style>
