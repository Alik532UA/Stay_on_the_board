<script lang="ts">
    import SvgIcons from "$lib/components/SvgIcons.svelte";
    import type { MenuPosition } from "../FlexibleMenu.types";

    export let isOpen: boolean;
    export let position: MenuPosition;
    export let onToggle: () => void;

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

<button
    class="toggle-trigger position-{position}"
    on:click={onToggle}
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

<style>
    /* Copied and adapted styles from FlexibleMenu.svelte */
    :global(:root) {
        --menu-bg: rgba(30, 30, 30, 0.6);
    }

    .toggle-trigger {
        background: transparent;
        border: none;
        display: flex;
        justify-content: center;
        cursor: pointer;
        color: var(--text-secondary, #aaa);
        position: absolute;
        padding: 0;
        -webkit-tap-highlight-color: transparent;
        z-index: -1;

        /* FIX: Явно вмикаємо події миші для кнопки перемикання */
        pointer-events: auto;
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
    .toggle-trigger.position-bottom {
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
    .toggle-trigger.position-top {
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
    .toggle-trigger.position-left {
        width: 48px;
        height: 80px;
        right: 0;
        top: 8px;
        transform: translateX(100%);
        align-items: center;
        justify-content: flex-start;
    }
    .position-left .toggle-visual {
        width: 24px;
        height: 60px;
        border-radius: 0 16px 16px 0;
    }

    /* Right: Trigger on Left */
    .toggle-trigger.position-right {
        width: 48px;
        height: 80px;
        left: 0;
        top: 8px;
        transform: translateX(-100%);
        align-items: center;
        justify-content: flex-end;
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
</style>
