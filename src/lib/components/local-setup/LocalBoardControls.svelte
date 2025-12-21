<script lang="ts">
    import { gameSettingsStore } from "$lib/stores/gameSettingsStore";
    import { _ } from "svelte-i18n";
    import { logService } from "$lib/services/logService.js";

    $: settings = $gameSettingsStore;
    // FIX: Явно витягуємо gameMode для реактивності
    $: currentMode = settings.gameMode;

    // Helper: перевіряє, чи відповідає поточний gameMode legacy пресету
    // FIX: Додано аргумент mode
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
</script>

<div class="settings-list-group">
    <!-- Керування розміром дошки -->
    <div class="setting-item">
        <span class="setting-label">{$_("settings.boardSizeLabel")}</span>
        <div class="size-adjuster">
            <button
                class="adjust-btn"
                on:click={() => changeBoardSize(-1)}
                disabled={settings.boardSize <= 2}
                data-testid="board-size-decrement-btn">-</button
            >
            <span class="current-size"
                >{settings.boardSize}x{settings.boardSize}</span
            >
            <button
                class="adjust-btn"
                on:click={() => changeBoardSize(1)}
                disabled={settings.boardSize >= 9}
                data-testid="board-size-increment-btn">+</button
            >
        </div>
    </div>

    <!-- Вибір режиму гри -->
    <div class="setting-item mode-selector">
        <span class="setting-label">{$_("gameModes.title")}</span>
        <div class="mode-options-grid">
            <button
                class="mode-btn"
                class:active={isPresetActive("observer", currentMode)}
                on:click={() => gameSettingsStore.applyPreset("observer")}
                data-testid="local-setup-mode-observer"
            >
                {$_("gameModes.observer")}
            </button>
            <button
                class="mode-btn"
                class:active={isPresetActive("experienced", currentMode)}
                on:click={() => gameSettingsStore.applyPreset("experienced")}
                data-testid="local-setup-mode-experienced"
            >
                {$_("gameModes.experienced")}
            </button>
            <button
                class="mode-btn"
                class:active={isPresetActive("pro", currentMode)}
                on:click={() => gameSettingsStore.applyPreset("pro")}
                data-testid="local-setup-mode-pro"
            >
                {$_("gameModes.pro")}
            </button>
        </div>
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
    .size-adjuster {
        display: flex;
        align-items: center;
        gap: 10px;
    }
    .adjust-btn {
        background: var(--control-bg);
        color: var(--text-primary);
        border: var(--global-border-width) solid var(--border-color);
        border-radius: 8px;
        width: 40px;
        height: 40px;
        font-size: 1.2em;
        font-weight: bold;
        cursor: pointer;
        transition:
            background 0.2s,
            border-color 0.2s;
    }
    .adjust-btn:hover {
        background: var(--control-hover);
        border-color: var(--control-hover);
    }
    .adjust-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
    .current-size {
        font-weight: bold;
        min-width: 50px;
        text-align: center;
    }
    .mode-selector {
        flex-direction: column;
        align-items: flex-start;
    }
    .mode-options-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(90px, 1fr));
        gap: 12px;
        margin-top: 8px;
        width: 100%;
    }
    .mode-btn {
        background: var(--control-bg);
        color: var(--text-primary);
        border: var(--global-border-width) solid #888;
        border-radius: 8px;
        padding: 0 10.8px;
        height: 36px;
        min-height: 36px;
        box-sizing: border-box;
        font-size: 14.4px;
        font-weight: 600;
        cursor: pointer;
        transition:
            background 0.18s,
            color 0.18s,
            border 0.18s;
        display: flex;
        align-items: center;
        justify-content: center;
        white-space: nowrap;
    }
    .mode-btn:hover,
    .mode-btn:focus {
        border-color: var(--control-selected);
        color: var(--text-primary);
        outline: none;
    }
    .mode-btn.active {
        background: var(--control-selected);
        color: var(--control-selected-text);
        border-color: var(--control-selected);
        transform: scale(1.07);
        z-index: 1;
    }
</style>
