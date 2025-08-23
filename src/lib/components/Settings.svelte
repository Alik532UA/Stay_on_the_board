<script>
  import { settingsStore } from '../stores/settingsStore.js';
  import { _ } from 'svelte-i18n';
  import SvgIcons from './SvgIcons.svelte';
  import { customTooltip } from '$lib/actions/customTooltip.js';
  import FloatingBackButton from '$lib/components/FloatingBackButton.svelte';
  import { locale } from 'svelte-i18n';
  import '../css/layouts/main-menu.css';
  import { languages } from '$lib/constants.js';
  import { logService } from '$lib/services/logService.js';
  import { clearCache } from '$lib/utils/cacheManager.js';

  $: settings = $settingsStore;

  function handleClearAll() {
    logService.action('Повне очищення кешу');
    clearCache({ keepAppearance: false });
  }

  function handleKeepAppearance() {
    logService.action('Очищення кешу зі збереженням вигляду');
    clearCache({ keepAppearance: true });
  }

  /** @param {string} lang */
  function selectLang(lang) {
    logService.ui(`Зміна мови: ${lang}`);
    settingsStore.updateSettings({ language: lang });
    localStorage.setItem('language', lang);
    locale.set(lang);
  }

  /** @param {Event} e */
  /** @param {string} style @param {string} theme */
  function selectTheme(style, theme) {
    logService.ui(`Зміна теми: ${style}, ${theme}`);
    settingsStore.updateSettings({ style, theme });
  }

  /** @param {Event} e */
  /** @param {string} name */
  function toggleSetting(name) {
    logService.ui(`Зміна налаштування: ${name}`);
    settingsStore.updateSettings({ [name]: !settings[name] });
  }
  function resetSettings() {
    settingsStore.resetSettings();
  }
</script>

