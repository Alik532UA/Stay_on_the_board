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
  $: settings = $settingsStore;

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
  function onChange(e) {
    const target = /** @type {HTMLInputElement|HTMLSelectElement} */(e.target);
    const { name, value, type } = target;
    let settingValue;
    if (type === 'checkbox' && 'checked' in target) {
      settingValue = target.checked;
    } else {
      settingValue = value;
    }
    settingsStore.updateSettings({ [name]: settingValue });
  }
  function resetSettings() {
    settingsStore.resetSettings();
  }
</script>

<div class="settings-container" data-testid="settings-page-container">
  <div class="settings-header">
    <FloatingBackButton />
    <h1 class="settings-title">{$_('settings.title')}</h1>
  </div>
  <div class="settings-group">
    <span class="settings-label">{$_('settings.language')}</span>
    <div class="language-selector">
      {#each languages as lang}
        <button class="language-button" class:active={settings.language === lang.code} on:click={() => selectLang(lang.code)} data-testid={`settings-page-language-button-${lang.code}`}>
          {@html lang.svg}
        </button>
      {/each}
    </div>
  </div>
  <hr class="settings-divider" />
  <div class="theme-selector">
    <div class="theme-style-row" data-style="purple">
      <button class="theme-btn" data-theme="light" on:click={() => selectTheme('purple', 'light')} data-testid="settings-page-theme-button-purple-light">☀️</button>
      <span class="theme-name">{$_('mainMenu.themeName.purple')}</span>
      <button class="theme-btn" data-theme="dark" on:click={() => selectTheme('purple', 'dark')} data-testid="settings-page-theme-button-purple-dark">🌙</button>
    </div>
    <div class="theme-style-row" data-style="green">
      <button class="theme-btn" data-theme="light" on:click={() => selectTheme('green', 'light')} data-testid="settings-page-theme-button-green-light">☀️</button>
      <span class="theme-name">{$_('mainMenu.themeName.green')}</span>
      <button class="theme-btn" data-theme="dark" on:click={() => selectTheme('green', 'dark')} data-testid="settings-page-theme-button-green-dark">🌙</button>
    </div>
    <div class="theme-style-row" data-style="blue">
      <button class="theme-btn" data-theme="light" on:click={() => selectTheme('blue', 'light')} data-testid="settings-page-theme-button-blue-light">☀️</button>
      <span class="theme-name">{$_('mainMenu.themeName.blue')}</span>
      <button class="theme-btn" data-theme="dark" on:click={() => selectTheme('blue', 'dark')} data-testid="settings-page-theme-button-blue-dark">🌙</button>
    </div>
    <div class="theme-style-row" data-style="gray">
      <button class="theme-btn" data-theme="light" on:click={() => selectTheme('gray', 'light')} data-testid="settings-page-theme-button-gray-light">☀️</button>
      <span class="theme-name">{$_('mainMenu.themeName.gray')}</span>
      <button class="theme-btn" data-theme="dark" on:click={() => selectTheme('gray', 'dark')} data-testid="settings-page-theme-button-gray-dark">🌙</button>
    </div>
    <div class="theme-style-row" data-style="orange">
      <button class="theme-btn" data-theme="light" on:click={() => selectTheme('orange', 'light')} data-testid="settings-page-theme-button-orange-light">☀️</button>
      <span class="theme-name">{$_('mainMenu.themeName.orange')}</span>
      <button class="theme-btn" data-theme="dark" on:click={() => selectTheme('orange', 'dark')} data-testid="settings-page-theme-button-orange-dark">🌙</button>
    </div>
    <div class="theme-style-row" data-style="wood">
      <button class="theme-btn" data-theme="light" on:click={() => selectTheme('wood', 'light')} data-testid="settings-page-theme-button-wood-light">☀️</button>
      <span class="theme-name">{$_('mainMenu.themeName.wood')}</span>
      <button class="theme-btn" data-theme="dark" on:click={() => selectTheme('wood', 'dark')} data-testid="settings-page-theme-button-wood-dark">🌙</button>
    </div>
  </div>
  <hr class="settings-divider" />
  <div class="settings-option">
    <label class="settings-checkbox" use:customTooltip={$_('settings.showMovesHint')} data-testid="settings-page-show-moves-checkbox">
      <input type="checkbox" name="showMoves" checked={settings.showMoves} on:change={onChange} />
      <span class="checkmark"></span>
      <span>{$_('settings.showMoves')}</span>
    </label>
  </div>
  <div class="settings-option">
    <label class="settings-checkbox" data-testid="settings-page-show-game-mode-modal-checkbox">
      <input type="checkbox" name="showGameModeModal" checked={settings.showGameModeModal} on:change={onChange} />
      <span class="checkmark"></span>
      <span>{$_('settings.showGameModeModal')}</span>
    </label>
  </div>
  <div class="settings-option">
    <label class="settings-checkbox" data-testid="settings-page-show-difficulty-warning-modal-checkbox">
      <input type="checkbox" name="showDifficultyWarningModal" checked={settings.showDifficultyWarningModal} on:change={onChange} />
      <span class="checkmark"></span>
      <span>{$_('settings.showDifficultyWarningModal')}</span>
    </label>
  </div>
  <div class="settings-actions">
    <button class="settings-reset-button" on:click={resetSettings} use:customTooltip={$_('settings.resetHint')} data-testid="settings-page-reset-button">
      <SvgIcons name="reset" />
      <span>{$_('settings.reset')}</span>
    </button>
  </div>
</div>

<style>
  .settings-container {
    max-width: 420px;
    margin: 40px auto;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .settings-header {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 2rem;
  }
  .settings-title {
    font-size: 2em;
    font-weight: 700;
    text-align: center;
    color: var(--text-primary);
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
  select {
    background: var(--control-bg);
    color: var(--text-primary);
    border: 1.5px solid var(--border-color);
    border-radius: 8px;
    padding: 8px 12px;
    transition: all 0.2s;
  }
  select:hover, select:focus {
    border-color: var(--control-selected);
    outline: none;
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
    cursor: pointer;
  }
  .settings-checkbox input {
    display: none;
  }
  .settings-checkbox .checkmark {
    width: 24px;
    height: 24px;
    border: 2px solid var(--border-color);
    border-radius: 6px;
    transition: all 0.2s;
  }
  .settings-checkbox input:checked + .checkmark {
    background: var(--control-selected);
    border-color: var(--control-selected);
  }
  .settings-actions {
    margin-top: 16px;
    display: flex;
    justify-content: center;
  }
  .settings-reset-button {
    background: var(--danger-bg);
    color: var(--danger-text);
    border: none;
    border-radius: 8px;
    padding: 10px 20px;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    transition: background 0.2s;
  }
  .settings-reset-button:hover {
    background: var(--danger-bg-hover);
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
</style>