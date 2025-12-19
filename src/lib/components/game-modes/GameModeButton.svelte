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

        /* Стандартний backdrop-filter, як у інших елементах */
        backdrop-filter: blur(4px);
        -webkit-backdrop-filter: blur(4px);

        width: 100%;
        /* FIX: box-sizing залишаємо, це важливо для розмірів */
        box-sizing: border-box;
        max-width: 100%;
        min-height: 60px;
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
        flex-shrink: 0;
    }

    .menu-text {
        white-space: normal;
        word-break: break-word;
        line-height: 1.3;
    }

    @media (max-width: 360px) {
        .menu-item {
            padding: 12px 16px;
            gap: 12px;
            font-size: 1.1rem;
        }
        .menu-icon {
            width: 24px;
            font-size: 1.3rem;
        }
    }
</style>
