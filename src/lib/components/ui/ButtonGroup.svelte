<script lang="ts">
    interface ButtonOption {
        value?: string | number;
        label: string;
        active?: boolean;
        dataTestId?: string;
        onClick?: () => void;
    }

    export let options: ButtonOption[] = [];
    export let className: string = "";
    // FIX: Додаємо проп для ID контейнера
    export let dataTestId: string = "";
</script>

<div class="button-group-container {className}" data-testid={dataTestId}>
    {#each options as option}
        <button
            type="button"
            class="group-btn"
            class:active={option.active}
            data-testid={option.dataTestId}
            on:click={option.onClick}
        >
            {option.label}
        </button>
    {/each}
</div>

<style>
    .button-group-container {
        display: flex;
        flex-wrap: wrap; /* Дозволяємо перенос (для швидкості x1..x2) */
        background: rgba(0, 0, 0, 0.2); /* Темний фон контейнера (як в лобі) */
        padding: 4px;
        border-radius: 12px; /* Загальне скруглення контейнера */
        gap: 4px; /* Відступ між кнопками */
        width: 100%;
        box-sizing: border-box;
    }

    .group-btn {
        flex: 1 0 auto; /* Кнопки розтягуються, але можуть переноситись */
        min-width: 40px; /* Мінімальна ширина для зручності */

        background: transparent; /* За замовчуванням прозорі */
        color: var(--text-secondary, #aaa);
        border: none;
        border-radius: 8px; /* Скруглення самих кнопок */

        padding: 8px 12px;
        font-size: 0.95em;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        text-align: center;
        line-height: 1.2;
    }

    .group-btn:hover {
        background: rgba(255, 255, 255, 0.05);
        color: var(--text-primary, #fff);
    }

    .group-btn.active {
        background: var(--control-selected, #4caf50); /* Активний колір */
        color: var(--control-selected-text, #fff);
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        font-weight: 700;
    }

    /* Адаптивність для дуже малих екранів */
    @media (max-width: 360px) {
        .group-btn {
            padding: 6px 8px;
            font-size: 0.9em;
        }
    }
</style>
