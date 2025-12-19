<script>
  import { gameSettingsStore } from "$lib/stores/gameSettingsStore";
  import { _ } from "svelte-i18n";
  import { logService } from "$lib/services/logService.js";
  import ToggleButton from "$lib/components/ToggleButton.svelte";
  import { get } from "svelte/store";

  // НАВІЩО: Тепер компонент працює виключно з gameSettingsStore,
  // що відповідає принципу SSoT.
  $: settings = $gameSettingsStore;

  // Helper: перевіряє, чи відповідає поточний gameMode legacy пресету
  // Враховує нові structured presets (local-observer, local-experienced, local-pro)
  /**
   * @param {string} legacyPreset
   * @returns {boolean}
   */
  function isPresetActive(legacyPreset) {
    const currentMode = settings.gameMode;
    if (!currentMode) return false;

    // Пряме порівняння (legacy presets)
    if (currentMode === legacyPreset) return true;

    // Порівняння з новими structured presets для local режиму
    if (legacyPreset === "observer" && currentMode === "local-observer")
      return true;
    if (legacyPreset === "experienced" && currentMode === "local-experienced")
      return true;
    if (legacyPreset === "pro" && currentMode === "local-pro") return true;

    return false;
  }

  /**
   * Оновлює налаштування розміру дошки в store
   * @param {number} increment - Крок зміни (+1 або -1)
   */
  function changeBoardSize(increment) {
    logService.action(
      `Click: "Змінити розмір дошки: ${increment > 0 ? "+" : ""}${increment}" (LocalGameSettings)`,
    );
    const newSize = settings.boardSize + increment;
    if (newSize >= 2 && newSize <= 9) {
      gameSettingsStore.updateSettings({ boardSize: newSize });
    }
  }
</script>

{#if settings}
  <div class="settings-card">
    <h2 data-testid="local-game-settings-title">
      {$_("localGame.settingsTitle")}
    </h2>

    <div class="settings-list">
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
            class:active={isPresetActive("observer")}
            on:click={() => gameSettingsStore.applyPreset("observer")}
            data-testid="local-setup-mode-observer"
          >
            {$_("gameModes.observer")}
          </button>
          <button
            class="mode-btn"
            class:active={isPresetActive("experienced")}
            on:click={() => gameSettingsStore.applyPreset("experienced")}
            data-testid="local-setup-mode-experienced"
          >
            {$_("gameModes.experienced")}
          </button>
          <button
            class="mode-btn"
            class:active={isPresetActive("pro")}
            on:click={() => gameSettingsStore.applyPreset("pro")}
            data-testid="local-setup-mode-pro"
          >
            {$_("gameModes.pro")}
          </button>
        </div>
      </div>

      <!-- ToggleButton: Режим заблокованих клітинок -->
      <ToggleButton
        label={$_("gameControls.blockMode")}
        bind:checked={settings.blockModeEnabled}
        on:toggle={() => {
          const newCheckedState = !settings.blockModeEnabled;
          logService.action(
            `Click: "Режим заблокованих клітинок: ${newCheckedState}" (LocalGameSettings)`,
          );
          gameSettingsStore.updateSettings({
            blockModeEnabled: newCheckedState,
          });
        }}
        dataTestId="block-mode-toggle"
      />

      <!-- ToggleButton: Автоматично приховувати дошку -->
      <ToggleButton
        label={$_("gameModes.autoHideBoard")}
        bind:checked={settings.autoHideBoard}
        on:toggle={() => {
          const newCheckedState = !settings.autoHideBoard;
          logService.action(
            `Click: "Автоматично приховувати дошку: ${newCheckedState}" (LocalGameSettings)`,
          );
          gameSettingsStore.updateSettings({ autoHideBoard: newCheckedState });
        }}
        dataTestId="auto-hide-board-toggle"
      />

      <!-- ToggleButton: Заборонити змінювати правила -->
      <ToggleButton
        label={$_("localGame.lockSettings")}
        bind:checked={settings.lockSettings}
        on:toggle={() => {
          const newCheckedState = !settings.lockSettings;
          logService.action(
            `Click: "Заборонити змінювати правила: ${newCheckedState}" (LocalGameSettings)`,
          );
          gameSettingsStore.updateSettings({ lockSettings: newCheckedState });
        }}
        dataTestId="lock-settings-toggle"
      />
    </div>
  </div>
{/if}

<style>
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
  .settings-card {
    background: linear-gradient(
      120deg,
      rgba(255, 255, 255, 0.1) 0%,
      rgba(255, 255, 255, 0.04) 100%
    );
    backdrop-filter: var(--unified-backdrop-filter);
    padding: 24px;
    border-radius: var(--unified-border-radius);
    box-shadow: var(--unified-shadow);
    border: var(--unified-border);
  }
  h2 {
    text-align: center;
    margin: 0 0 20px 0;
    color: var(--text-primary);
  }
  .settings-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
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
    /* Use auto-fit to allow wrapping on very small screens, 
       but ensure items don't get smaller than 80px if possible */
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
