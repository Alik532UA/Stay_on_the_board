<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { appSettingsStore } from "../stores/appSettingsStore.js";
  import {
    gameSettingsStore,
    type GameSettingsState,
    type GameModePreset,
  } from "../stores/gameSettingsStore.js";
  import { _ } from "svelte-i18n";
  import { locale } from "svelte-i18n";
  import "../css/layouts/main-menu.css";
  import { languages } from "$lib/constants.js";
  import { logService } from "$lib/services/logService.js";
  import { clearCache } from "$lib/utils/cacheManager.js";
  import { userActionService } from "$lib/services/userActionService.js";
  import VoiceSettings from "./VoiceSettings.svelte";
  import VoiceList from "./VoiceList.svelte";
  // Імпорт з правильного шляху
  import HotkeysTab from "./settings/HotkeysTab.svelte";
  import StyledButton from "$lib/components/ui/StyledButton.svelte";
  import ToggleButton from "$lib/components/ToggleButton.svelte";
  import { page } from "$app/stores";

  $: settings = $appSettingsStore;
  $: gameSettings = $gameSettingsStore;

  // Tabs configuration
  type Tab = 'general' | 'voice' | 'hotkeys';
  let activeTab: Tab = 'general';

  // Типізований список режимів для уникнення помилки TS
  const modes: GameModePreset[] = ['beginner', 'experienced', 'pro'];

  onMount(() => {
    // Check URL params for tab selection
    const tabParam = $page.url.searchParams.get('tab');
    if (tabParam && ['general', 'voice', 'hotkeys'].includes(tabParam)) {
      activeTab = tabParam as Tab;
    }
  });

  function setTab(tab: Tab) {
    activeTab = tab;
    // Optional: update URL without reload
    const url = new URL(window.location.href);
    url.searchParams.set('tab', tab);
    window.history.replaceState({}, '', url);
  }

  // --- Voice List Logic ---
  let showFade = false;
  let voiceListWrapper: HTMLDivElement;

  function updateFadeState() {
    if (!voiceListWrapper) return;
    const { scrollTop, scrollHeight, clientHeight } = voiceListWrapper;
    const isScrollable = scrollHeight > clientHeight;
    const isAtBottom = Math.abs(scrollHeight - scrollTop - clientHeight) < 1;
    showFade = isScrollable && !isAtBottom;
  }

  let mutationObserver: MutationObserver;
  let resizeObserver: ResizeObserver;

  function initVoiceObservers() {
    if (voiceListWrapper) {
      setTimeout(updateFadeState, 0);
      resizeObserver = new ResizeObserver(updateFadeState);
      resizeObserver.observe(voiceListWrapper);
      mutationObserver = new MutationObserver(updateFadeState);
      mutationObserver.observe(voiceListWrapper, { childList: true, subtree: true });
    }
  }

  // Re-run observers when tab changes to voice
  $: if (activeTab === 'voice') {
    setTimeout(initVoiceObservers, 100);
  }

  onDestroy(() => {
    if (mutationObserver) mutationObserver.disconnect();
    if (resizeObserver) resizeObserver.disconnect();
  });

  // --- Actions ---
  function handleClearAll() {
    clearCache({ keepAppearance: false });
  }

  function handleKeepAppearance() {
    clearCache({ keepAppearance: true });
  }

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
</script>

