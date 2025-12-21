<script lang="ts">
  import { appSettingsStore } from "$lib/stores/appSettingsStore";
  import {
    gameSettingsStore,
    type GameSettingsState,
  } from "$lib/stores/gameSettingsStore";
  import { userActionService } from "$lib/services/userActionService";
  import { logService } from "$lib/services/logService";
  import { clearCache } from "$lib/utils/cacheManager";
  import { _ } from "svelte-i18n";
  import { locale } from "svelte-i18n";
  import { languages } from "$lib/constants";
  import StyledButton from "$lib/components/ui/StyledButton.svelte";
  import ToggleButton from "$lib/components/ToggleButton.svelte";
  import type { GameModePreset } from "$lib/stores/gameSettingsStore";
  import NotoEmoji from "$lib/components/NotoEmoji.svelte";

  $: settings = $appSettingsStore;
  $: gameSettings = $gameSettingsStore;

  const modes: GameModePreset[] = ["beginner", "experienced", "pro"];

  function selectLang(lang: string) {
    logService.ui(`Зміна мови: ${lang}`);
    appSettingsStore.updateSettings({ language: lang });
    localStorage.setItem("language", lang);
    locale.set(lang);
  }

  function selectTheme(style: string, theme: string) {
    logService.ui(`Зміна теми: ${style}, ${theme}`);
    appSettingsStore.updateSettings({ style, theme });
  }

  function toggleSetting(name: string) {
    const key = name as keyof GameSettingsState;
    gameSettingsStore.updateSettings({ [key]: !gameSettings[key] });
  }

  function resetSettings() {
    gameSettingsStore.resetSettings();
  }

  function handleKeepAppearance() {
    clearCache({ keepAppearance: true });
  }

  function handleClearAll() {
    clearCache({ keepAppearance: false });
  }
</script>

