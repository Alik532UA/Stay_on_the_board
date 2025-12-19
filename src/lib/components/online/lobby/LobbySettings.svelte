<script lang="ts">
    import { _ } from "svelte-i18n";
    import ToggleButton from "$lib/components/ToggleButton.svelte";
    import { scrubbable } from "$lib/actions/scrubbable";
    import type { Room } from "$lib/types/online";
    import type { GameSettingsState } from "$lib/stores/gameSettingsStore";

    export let room: Room;
    export let canEditSettings: boolean;
    export let amIHost: boolean;

    // Callbacks for updates
    export let onUpdateSetting: (
        key: keyof GameSettingsState,
        value: any,
    ) => void;
    export let onUpdateRoomSetting: (key: string, value: any) => void;

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

<div class="settings-section">
    <h3>{$_("settings.title")}</h3>

    <!-- Розмір дошки -->
    <div class="setting-item">
        <span>{$_("settings.boardSize")}</span>
        <div class="size-controls">
            <button
                disabled={!canEditSettings || room.settings.boardSize <= 3}
                on:click={() => updateBoardSize(-1)}
                data-testid="board-size-decrease-btn">-</button
            >

            <span
                class="size-value scrubbable-value"
                class:disabled={!canEditSettings}
                use:scrubbable={{
                    value: room.settings.boardSize,
                    min: 3,
                    max: 9,
                    step: 20,
                    onInput: (val) => {
                        /* Local update handled by parent if needed, or just wait for server */
                    },
                    onChange: (val) => onUpdateSetting("boardSize", val),
                    disabled: !canEditSettings,
                }}
                title={canEditSettings ? "Натисніть і потягніть для зміни" : ""}
                data-testid="board-size-value"
            >
                {room.settings.boardSize}x{room.settings.boardSize}
            </span>

            <button
                disabled={!canEditSettings || room.settings.boardSize >= 9}
                on:click={() => updateBoardSize(1)}
                data-testid="board-size-increase-btn">+</button
            >
        </div>
    </div>

    <!-- Таймер -->
    <div class="setting-item">
        <span>Час на хід (сек)</span>
        <div class="size-controls">
            <button
                disabled={!canEditSettings}
                on:click={() => updateTurnDuration(-5)}
                data-testid="turn-duration-decrease-btn">-</button
            >

            <span
                class="size-value scrubbable-value"
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
                title={canEditSettings ? "Натисніть і потягніть для зміни" : ""}
                data-testid="turn-duration-value"
            >
                {room.settings.turnDuration || 30}
            </span>

            <button
                disabled={!canEditSettings}
                on:click={() => updateTurnDuration(5)}
                data-testid="turn-duration-increase-btn">+</button
            >
        </div>
    </div>

    <!-- Автоматично приховувати дошку -->
    <div class="setting-item full-width">
        <ToggleButton
            label={$_("gameModes.autoHideBoard")}
            checked={room.settings.autoHideBoard}
            disabled={!canEditSettings}
            on:toggle={() =>
                onUpdateSetting("autoHideBoard", !room.settings.autoHideBoard)}
            dataTestId="auto-hide-board-toggle"
        />
    </div>

    <!-- Режим блокування -->
    <div class="setting-item full-width">
        <ToggleButton
            label={$_("gameControls.blockMode")}
            checked={room.settings.blockModeEnabled}
            disabled={!canEditSettings}
            on:toggle={() =>
                onUpdateSetting(
                    "blockModeEnabled",
                    !room.settings.blockModeEnabled,
                )}
            dataTestId="block-mode-toggle"
        />
    </div>

    <!-- Заборонити зміни під час гри -->
    <div class="setting-item full-width">
        <ToggleButton
            label={$_("localGame.lockSettings")}
            checked={room.settings.settingsLocked}
            disabled={!canEditSettings}
            on:toggle={() =>
                onUpdateSetting(
                    "settingsLocked",
                    !room.settings.settingsLocked,
                )}
            dataTestId="lock-settings-toggle"
        />
    </div>

    <!-- Дозволити гостям змінювати налаштування -->
    {#if amIHost}
        <div class="setting-item full-width">
            <ToggleButton
                label={$_("onlineMenu.lobby.allowGuestSettings")}
                checked={room.allowGuestSettings}
                on:toggle={() =>
                    onUpdateRoomSetting(
                        "allowGuestSettings",
                        !room.allowGuestSettings,
                    )}
                dataTestId="allow-guest-settings-toggle"
            />
        </div>
    {/if}

    {#if !amIHost && !room.allowGuestSettings}
        <div class="host-only-hint" data-testid="host-only-hint">
            {$_("onlineMenu.lobby.hostOnlySettings")}
        </div>
    {/if}
</div>

<style>
    .settings-section {
        background: var(--bg-secondary);
        padding: 20px;
        border-radius: var(--unified-border-radius);
        border: var(--unified-border);
        box-shadow: var(--unified-shadow);
        margin-bottom: 20px;
    }
    .setting-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
    }
    .setting-item.full-width {
        justify-content: center;
    }
    .size-controls {
        display: flex;
        align-items: center;
        gap: 12px;
    }
    .size-controls button {
        width: 32px;
        height: 32px;
        border-radius: 8px;
        border: var(--global-border-width) solid var(--border-color);
        background: var(--control-bg);
        color: var(--text-primary);
        cursor: pointer;
    }
    .size-controls button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
    .size-value {
        font-weight: bold;
        min-width: 40px;
        text-align: center;
        user-select: none;
    }
    .scrubbable-value {
        cursor: ew-resize;
        padding: 2px 6px;
        border-radius: 4px;
        transition:
            background 0.2s,
            color 0.2s;
        border: 1px solid transparent;
    }
    .scrubbable-value:hover:not(.disabled) {
        background: rgba(255, 255, 255, 0.1);
        border-color: var(--border-color);
        color: var(--text-accent);
    }
    .scrubbable-value.disabled {
        cursor: default;
        opacity: 0.8;
    }
    :global(.scrubbable-value.scrubbing) {
        background: var(--control-selected);
        color: var(--control-selected-text);
        border-color: var(--control-selected);
    }
    .host-only-hint {
        font-size: 0.8em;
        color: var(--text-secondary);
        text-align: center;
        font-style: italic;
    }
</style>
