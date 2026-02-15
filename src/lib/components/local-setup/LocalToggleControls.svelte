<script lang="ts">
    import { gameSettingsStore } from "$lib/stores/gameSettingsStore";
    import { t } from "$lib/i18n/typedI18n";
    import { logService } from "$lib/services/logService.js";
    import ToggleButton from "$lib/components/ToggleButton.svelte";

    $: settings = $gameSettingsStore;
</script>

<div class="settings-list-group">
    <!-- ToggleButton: Режим заблокованих клітинок -->
    <ToggleButton
        label={$t("gameControls.blockMode")}
        bind:checked={settings.blockModeEnabled}
        on:toggle={() => {
            const newCheckedState = !settings.blockModeEnabled;
            logService.action(
                `Click: "Режим заблокованих клітинок: ${newCheckedState}" (LocalToggleControls)`,
            );
            gameSettingsStore.updateSettings({
                blockModeEnabled: newCheckedState,
            });
        }}
        dataTestId="block-mode-toggle"
    />

    <!-- ToggleButton: Автоматично приховувати дошку -->
    <ToggleButton
        label={$t("gameModes.autoHideBoard")}
        bind:checked={settings.autoHideBoard}
        on:toggle={() => {
            const newCheckedState = !settings.autoHideBoard;
            logService.action(
                `Click: "Автоматично приховувати дошку: ${newCheckedState}" (LocalToggleControls)`,
            );
            gameSettingsStore.updateSettings({
                autoHideBoard: newCheckedState,
            });
        }}
        dataTestId="auto-hide-board-toggle"
    />

    <!-- ToggleButton: Заборонити змінювати правила -->
    <ToggleButton
        label={$t("localGame.lockSettings")}
        bind:checked={settings.lockSettings}
        on:toggle={() => {
            const newCheckedState = !settings.lockSettings;
            logService.action(
                `Click: "Заборонити змінювати правила: ${newCheckedState}" (LocalToggleControls)`,
            );
            gameSettingsStore.updateSettings({ lockSettings: newCheckedState });
        }}
        dataTestId="lock-settings-toggle"
    />
</div>

<style>
    .settings-list-group {
        display: flex;
        flex-direction: column;
        gap: 16px;
    }
</style>
