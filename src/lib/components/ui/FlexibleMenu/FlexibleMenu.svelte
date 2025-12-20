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
    export let startOpen: boolean = true;

    // State
    let isOpen = startOpen;
    let isMounted = false;

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
</script>

{#if withSpacer}
    <div
        class="menu-spacer"
        class:is-open={isOpen && position === "bottom"}
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
                    <SvgIcons
                        name={position === "bottom" ? "arrow-down" : "arrow-up"}
                    />
                </div>
            </div>
        </button>

        <div
            class="menu-grid"
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
        --menu-height: 80px;
        --menu-border-radius: 16px;
        --menu-z-index: 1000;
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
        align-items: center;
        pointer-events: none;
    }

    .flexible-menu-wrapper * {
        pointer-events: auto;
    }

    .flexible-menu-wrapper.position-bottom {
        bottom: 0;
        top: auto;
    }

    .flexible-menu-wrapper.position-bottom.is-closed {
        transform: translateY(100%);
    }

    .flexible-menu-wrapper.position-top {
        top: 0;
        bottom: auto;
    }

    .flexible-menu-wrapper.position-top.is-closed {
        transform: translateY(-100%);
    }

    /* Menu Panel */
    .menu-panel {
        background: var(--menu-bg);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);

        /* FIX: Змінюємо width: 100% на 95% для відступів */
        width: 95%;
        max-width: 600px;
        height: var(--menu-height);

        filter: var(--menu-drop-shadow);

        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0 4px;
        box-sizing: border-box;
        position: relative;

        /* FIX: Додаємо margin-bottom для відступу знизу, якщо це нижнє меню */
        margin-bottom: 10px;
    }

    .position-top .menu-panel {
        margin-bottom: 0;
        margin-top: 10px;
    }

    .position-bottom .menu-panel {
        border-top-left-radius: var(--menu-border-radius);
        border-top-right-radius: var(--menu-border-radius);
        /* FIX: Додаємо скруглення знизу, бо тепер панель "плаває" */
        border-bottom-left-radius: var(--menu-border-radius);
        border-bottom-right-radius: var(--menu-border-radius);
    }
    .position-top .menu-panel {
        border-bottom-left-radius: var(--menu-border-radius);
        border-bottom-right-radius: var(--menu-border-radius);
        /* FIX: Додаємо скруглення зверху */
        border-top-left-radius: var(--menu-border-radius);
        border-top-right-radius: var(--menu-border-radius);
    }

    .menu-grid {
        display: grid;
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

    .slot-2 {
        overflow: visible;
    }

    :global(.slot-2 .menu-button.primary) {
        width: 84px;
        height: 84px;
        border-radius: 50%;
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        bottom: auto;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
    }

    :global(.slot-2 .menu-button.primary:hover) {
        transform: translate(-50%, -50%) scale(1.05);
    }

    .toggle-trigger {
        background: transparent;
        border: none;
        width: 80px;
        height: 48px;
        display: flex;
        justify-content: center;
        cursor: pointer;
        color: var(--text-secondary, #aaa);
        position: absolute;
        right: 8px;
        padding: 0;
        -webkit-tap-highlight-color: transparent;
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
        width: 60px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        pointer-events: none;
    }

    .position-bottom .toggle-trigger {
        top: 0;
        transform: translateY(-100%);
        align-items: flex-end;
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
        align-items: flex-start;
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

    @media (min-width: 768px) {
        .menu-panel {
            width: auto;
            min-width: 400px;
            margin-bottom: 0;
        }

        .position-bottom .menu-panel {
            margin-bottom: 0;
            border-bottom-left-radius: 0;
            border-bottom-right-radius: 0;
        }
    }

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
