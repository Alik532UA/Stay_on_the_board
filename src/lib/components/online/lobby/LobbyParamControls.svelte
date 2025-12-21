<script lang="ts">
    import type { Room } from "$lib/types/online";
    import Stepper from "$lib/components/ui/Stepper.svelte";

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

    // Обробник зміни через scrubbable (перетягування)
    function handleScrubChange(key: string, val: number) {
        if (!canEditSettings) return;
        onUpdateSetting(key, val);
    }
</script>

<div class="group-box">
    <div class="setting-row">
        <span class="label">Розмір</span>
        <!-- FIX: Використовуємо Stepper замість ручної розмітки -->
        <Stepper
            value={room.settings.boardSize}
            disabled={!canEditSettings}
            dataTestId="lobby-board-size-control"
            decreaseTestId="board-size-decrease-btn"
            increaseTestId="board-size-increase-btn"
            valueTestId="board-size-value"
            scrubConfig={{ min: 3, max: 9, step: 1 }}
            on:decrement={() => updateBoardSize(-1)}
            on:increment={() => updateBoardSize(1)}
            on:change={(e) => handleScrubChange("boardSize", e.detail)}
        />
    </div>

    <div class="setting-row">
        <span class="label">Час (сек)</span>
        <Stepper
            value={room.settings.turnDuration || 30}
            disabled={!canEditSettings}
            dataTestId="lobby-turn-duration-control"
            decreaseTestId="turn-duration-decrease-btn"
            increaseTestId="turn-duration-increase-btn"
            valueTestId="turn-duration-value"
            scrubConfig={{ min: 5, max: 1000, step: 5 }}
            on:decrement={() => updateTurnDuration(-5)}
            on:increment={() => updateTurnDuration(5)}
            on:change={(e) => handleScrubChange("turnDuration", e.detail)}
        />
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
</style>