<div class="settings-container">
  <!-- Tabs Header -->
  <div class="tabs-header">
    <button 
      class="tab-btn" 
      class:active={activeTab === 'general'} 
      on:click={() => setTab('general')}
      data-testid="settings-tab-general"
    >
      {$_('settings.tabs.general')}
    </button>
    <button 
      class="tab-btn" 
      class:active={activeTab === 'voice'} 
      on:click={() => setTab('voice')}
      data-testid="settings-tab-voice"
    >
      {$_('settings.tabs.voice')}
    </button>
    <button 
      class="tab-btn" 
      class:active={activeTab === 'hotkeys'} 
      on:click={() => setTab('hotkeys')}
      data-testid="settings-tab-hotkeys"
    >
      {$_('settings.tabs.hotkeys')}
    </button>
  </div>

  <!-- Tab Content -->
  <div class="tab-content">
    
    <!-- GENERAL TAB -->
    {#if activeTab === 'general'}
      <div class="setup-grid">
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
                    {@html lang.svg}
                  </button>
                {/each}
              </div>
            </div>
            <hr class="settings-divider" />
            <div class="theme-selector">
              {#each ['purple', 'green', 'blue', 'gray', 'orange', 'wood'] as style}
                <div class="theme-style-row" data-style={style}>
                  <button class="theme-btn" data-theme="light" on:click={() => selectTheme(style, "light")}>☀️</button>
                  <span class="theme-name">{$_(`mainMenu.themeName.${style}`)}</span>
                  <button class="theme-btn" data-theme="dark" on:click={() => selectTheme(style, "dark")}>🌙</button>
                </div>
              {/each}
            </div>
          </div>
        </div>

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
                    if (typeof window !== "undefined") sessionStorage.removeItem("gameMode");
                  }}
                >
                  {$_("gameModes.choose")}
                </StyledButton>
                <div class="game-mode-buttons">
                  {#each modes as mode}
                    <StyledButton
                      variant={gameSettings.rememberGameMode && gameSettings.gameMode === mode ? "primary" : "menu"}
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
              <StyledButton variant="menu" on:click={resetSettings} tooltip={$_("settings.resetHint")}>
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
    {/if}

    <!-- VOICE TAB -->
    {#if activeTab === 'voice'}
      <div class="setup-grid">
        <div class="grid-column">
          <div class="settings-card">
            <span class="settings-label">{$_("settings.voiceSettings")}</span>
            <VoiceSettings />
          </div>
        </div>
        <div class="grid-column">
          <div class="settings-card" style="height: 100%; min-height: 400px;">
            <span class="settings-label">{$_("settings.voiceList")}</span>
            <div
              class="voice-list-wrapper"
              class:fade-bottom={showFade}
              bind:this={voiceListWrapper}
              on:scroll={updateFadeState}
            >
              <VoiceList />
            </div>
          </div>
        </div>
      </div>
    {/if}

    <!-- HOTKEYS TAB -->
    {#if activeTab === 'hotkeys'}
      <div class="settings-card">
        <HotkeysTab />
      </div>
    {/if}

  </div>
</div>

<style>
  .settings-container {
    display: flex;
    flex-direction: column;
    gap: 20px;
    width: 100%;
    max-width: 1200px;
    margin: 0 auto;
  }

  /* Tabs Header */
  .tabs-header {
    display: flex;
    justify-content: center;
    gap: 10px;
    margin-bottom: 10px;
    flex-wrap: wrap;
  }

  .tab-btn {
    background: var(--bg-secondary);
    color: var(--text-secondary);
    border: 2px solid var(--border-color);
    padding: 10px 24px;
    border-radius: 24px;
    font-weight: bold;
    font-size: 1.1em;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .tab-btn:hover {
    background: var(--control-bg);
    color: var(--text-primary);
  }

  .tab-btn.active {
    background: var(--control-selected);
    color: var(--control-selected-text);
    border-color: var(--control-selected);
    box-shadow: 0 4px 12px var(--shadow-color);
  }

  /* Grid Layout for General & Voice tabs */
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

  /* Reused styles */
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
    border: 2px solid transparent !important;
    border-radius: 8px;
    padding: 8px;
    cursor: pointer;
    transition: all 0.2s;
  }
  .language-button:hover {
    border-color: var(--control-selected) !important;
  }
  .language-button.active {
    border-color: var(--control-selected) !important;
    box-shadow: none !important;
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
  .voice-list-wrapper {
    flex-grow: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    overflow-y: auto;
    max-height: 500px; /* Limit height for voice list */
  }
  .voice-list-wrapper.fade-bottom {
    -webkit-mask-image: linear-gradient(to bottom, black 95%, transparent 100%);
    mask-image: linear-gradient(to bottom, black 95%, transparent 100%);
  }
  .voice-list-wrapper::-webkit-scrollbar {
    width: 8px;
  }
  .voice-list-wrapper::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.02);
    border-radius: 4px;
  }
  .voice-list-wrapper::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.15);
    border-radius: 4px;
  }
  .voice-list-wrapper::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.25);
  }
</style>