<div class="setup-grid">
  <!-- Column 1: Appearance -->
  <div class="grid-column" data-testid="settings-column-appearance">
    <div class="settings-card">
      <div class="settings-group">
        <span class="settings-label">{$_("settings.language")}</span>
        <div class="language-selector">
          {#each languages as lang}
            <button
              class="language-button"
              class:active={settings.language === lang.code}
              on:click={() => selectLang(lang.code)}
            >
              <div class="lang-flag-wrapper">
                {@html lang.svg}
              </div>
            </button>
          {/each}
        </div>
      </div>
      <hr class="settings-divider" />
      <div class="theme-selector">
        {#each ["purple", "green", "blue", "gray", "orange", "wood"] as style}
          <div class="theme-style-row" data-style={style}>
            <button
              class="theme-btn"
              data-theme="light"
              on:click={() => selectTheme(style, "light")}
            >
              <NotoEmoji name="sun" size="20px" />
            </button>
            <span class="theme-name">{$_(`mainMenu.themeName.${style}`)}</span>
            <button
              class="theme-btn"
              data-theme="dark"
              on:click={() => selectTheme(style, "dark")}
            >
              <NotoEmoji name="crescent_moon" size="20px" />
            </button>
          </div>
        {/each}
      </div>
    </div>
  </div>

  <!-- Column 2: Gameplay -->
  <div class="grid-column" data-testid="settings-column-game">
    <div class="settings-card">
      <div class="settings-section">
        <span class="settings-label">{$_("settings.gameMode")}</span>
        <div class="settings-button-group">
          <StyledButton
            variant={!gameSettings.rememberGameMode ? "primary" : "menu"}
            on:click={() => {
              gameSettingsStore.updateSettings({
                gameMode: null,
                showGameModeModal: true,
                rememberGameMode: false,
              });
              if (typeof window !== "undefined")
                sessionStorage.removeItem("gameMode");
            }}
          >
            {$_("gameModes.choose")}
          </StyledButton>
          <div class="game-mode-buttons">
            {#each modes as mode}
              <StyledButton
                variant={gameSettings.rememberGameMode &&
                gameSettings.gameMode === mode
                  ? "primary"
                  : "menu"}
                on:click={() => userActionService.setGameModePreset(mode)}
              >
                {$_(`gameModes.${mode}`)}
              </StyledButton>
            {/each}
          </div>
        </div>
      </div>
      <hr class="settings-divider" />
      <div class="settings-option">
        <ToggleButton
          label={$_("settings.showDifficultyWarningModal")}
          checked={gameSettings.showDifficultyWarningModal}
          on:toggle={() => toggleSetting("showDifficultyWarningModal")}
        />
      </div>
      <hr class="settings-divider" />
      <div class="settings-actions">
        <StyledButton
          variant="menu"
          on:click={resetSettings}
          tooltip={$_("settings.resetHint")}
        >
          <span>{$_("settings.reset")}</span>
        </StyledButton>
        <StyledButton variant="menu" on:click={handleKeepAppearance}>
          <span>{$_("mainMenu.clearCacheModal.keepAppearance")}</span>
        </StyledButton>
        <StyledButton variant="danger" on:click={handleClearAll}>
          <span>{$_("mainMenu.clearCacheModal.fullClear")}</span>
        </StyledButton>
      </div>
    </div>
  </div>
</div>

<style>
  .setup-grid {
    display: grid;
    gap: 24px;
    grid-template-columns: 1fr;
  }

  @media (min-width: 768px) {
    .setup-grid {
      grid-template-columns: 1fr 1fr;
    }
  }

  .grid-column {
    display: flex;
    flex-direction: column;
    gap: 16px;
    min-width: 0;
  }

  .settings-card {
    background: var(--bg-secondary);
    padding: 24px;
    border-radius: var(--unified-border-radius);
    box-shadow: var(--unified-shadow);
    border: var(--unified-border);
    display: flex;
    flex-direction: column;
    gap: 20px;
    flex-grow: 1;
  }

  .settings-group {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .settings-label {
    font-weight: 600;
    color: var(--text-secondary);
  }

  .settings-divider {
    border: none;
    border-top: 1.5px solid var(--border-color);
    margin: 8px 0;
  }

  .settings-section {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .settings-button-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
    width: 100%;
  }

  .game-mode-buttons {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .settings-option {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .settings-actions {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .language-selector {
    display: flex;
    gap: 8px;
  }

  .language-button {
    background: transparent !important;
    border: var(--global-border-width) solid transparent !important;
    border-radius: 8px;
    padding: 4px;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .language-button:hover {
    border-color: var(--control-selected) !important;
  }

  .language-button.active {
    border-color: var(--control-selected) !important;
    box-shadow: none !important;
    background: var(--bg-hover) !important;
  }

  .lang-flag-wrapper {
    width: 32px;
    height: 24px;
    border-radius: 4px;
    overflow: hidden;
    display: block;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .lang-flag-wrapper :global(svg) {
    width: 100%;
    height: 100%;
    display: block;
    object-fit: cover;
  }

  /* === Theme Selector Styles (Restored & Isolated) === */
  .theme-selector {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .theme-style-row {
    border-radius: 12px;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px 12px;
    justify-content: space-between;
    transition:
      transform 0.2s,
      box-shadow 0.2s;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .theme-style-row:hover {
    transform: scale(1.01);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  /* Theme Colors */
  .theme-style-row[data-style="purple"] {
    background: rgba(124, 58, 237, 0.45);
    border-color: rgba(124, 58, 237, 0.6);
  }
  .theme-style-row[data-style="green"] {
    background: rgba(0, 200, 80, 0.4);
    border-color: rgba(0, 200, 80, 0.6);
  }
  .theme-style-row[data-style="blue"] {
    background: rgba(33, 150, 243, 0.4);
    border-color: rgba(33, 150, 243, 0.6);
  }
  .theme-style-row[data-style="gray"] {
    background: rgba(120, 120, 120, 0.3);
    border-color: rgba(120, 120, 120, 0.5);
    backdrop-filter: blur(8px);
  }
  .theme-style-row[data-style="orange"] {
    background: rgba(255, 224, 102, 0.45);
    border-color: rgba(255, 224, 102, 0.6);
  }
  .theme-style-row[data-style="wood"] {
    background: linear-gradient(90deg, #e2c9a0 0%, #c9a063 100%);
    border-color: #d4b483;
  }

  .theme-name {
    flex: 1;
    text-align: center;
    font-weight: 700;
    color: #fff;
    font-size: 1.1rem;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  }

  .theme-btn {
    background: rgba(0, 0, 0, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 8px;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
    padding: 0;
  }

  .theme-btn:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: scale(1.1);
  }

  .theme-btn[data-theme="light"] {
    background: rgba(255, 255, 255, 0.25);
  }
  .theme-btn[data-theme="dark"] {
    background: rgba(0, 0, 0, 0.3);
  }
</style>
