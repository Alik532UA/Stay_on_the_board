<script lang="ts">
    import { _ } from "svelte-i18n";
    import ToggleButton from "$lib/components/ToggleButton.svelte";
    import { scrubbable } from "$lib/actions/scrubbable";
    import type { Room } from "$lib/types/online";
    import type { GameSettingsState } from "$lib/stores/gameSettingsStore";
    import SvgIcons from "$lib/components/SvgIcons.svelte";
    import { slide } from "svelte/transition";

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
    <div class="settings-header">
        <h3>
            <SvgIcons name="editing" width="20" height="20" />
            {$_("settings.title")}
        </h3>
    </div>

    <div class="settings-content">
        <!-- Main Game Params Group -->
        <div class="group-box">
            <div class="setting-row">
                <span class="label">{$_("settings.boardSize")}</span>
                <div class="control-group">
                    <button
                        class="icon-btn"
                        disabled={!canEditSettings ||
                            room.settings.boardSize <= 3}
                        on:click={() => updateBoardSize(-1)}
                        data-testid="board-size-decrease-btn"
                    >
                        -
                    </button>
                    <!-- Or just text - -->

                    <div
                        class="value-display scrubbable"
                        class:disabled={!canEditSettings}
                        use:scrubbable={{
                            value: room.settings.boardSize,
                            min: 3,
                            max: 9,
                            step: 20,
                            onInput: () => {},
                            onChange: (val) =>
                                onUpdateSetting("boardSize", val),
                            disabled: !canEditSettings,
                        }}
                        title={canEditSettings ? "Drag to change" : ""}
                        data-testid="board-size-value"
                    >
                        {room.settings.boardSize}x{room.settings.boardSize}
                    </div>

                    <button
                        class="icon-btn"
                        disabled={!canEditSettings ||
                            room.settings.boardSize >= 9}
                        on:click={() => updateBoardSize(1)}
                        data-testid="board-size-increase-btn"
                    >
                        +
                    </button>
                </div>
            </div>

            <div class="setting-row">
                <span class="label">Time (sec)</span>
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
                            onChange: (val) =>
                                onUpdateSetting("turnDuration", val),
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

        <!-- Toggles Group -->
        <div class="group-box toggles">
            <!-- Автоматично приховувати дошку -->
            <div class="toggle-row">
                <ToggleButton
                    label={$_("gameModes.autoHideBoard")}
                    checked={room.settings.autoHideBoard}
                    disabled={!canEditSettings}
                    on:toggle={() =>
                        onUpdateSetting(
                            "autoHideBoard",
                            !room.settings.autoHideBoard,
                        )}
                    dataTestId="auto-hide-board-toggle"
                />
            </div>

            <!-- Режим блокування -->
            <div class="toggle-row">
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
            <div class="toggle-row">
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
        </div>

        {#if amIHost}
            <!-- Host controls as normal toggle row -->
            <div class="toggle-row" transition:slide>
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
            <div
                class="host-only-hint"
                transition:slide
                data-testid="host-only-hint"
            >
                <SvgIcons name="lock" width="14" height="14" />
                {$_("onlineMenu.lobby.hostOnlySettings")}
            </div>
        {/if}
    </div>
</div>

<style>
    .settings-section {
        background: rgba(255, 255, 255, 0.03);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        border-radius: 20px;
        border: 1px solid rgba(255, 255, 255, 0.1);
        /* overflow: hidden; Removed to prevent button cutoff */
        margin-bottom: 24px;
        /* box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1); */
    }

    .settings-header {
        padding: 16px 20px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        background: rgba(255, 255, 255, 0.02);
    }

    .settings-header h3 {
        margin: 0;
        font-size: 1.1rem;
        display: flex;
        align-items: center;
        gap: 10px;
        color: var(--text-primary);
    }

    .settings-content {
        padding: 20px;
        display: flex;
        flex-direction: column;
        gap: 16px;
    }

    .group-box {
        background: rgba(0, 0, 0, 0.1);
        border-radius: 12px;
        padding: 4px;
        display: flex;
        flex-direction: column;
        gap: 2px;
    }

    .group-box.toggles {
        background: transparent;
        padding: 0;
        gap: 12px;
    }

    /* .group-box.host-controls removed */

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

    .toggle-row {
        display: flex;
        justify-content: center;
    }
    /* We assume ToggleButton has internal layout, but we can center it or stretch it via container */

    .host-only-hint {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        font-size: 0.85em;
        color: var(--text-secondary);
        font-style: italic;
        padding: 8px;
        background: rgba(0, 0, 0, 0.1);
        border-radius: 8px;
    }
</style>