<div class="setup-grid">
  <div class="grid-column">
    <div class="settings-card">
      <div class="settings-group" data-testid="settings-page-language-group">
        <span class="settings-label" data-testid="settings-page-language-label">{$_('settings.language')}</span>
        <div class="language-selector" data-testid="settings-page-language-selector">
          {#each languages as lang}
            <button class="language-button" class:active={settings.language === lang.code} on:click={() => selectLang(lang.code)} data-testid={`settings-page-language-button-${lang.code}`}>
              {@html lang.svg}
            </button>
          {/each}
        </div>
      </div>
      <hr class="settings-divider" data-testid="settings-page-divider-1" />
      <div class="theme-selector" data-testid="settings-page-theme-selector">
        <div class="theme-style-row" data-style="purple" data-testid="settings-page-theme-row-purple">
          <button class="theme-btn" data-theme="light" on:click={() => selectTheme('purple', 'light')} data-testid="settings-page-theme-button-purple-light">☀️</button>
          <span class="theme-name" data-testid="settings-page-theme-name-purple">{$_('mainMenu.themeName.purple')}</span>
          <button class="theme-btn" data-theme="dark" on:click={() => selectTheme('purple', 'dark')} data-testid="settings-page-theme-button-purple-dark">🌙</button>
        </div>
        <div class="theme-style-row" data-style="green" data-testid="settings-page-theme-row-green">
          <button class="theme-btn" data-theme="light" on:click={() => selectTheme('green', 'light')} data-testid="settings-page-theme-button-green-light">☀️</button>
          <span class="theme-name" data-testid="settings-page-theme-name-green">{$_('mainMenu.themeName.green')}</span>
          <button class="theme-btn" data-theme="dark" on:click={() => selectTheme('green', 'dark')} data-testid="settings-page-theme-button-green-dark">🌙</button>
        </div>
        <div class="theme-style-row" data-style="blue" data-testid="settings-page-theme-row-blue">
          <button class="theme-btn" data-theme="light" on:click={() => selectTheme('blue', 'light')} data-testid="settings-page-theme-button-blue-light">☀️</button>
          <span class="theme-name" data-testid="settings-page-theme-name-blue">{$_('mainMenu.themeName.blue')}</span>
          <button class="theme-btn" data-theme="dark" on:click={() => selectTheme('blue', 'dark')} data-testid="settings-page-theme-button-blue-dark">🌙</button>
        </div>
        <div class="theme-style-row" data-style="gray" data-testid="settings-page-theme-row-gray">
          <button class="theme-btn" data-theme="light" on:click={() => selectTheme('gray', 'light')} data-testid="settings-page-theme-button-gray-light">☀️</button>
          <span class="theme-name" data-testid="settings-page-theme-name-gray">{$_('mainMenu.themeName.gray')}</span>
          <button class="theme-btn" data-theme="dark" on:click={() => selectTheme('gray', 'dark')} data-testid="settings-page-theme-button-gray-dark">🌙</button>
        </div>
        <div class="theme-style-row" data-style="orange" data-testid="settings-page-theme-row-orange">
          <button class="theme-btn" data-theme="light" on:click={() => selectTheme('orange', 'light')} data-testid="settings-page-theme-button-orange-light">☀️</button>
          <span class="theme-name" data-testid="settings-page-theme-name-orange">{$_('mainMenu.themeName.orange')}</span>
          <button class="theme-btn" data-theme="dark" on:click={() => selectTheme('orange', 'dark')} data-testid="settings-page-theme-button-orange-dark">🌙</button>
        </div>
        <div class="theme-style-row" data-style="wood" data-testid="settings-page-theme-row-wood">
          <button class="theme-btn" data-theme="light" on:click={() => selectTheme('wood', 'light')} data-testid="settings-page-theme-button-wood-light">☀️</button>
          <span class="theme-name" data-testid="settings-page-theme-name-wood">{$_('mainMenu.themeName.wood')}</span>
          <button class="theme-btn" data-theme="dark" on:click={() => selectTheme('wood', 'dark')} data-testid="settings-page-theme-button-wood-dark">🌙</button>
        </div>
      </div>
    </div>
  </div>
  <div class="grid-column">
    <div class="settings-card">
      <div class="settings-section" data-testid="settings-page-game-mode-section">
        <span class="settings-label" data-testid="settings-page-game-mode-label">Режим гри</span>
        <div class="settings-button-group" data-testid="settings-page-game-mode-group">
          <button
            class="settings-group-button"
            class:active={!settings.rememberGameMode}
            on:click={() => {
              settingsStore.updateSettings({ gameMode: null, showGameModeModal: true, rememberGameMode: false });
              if (typeof window !== 'undefined') {
                sessionStorage.removeItem('gameMode');
              }
            }}
            data-testid="settings-page-game-mode-null"
          >
            Вибирати
          </button>
          <button
            class="settings-group-button"
            class:active={settings.rememberGameMode && settings.gameMode === 'beginner'}
            on:click={() => settingsStore.applyGameModePreset('beginner')}
            data-testid="settings-page-game-mode-beginner"
          >
            Новачок
          </button>
          <button
            class="settings-group-button"
            class:active={settings.rememberGameMode && settings.gameMode === 'experienced'}
            on:click={() => settingsStore.applyGameModePreset('experienced')}
            data-testid="settings-page-game-mode-experienced"
          >
            Розбійник
          </button>
          <button
            class="settings-group-button"
            class:active={settings.rememberGameMode && settings.gameMode === 'pro'}
            on:click={() => settingsStore.applyGameModePreset('pro')}
            data-testid="settings-page-game-mode-pro"
          >
            Потужний
          </button>
        </div>
      </div>
      <hr class="settings-divider" data-testid="settings-page-divider-3" />
      <div class="settings-option" data-testid="settings-page-difficulty-warning-option">
        <button
          class="settings-toggle-button"
          class:active={settings.showDifficultyWarningModal}
          on:click={() => toggleSetting('showDifficultyWarningModal')}
          data-testid="settings-page-show-difficulty-warning-modal-toggle"
        >
          {$_('settings.showDifficultyWarningModal')}
        </button>
      </div>
      <hr class="settings-divider" data-testid="settings-page-divider-4" />
      <div class="settings-actions" data-testid="settings-page-actions">
        <button class="settings-reset-button" on:click={resetSettings} use:customTooltip={$_('settings.resetHint')} data-testid="settings-page-reset-button">
          <span>{$_('settings.reset')}</span>
        </button>
        <button data-testid="clear-cache-keep-appearance-btn" class="settings-reset-button" on:click={handleKeepAppearance}>
          <span>{$_('mainMenu.clearCacheModal.keepAppearance')}</span>
        </button>
        <button data-testid="clear-cache-full-clear-btn" class="settings-reset-button danger" on:click={handleClearAll}>
          <span>{$_('mainMenu.clearCacheModal.fullClear')}</span>
        </button>
      </div>
    </div>
  </div>
</div>

<style>
  .setup-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
    align-items: start;
  }

  .grid-column {
    display: flex;
    flex-direction: column;
    gap: 16px;
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
  }

  @media (max-width: 800px) {
    .setup-grid {
      grid-template-columns: 1fr;
    }
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
  .settings-option {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .settings-actions {
    margin-top: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .settings-reset-button.danger {
    background: var(--error-color);
    color: #fff;
  }
  .settings-reset-button.danger:hover {
    background: #a40e26; /* Темніший відтінок червоного для hover */
  }
  .settings-reset-button {
    background: var(--control-bg);
    color: var(--text-primary);
    border: 1.5px solid var(--border-color);
    border-radius: 8px;
    padding: 12px 20px;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    transition: background 0.2s;
    width: 100%;
    min-height: 50px;
  }
  .settings-reset-button:hover {
    border-color: var(--control-selected);
  }
  .language-selector {
    display: flex;
    gap: 8px;
  }
  .language-button {
    background: var(--control-bg);
    border: 2px solid var(--border-color);
    border-radius: 8px;
    padding: 8px;
    cursor: pointer;
    transition: all 0.2s;
  }
  .language-button.active {
    border-color: var(--control-selected);
    box-shadow: 0 0 8px var(--control-selected);
  }
  .settings-toggle-button {
    width: 100%;
    background: var(--control-bg);
    color: var(--text-primary);
    border: 1.5px solid var(--border-color);
    border-radius: 8px;
    padding: 12px;
    text-align: center;
    cursor: pointer;
    transition: all 0.2s;
    font-weight: 600;
  }
  .settings-toggle-button:hover {
    border-color: var(--control-selected);
  }
  .settings-toggle-button.active {
    background: var(--control-selected);
    color: var(--button-text-color, #fff);
    border-color: var(--control-selected);
  }
  .settings-section {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .settings-button-group {
    display: flex;
    gap: 4px;
    width: 100%;
  }

  .settings-group-button {
    flex: 1;
    padding: 10px;
    font-weight: 600;
    cursor: pointer;
    border-radius: 8px;
    border: 1.5px solid var(--border-color);
    background: var(--control-bg);
    color: var(--text-primary);
    transition: all 0.2s;
  }

  .settings-group-button:hover {
    border-color: var(--control-selected);
  }

  .settings-group-button.active {
    background: var(--control-selected);
    color: var(--button-text-color, #fff);
    border-color: var(--control-selected);
  }
</style>