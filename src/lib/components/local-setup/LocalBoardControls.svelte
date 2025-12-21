<script lang="ts">
    import { gameSettingsStore } from "$lib/stores/gameSettingsStore";
    import { _ } from "svelte-i18n";
    import { logService } from "$lib/services/logService.js";
    import Stepper from "$lib/components/ui/Stepper.svelte";
    import ButtonGroup from "$lib/components/ui/ButtonGroup.svelte";

    $: settings = $gameSettingsStore;
    // FIX: Явно витягуємо gameMode для реактивності
    $: currentMode = settings.gameMode;

    // Helper: перевіряє, чи відповідає поточний gameMode legacy пресету
    function isPresetActive(legacyPreset: string, mode: string | null) {
        if (!mode) return false;

        if (mode === legacyPreset) return true;

        if (legacyPreset === "observer" && mode === "local-observer")
            return true;
        if (legacyPreset === "experienced" && mode === "local-experienced")
            return true;
        if (legacyPreset === "pro" && mode === "local-pro") return true;

        return false;
    }

    function changeBoardSize(increment: number) {
        logService.action(
            `Click: "Змінити розмір дошки: ${increment > 0 ? "+" : ""}${increment}" (LocalBoardControls)`,
        );
        const newSize = settings.boardSize + increment;
        if (newSize >= 2 && newSize <= 9) {
            gameSettingsStore.updateSettings({ boardSize: newSize });
        }
    }

    // Формуємо опції для ButtonGroup
    $: modeOptions = [
        {
            label: $_("gameModes.observer"),
            active: isPresetActive("observer", currentMode),
            onClick: () => gameSettingsStore.applyPreset("observer"),
            dataTestId: "local-setup-mode-observer",
        },
        {
            label: $_("gameModes.experienced"),
            active: isPresetActive("experienced", currentMode),
            onClick: () => gameSettingsStore.applyPreset("experienced"),
            dataTestId: "local-setup-mode-experienced",
        },
        {
            label: $_("gameModes.pro"),
            active: isPresetActive("pro", currentMode),
            onClick: () => gameSettingsStore.applyPreset("pro"),
            dataTestId: "local-setup-mode-pro",
        },
    ];
</script>

<div class="settings-list-group">
    <!-- Керування розміром дошки -->
    <div class="setting-item">
        <span class="setting-label">{$_("settings.boardSizeLabel")}</span>

        <Stepper
            value={`${settings.boardSize}x${settings.boardSize}`}
            dataTestId="local-board-size-stepper"
            decreaseTestId="board-size-decrement-btn"
            increaseTestId="board-size-increment-btn"
            valueTestId="board-size-value"
            on:decrement={() => changeBoardSize(-1)}
            on:increment={() => changeBoardSize(1)}
        />
    </div>

    <!-- Вибір режиму гри -->
    <div class="setting-item mode-selector">
        <span class="setting-label">{$_("gameModes.title")}</span>

        <!-- FIX: Використовуємо ButtonGroup замість ручної верстки -->
        <ButtonGroup
            options={modeOptions}
            dataTestId="local-setup-mode-group"
        />
    </div>
</div>

<style>
    .settings-list-group {
        display: flex;
        flex-direction: column;
        gap: 16px;
    }
    .setting-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-size: 1.08em;
        padding: 0;
        gap: 12px;
    }
    .setting-label {
        font-weight: 700;
        font-size: 1em;
        text-align: left;
        flex-grow: 1;
    }

    .mode-selector {
        flex-direction: column;
        align-items: flex-start;
        gap: 8px; /* Додаємо відступ між заголовком і кнопками */
    }

    /* Всі старі стилі (.mode-options-grid, .mode-btn) видалено, 
       оскільки вони тепер інкапсульовані в ButtonGroup */
</style>
