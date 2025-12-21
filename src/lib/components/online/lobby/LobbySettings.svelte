<script lang="ts">
    import { _ } from "svelte-i18n";
    import SvgIcons from "$lib/components/SvgIcons.svelte";
    import type { Room } from "$lib/types/online";
    import type { GameSettingsState } from "$lib/stores/gameSettingsStore";

    // FIX: Import decomposed components
    import LobbyParamControls from "./LobbyParamControls.svelte";
    import LobbyToggleControls from "./LobbyToggleControls.svelte";

    export let room: Room;
    export let canEditSettings: boolean;
    export let amIHost: boolean;

    // Callbacks for updates
    export let onUpdateSetting: (
        key: keyof GameSettingsState,
        value: any,
    ) => void;
    export let onUpdateRoomSetting: (key: string, value: any) => void;
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
        <LobbyParamControls {room} {canEditSettings} {onUpdateSetting} />

        <!-- Toggles Group -->
        <LobbyToggleControls
            {room}
            {canEditSettings}
            {amIHost}
            {onUpdateSetting}
            {onUpdateRoomSetting}
        />
    </div>
</div>

<style>
    .settings-section {
        background: rgba(255, 255, 255, 0.03);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        border-radius: 20px;
        border: 1px solid rgba(255, 255, 255, 0.1);
        margin-bottom: 24px;
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
</style>
