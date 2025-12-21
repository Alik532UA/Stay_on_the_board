<script lang="ts">
    import { _ } from "svelte-i18n";
    import { customTooltip } from "$lib/actions/customTooltip.js";

    export let keyName: string;
    export let isListening: boolean = false;
    export let hasConflict: boolean = false;

    function formatKeyCode(code: string) {
        if (!code) return "N/A";
        return code
            .replace(/^Key/, "")
            .replace(/^Digit/, "")
            .replace(/^Numpad/, "NumPad ")
            .replace("Decimal", ".")
            .replace("Multiply", "*")
            .replace("Divide", "/")
            .replace("Add", "+")
            .replace("Subtract", "-");
    }
</script>

<div class="key-button-wrapper">
    <button
        class="key-button"
        class:listening={isListening}
        class:conflict={hasConflict}
        on:click
    >
        {isListening ? $_("controlsPage.pressKey") : formatKeyCode(keyName)}
    </button>
    <button
        class="remove-key-btn"
        use:customTooltip={$_("controlsPage.removeKey")}
        on:click|stopPropagation={() => {
            /* Event handled by parent via custom event or direct loop */
        }}
        on:click>×</button
    >
</div>

<style>
    .key-button-wrapper {
        position: relative;
    }

    .key-button {
        min-width: 50px;
        text-align: center;
        padding: 0.5rem 1rem;
        border: var(--global-border-width) solid var(--border-color);
        background: var(--control-bg);
        color: var(--text-primary);
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.2s;
        font-family: monospace;
        font-size: 0.9em;
    }

    .key-button:hover {
        border-color: var(--control-selected);
        color: var(--control-selected);
    }

    .key-button.listening {
        background: var(--control-selected);
        color: var(--control-selected-text);
        font-style: italic;
    }

    .key-button.conflict {
        border-color: var(--error-color);
        box-shadow: 0 0 5px var(--error-color);
    }

    .remove-key-btn {
        position: absolute;
        top: -8px;
        right: -8px;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        border: none;
        background: var(--error-color);
        color: white;
        font-weight: bold;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        transition: opacity 0.2s;
        font-size: 14px;
        line-height: 1;
    }

    .key-button-wrapper:hover .remove-key-btn {
        opacity: 1;
    }
</style>
