<script lang="ts">
    interface ButtonOption {
        value?: string | number;
        label: string;
        active?: boolean;
        dataTestId?: string;
        onClick?: () => void;
    }

    export let options: ButtonOption[] = [];

    export let variant: "row" | "square" = "row";

    export let className: string = "";
</script>

<div
    data-testid="widget-settings-expander"
    class="settings-expander__button-group {className}"
>
    {#each options as option}
        <button
            data-testid={option.dataTestId}
            class:active={option.active}
            class={variant === "square"
                ? "settings-expander__square-btn"
                : "settings-expander__row-btn"}
            on:click={option.onClick}
        >
            {option.label}
        </button>
    {/each}
</div>
