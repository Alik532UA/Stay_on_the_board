<script lang="ts">
    import SvgIcons from "$lib/components/SvgIcons.svelte";
    import type { IMenuItem } from "./FlexibleMenu.types";

    // Explicitly typing the prop
    export let item: IMenuItem;
    export let dataTestId: string = "";

    console.log(item.id, item.isActive);
</script>

<button
    class="menu-button {item.isActive ? 'active' : ''} {item.primary
        ? 'primary'
        : ''}"
    on:click={item.onClick}
    aria-label={item.label || item.id}
    type="button"
    data-testid={dataTestId}
>
    <div class="icon-wrapper">
        {#if item.icon}
            <SvgIcons name={item.icon} />
        {:else if item.emoji}
            <span class="emoji">{item.emoji}</span>
        {/if}
    </div>
</button>

<style>
    .menu-button {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        background: transparent;
        border: none;
        cursor: pointer;
        padding: 0.5rem;
        color: var(--text-secondary, #888); /* Fallback color */
        transition: all 0.2s ease;
        width: 100%;
        height: 100%;
        min-height: 48px; /* Minimum touch target */
        position: relative;
    }

    .menu-button:hover {
        color: var(--text-primary, #fff);
    }

    .menu-button.active {
        color: var(--primary-color, #ffaa00);
    }

    .icon-wrapper {
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 32px; /* Good default for emoji */
    }

    /* Primary (Central) Button Styling - will be overridden/enhanced by parent if needed, 
       but basic "primary" style can be here */
    .menu-button.primary {
        /* The specific positioning and large circle shape will likely be handled 
           by the parent grid/layout to ensure it breaks out of the flow properly,
           but we can give it the visual style here */
        background: var(--control-bg, #444);
        color: var(--text-color, #fff);
        border-radius: 50%;
        width: 64px; /* Fixed size for the FAB */
        height: 64px;
        /* Box shadow for depth */
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
    }

    [data-testid="menu-button-play"].primary {
        background: #4CAF50; /* Green */
        color: white;
    }

    .menu-button.primary.active {
        background: var(--primary-color, #ffaa00);
        color: var(--black, #000);
    }

    .menu-button.primary:hover {
        transform: scale(1.05);
        box-shadow: 0 6px 12px rgba(0, 0, 0, 0.4);
    }

    .menu-button.primary .icon-wrapper {
        width: 48px;
        height: 48px;
        font-size: 48px;
    }

    .label {
        font-size: 0.75rem;
        margin-top: 4px;
    }
</style>
