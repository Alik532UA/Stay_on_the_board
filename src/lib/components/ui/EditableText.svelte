<script lang="ts">
    import { createEventDispatcher, tick } from "svelte";
    import { customTooltip } from "$lib/actions/customTooltip";

    export let value: string;
    export let placeholder: string = "";
    export let canEdit: boolean = true;
    export let onRandom: () => string; // Функція для генерації випадкового значення
    export let minLength: number = 1;
    export let maxLength: number = 20;
    export let dataTestId: string = "";

    const dispatch = createEventDispatcher();

    let isEditing = false;
    let tempValue = value;
    let inputRef: HTMLInputElement;

    async function startEditing() {
        if (!canEdit) return;
        tempValue = value;
        isEditing = true;
        await tick();
        inputRef?.focus();
    }

    function save() {
        if (tempValue.trim().length < minLength) return;
        value = tempValue.trim();
        isEditing = false;
        dispatch("change", value);
    }

    function cancel() {
        isEditing = false;
        tempValue = value;
    }

    function handleRandom() {
        if (!canEdit) return;
        const randomValue = onRandom();
        value = randomValue;
        dispatch("change", value);
    }

    function handleKeydown(e: KeyboardEvent) {
        if (e.key === "Enter") save();
        if (e.key === "Escape") cancel();
    }
</script>

<div class="editable-text-container" data-testid={dataTestId}>
    {#if isEditing}
        <div class="edit-mode">
            <input
                bind:this={inputRef}
                type="text"
                bind:value={tempValue}
                {placeholder}
                maxlength={maxLength}
                on:keydown={handleKeydown}
                on:blur={save}
                class="editable-input"
            />
            <button
                class="icon-btn save"
                on:mousedown|preventDefault={save}
                title="Зберегти"
            >
                ✓
            </button>
            <button
                class="icon-btn cancel"
                on:mousedown|preventDefault={cancel}
                title="Скасувати"
            >
                ✕
            </button>
        </div>
    {:else}
        <div class="view-mode">
            <span class="text-value" title={value}>{value}</span>
            {#if canEdit}
                <div class="actions">
                    <button
                        class="icon-btn edit"
                        on:click={startEditing}
                        use:customTooltip={"Редагувати"}
                        data-testid="{dataTestId}-edit-btn"
                    >
                        ✏️
                    </button>
                    <button
                        class="icon-btn random"
                        on:click={handleRandom}
                        use:customTooltip={"Випадкове ім'я"}
                        data-testid="{dataTestId}-random-btn"
                    >
                        🎲
                    </button>
                </div>
            {/if}
        </div>
    {/if}
</div>

<style>
    .editable-text-container {
        display: inline-block;
        min-width: 150px;
        max-width: 100%;
    }

    .view-mode {
        display: flex;
        align-items: center;
        gap: 8px;
        justify-content: center;
    }

    .text-value {
        font-weight: bold;
        font-size: 1.1em;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 200px;
    }

    .actions {
        display: flex;
        gap: 4px;
        opacity: 0.6;
        transition: opacity 0.2s;
    }

    .view-mode:hover .actions {
        opacity: 1;
    }

    .edit-mode {
        display: flex;
        align-items: center;
        gap: 4px;
    }

    .editable-input {
        background: rgba(0, 0, 0, 0.2);
        border: 1px solid var(--border-color);
        border-radius: 4px;
        padding: 4px 8px;
        color: var(--text-primary);
        font-weight: bold;
        font-size: 1em;
        width: 100%;
        min-width: 120px;
    }

    .editable-input:focus {
        outline: none;
        border-color: var(--text-accent);
    }

    .icon-btn {
        background: none;
        border: none;
        cursor: pointer;
        font-size: 1.1em;
        padding: 4px;
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition:
            background 0.2s,
            transform 0.1s;
        color: var(--text-primary);
    }

    .icon-btn:hover {
        background: rgba(255, 255, 255, 0.1);
        transform: scale(1.1);
    }

    .icon-btn.save {
        color: #4caf50;
    }
    .icon-btn.cancel {
        color: #f44336;
    }
</style>
