<script lang="ts">
    import { scrubbable } from "$lib/actions/scrubbable";
    import type { Room } from "$lib/types/online";

    export let room: Room;
    export let canEditSettings: boolean;

    export let onUpdateSetting: (key: string, value: any) => void;

    function updateBoardSize(increment: number) {
        if (!canEditSettings) return;
        const newSize = room.settings.boardSize + increment;
        if (newSize >= 3 && newSize <= 9) {
            onUpdateSetting("boardSize", newSize);
        }
    }

    function updateTurnDuration(increment: number) {
        if (!canEditSettings) return;
        const current = room.settings.turnDuration || 30;
        const newDuration = Math.max(5, Math.min(1000, current + increment));
        onUpdateSetting("turnDuration", newDuration);
    }
</script>

<div class="group-box">
    <div class="setting-row">
        <span class="label">Розмір</span>
        <div class="control-group">
            <button
                class="icon-btn"
                disabled={!canEditSettings || room.settings.boardSize <= 3}
                on:click={() => updateBoardSize(-1)}
                data-testid="board-size-decrease-btn"
            >
                -
            </button>

            <div
                class="value-display scrubbable"
                class:disabled={!canEditSettings}
                use:scrubbable={{
                    value: room.settings.boardSize,
                    min: 3,
                    max: 9,
                    step: 20,
                    onInput: () => {},
                    onChange: (val) => onUpdateSetting("boardSize", val),
                    disabled: !canEditSettings,
                }}
                title={canEditSettings ? "Drag to change" : ""}
                data-testid="board-size-value"
            >
                {room.settings.boardSize}x{room.settings.boardSize}
            </div>

            <button
                class="icon-btn"
                disabled={!canEditSettings || room.settings.boardSize >= 9}
                on:click={() => updateBoardSize(1)}
                data-testid="board-size-increase-btn"
            >
                +
            </button>
        </div>
    </div>

    <div class="setting-row">
        <span class="label">Час (сек)</span>
        <div class="control-group">
            <button
                class="icon-btn"
                disabled={!canEditSettings}
                on:click={() => updateTurnDuration(-5)}
                data-testid="turn-duration-decrease-btn"
            >
                -
            </button>

            <div
                class="value-display scrubbable"
                class:disabled={!canEditSettings}
                use:scrubbable={{
                    value: room.settings.turnDuration || 30,
                    min: 5,
                    max: 1000,
                    step: 2,
                    onInput: () => {},
                    onChange: (val) => onUpdateSetting("turnDuration", val),
                    disabled: !canEditSettings,
                }}
                title={canEditSettings ? "Drag to change" : ""}
                data-testid="turn-duration-value"
            >
                {room.settings.turnDuration || 30}s
            </div>

            <button
                class="icon-btn"
                disabled={!canEditSettings}
                on:click={() => updateTurnDuration(5)}
                data-testid="turn-duration-increase-btn"
            >
                +
            </button>
        </div>
    </div>
</div>

<style>
    .group-box {
        background: rgba(0, 0, 0, 0.1);
        border-radius: 12px;
        padding: 4px;
        display: flex;
        flex-direction: column;
        gap: 2px;
    }

    .setting-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px 12px;
        background: rgba(255, 255, 255, 0.02);
        border-radius: 8px;
    }

    .label {
        font-weight: 600;
        font-size: 0.9em;
        color: var(--text-secondary);
    }

    .control-group {
        display: flex;
        align-items: center;
        gap: 8px;
        background: rgba(0, 0, 0, 0.2);
        border-radius: 8px;
        padding: 4px;
    }

    .icon-btn {
        width: 28px;
        height: 28px;
        border-radius: 6px;
        border: none;
        background: rgba(255, 255, 255, 0.05);
        color: var(--text-primary);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
    }

    .icon-btn:hover:not(:disabled) {
        background: rgba(255, 255, 255, 0.15);
    }

    .icon-btn:disabled {
        opacity: 0.3;
        cursor: not-allowed;
    }

    .value-display {
        min-width: 60px;
        text-align: center;
        font-weight: 700;
        font-size: 0.95em;
        padding: 2px 4px;
        border-radius: 4px;
        user-select: none;
    }

    .value-display.scrubbable {
        cursor: ew-resize;
        transition: color 0.2s;
    }

    .value-display.scrubbable:hover:not(.disabled) {
        color: var(--text-accent);
        background: rgba(255, 255, 255, 0.05);
    }
</style>
