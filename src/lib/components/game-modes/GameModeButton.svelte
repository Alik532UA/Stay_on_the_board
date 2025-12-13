<script lang="ts">
    import { createEventDispatcher } from "svelte";

    export let icon: string = ""; // Emoji or text icon
    export let text: string = "";
    export let dataTestId: string = "";

    const dispatch = createEventDispatcher();
</script>

<button
    class="menu-item"
    on:click={() => dispatch("click")}
    data-testid={dataTestId}
>
    <span class="menu-icon">{icon}</span>
    <span class="menu-text">{text}</span>
</button>

<style>
    .menu-item {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 16px 24px;
        background: rgba(255, 255, 255, 0.1);
        border: none;
        border-radius: 16px;
        color: #fff;
        cursor: pointer;
        text-align: left;
        transition:
            transform 0.2s,
            background 0.2s;
        font-size: 1.2rem;
        font-weight: 600;
        backdrop-filter: blur(4px);
        width: 100%;
    }

    .menu-item:hover {
        background: rgba(255, 255, 255, 0.2);
        transform: scale(1.02);
    }

    .menu-icon {
        font-size: 1.5rem;
        width: 32px;
        text-align: center;
        display: flex;
        align-items: center;
        justify-content: center;
    }
</style>
