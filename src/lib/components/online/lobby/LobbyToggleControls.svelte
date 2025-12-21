<script lang="ts">
    import { _ } from "svelte-i18n";
    import ToggleButton from "$lib/components/ToggleButton.svelte";
    import SvgIcons from "$lib/components/SvgIcons.svelte";
    import type { Room } from "$lib/types/online";
    import { slide } from "svelte/transition";

    export let room: Room;
    export let canEditSettings: boolean;
    export let amIHost: boolean;

    export let onUpdateSetting: (key: string, value: any) => void;
    export let onUpdateRoomSetting: (key: string, value: any) => void;
</script>

<div class="group-box toggles">
    <!-- Автоматично приховувати дошку -->
    <div class="toggle-row">
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

<style>
    .group-box.toggles {
        background: transparent;
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: 12px;
    }

    .toggle-row {
        display: flex;
        justify-content: center;
    }

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
