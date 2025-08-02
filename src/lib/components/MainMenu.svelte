<script>
  import '../css/layouts/main-menu.css';
  import { settingsStore } from '$lib/stores/settingsStore.js';
  import { gameState } from '$lib/stores/gameState.js';
  import { navigateToGame } from '$lib/services/uiService.js';
  import { logStore } from '../stores/logStore.js';
  import { goto } from '$app/navigation';
  import { base } from '$app/paths';
  import { _ , isLoading, locale } from 'svelte-i18n';
  import SvgIcons from './SvgIcons.svelte';
  import { appVersion } from '$lib/stores/versionStore.js';
  import { currentLanguageFlagSvg } from '$lib/stores/derivedState.ts';
  import { languages } from '$lib/constants.js';
  import { modalStore } from '$lib/stores/modalStore.js';
  import { clearCache } from '$lib/utils/cacheManager.js';
  import { requestGameModeModal } from '$lib/stores/uiStore.js';
  import ClearCacheOptions from './ClearCacheOptions.svelte';
  import { onMount } from 'svelte';
  import { get } from 'svelte/store';
  import { modalService } from '$lib/services/modalService.js';
  import GameModeModal from '$lib/components/GameModeModal.svelte';

  let showLangDropdown = false;
  let showThemeDropdown = false;
  let showWipNotice = false;
  let showDevMenu = false; // <-- НОВА ЗМІННА СТАНУ

  /** @param {string} lang */
  function selectLang(lang) {
    logStore.addLog(`Зміна мови: ${lang}`, 'info');
    settingsStore.updateSettings({ language: lang });
    localStorage.setItem('language', lang);
    locale.set(lang);
    showLangDropdown = false;
  }
  function toggleLangDropdown() { showLangDropdown = !showLangDropdown; }
  function openWipNotice() { showWipNotice = true; }
  $: settings = $settingsStore;

  /** @param {string} route */
  function navigateTo(route) {
    logStore.addLog(`Навігація: ${route}`, 'info');
    goto(`${base}${route}`);
  }

  function showClearCacheModal() {
    modalStore.showModal({
      titleKey: 'mainMenu.clearCacheModal.title',
      component: ClearCacheOptions,
      buttons: [
        { textKey: 'modal.cancel', onClick: modalStore.closeModal }
      ]
    });
  }

  /** @param {string} style @param {string} theme */
  function selectTheme(style, theme) {
    logStore.addLog(`Зміна теми: ${style}, ${theme}`, 'info');
    settingsStore.updateSettings({ style, theme });
    showThemeDropdown = false;
  }

  function closeDropdowns() {
    showThemeDropdown = false;
    showLangDropdown = false;
    showWipNotice = false;
    showDevMenu = false; // <-- ДОДАНО
  }

  let isDev = false;
  onMount(() => { isDev = !!import.meta.env.DEV; });
</script>

<main class="main-menu">
  {#if $isLoading}
    <div class="main-menu-loading">Завантаження перекладу...</div>
  {:else}
    <div class="main-menu-top-icons">
      <button class="main-menu-icon" title={$_('mainMenu.theme')} aria-label={$_('mainMenu.theme')} onclick={() => showThemeDropdown = !showThemeDropdown}>
        <span class="main-menu-icon-inner">
          <SvgIcons name="theme" />
        </span>
      </button>
      <button class="main-menu-icon" title={$_('mainMenu.language')} aria-label={$_('mainMenu.language')} onclick={toggleLangDropdown}>
        <span class="main-menu-icon-inner">
          {@html $currentLanguageFlagSvg}
        </span>
      </button>
      {#if showLangDropdown}
        <div class="lang-dropdown main-menu-lang-dropdown" role="dialog" aria-modal="true" tabindex="0" onclick={(e) => { e.stopPropagation(); }} onkeydown={(e) => (e.key === 'Escape') && (showLangDropdown = false)}>
          {#each languages as lang (lang.code)}
            <button class="lang-option" onclick={() => selectLang(lang.code)} aria-label={lang.code}>
              {@html lang.svg}
            </button>
          {/each}
        </div>
      {/if}
      <button class="main-menu-icon" title={$_('mainMenu.donate')} aria-label={$_('mainMenu.donate')} onclick={() => navigateTo('/supporters')}>
        <span class="main-menu-icon-inner">
          <SvgIcons name="donate" />
        </span>
      </button>
    </div>

    {#if showThemeDropdown || showLangDropdown || showWipNotice || showDevMenu}
      <div class="screen-overlay-backdrop" role="button" tabindex="0" aria-label={$_('mainMenu.closeDropdowns')} onclick={closeDropdowns} onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && closeDropdowns()}>
      </div>
    {/if}

    {#if showDevMenu}
      <div class="dev-menu" role="dialog" tabindex="0" onclick={(e) => { e.stopPropagation(); }} onkeydown={(e) => (e.key === 'Escape') && (showDevMenu = false)}>
        <h3>dev</h3>
        <button class="modal-button secondary" onclick={() => { navigateTo('/drag-and-drop-test'); showDevMenu = false; }}>
          {$_('mainMenu.dragAndDropTest')}
        </button>
        <!-- Сюди можна додавати нові dev-кнопки -->
      </div>
    {/if}

    {#if showWipNotice}
      <div class="wip-notice-overlay" role="dialog" tabindex="0" onclick={(e) => { e.stopPropagation(); }} onkeydown={(e) => (e.key === 'Escape') && closeDropdowns()}>
        <div class="wip-notice-content">
          <button class="wip-close-btn" onclick={closeDropdowns}>×</button>
          <h3>{$_('mainMenu.wipNotice.title')}</h3>
          <p>{$_('mainMenu.wipNotice.description')}</p>
          <button class="wip-donate-btn" onclick={() => window.open('https://send.monobank.ua/jar/8TPmFKQTCK', '_blank', 'noopener,noreferrer')}>
            {$_('mainMenu.donate')}
          </button>
        </div>
      </div>
    {/if}

    {#if showThemeDropdown}
      <div class="theme-dropdown" role="dialog" tabindex="0" aria-modal="true" aria-label={$_('mainMenu.themeDropdown')} onclick={(e) => { e.stopPropagation(); }} onkeydown={(e) => (e.key === 'Escape') && closeDropdowns()}>
        <div class="theme-style-row" data-style="purple">
          <button class="theme-btn" data-theme="light" onclick={() => selectTheme('purple', 'light')}>☀️</button>
          <span class="theme-name">{$_('mainMenu.themeName.purple')}</span>
          <button class="theme-btn" data-theme="dark" onclick={() => selectTheme('purple', 'dark')}>🌙</button>
        </div>
        <div class="theme-style-row" data-style="green">
          <button class="theme-btn" data-theme="light" onclick={() => selectTheme('green', 'light')}>☀️</button>
          <span class="theme-name">{$_('mainMenu.themeName.green')}</span>
          <button class="theme-btn" data-theme="dark" onclick={() => selectTheme('green', 'dark')}>🌙</button>
        </div>
        <div class="theme-style-row" data-style="blue">
          <button class="theme-btn" data-theme="light" onclick={() => selectTheme('blue', 'light')}>☀️</button>
          <span class="theme-name">{$_('mainMenu.themeName.blue')}</span>
          <button class="theme-btn" data-theme="dark" onclick={() => selectTheme('blue', 'dark')}>🌙</button>
        </div>
        <div class="theme-style-row" data-style="gray">
          <button class="theme-btn" data-theme="light" onclick={() => selectTheme('gray', 'light')}>☀️</button>
          <span class="theme-name">{$_('mainMenu.themeName.gray')}</span>
          <button class="theme-btn" data-theme="dark" onclick={() => selectTheme('gray', 'dark')}>🌙</button>
        </div>
        <div class="theme-style-row" data-style="orange">
          <button class="theme-btn" data-theme="light" onclick={() => selectTheme('orange', 'light')}>☀️</button>
          <span class="theme-name">{$_('mainMenu.themeName.orange')}</span>
          <button class="theme-btn" data-theme="dark" onclick={() => selectTheme('orange', 'dark')}>🌙</button>
        </div>
        <div class="theme-style-row" data-style="wood">
          <button class="theme-btn" data-theme="light" onclick={() => selectTheme('wood', 'light')}>☀️</button>
          <span class="theme-name">{$_('mainMenu.themeName.wood')}</span>
          <button class="theme-btn" data-theme="dark" onclick={() => selectTheme('wood', 'dark')}>🌙</button>
        </div>
      </div>
    {/if}

    <div class="main-menu-title">{$_('mainMenu.title')}</div>
    <div class="main-menu-subtitle">
      {$_('mainMenu.menu')}
      {#if isDev}
        <span class="dev-version" role="button" tabindex="0" onclick={() => showDevMenu = !showDevMenu} onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && (showDevMenu = !showDevMenu)}>
          dev v.{$appVersion}
        </span>
      {/if}
    </div>
    <div id="main-menu-buttons">
      <button class="modal-button secondary" onclick={navigateToGame}>{$_('mainMenu.playVsComputer')}</button>
      <button class="modal-button secondary pseudo-disabled" onclick={openWipNotice}>{$_('mainMenu.localGame')}</button>
      <button class="modal-button secondary pseudo-disabled" onclick={openWipNotice}>{$_('mainMenu.playOnline')}</button>
      <!-- <button class="modal-button secondary" on:click={() => navigateTo('/settings')}>{$_('mainMenu.settings')}</button> -->
      <button class="modal-button secondary" onclick={() => navigateTo('/controls')}>{$_('mainMenu.controls')}</button>
      <button class="modal-button secondary" onclick={() => navigateTo('/rules')}>{$_('mainMenu.rules')}</button>
      <button class="modal-button secondary" onclick={() => navigateTo('/supporters')}>{$_('mainMenu.supporters')}</button>
      <button class="modal-button danger" onclick={showClearCacheModal}>{$_('mainMenu.clearCache')}</button>
    </div>
  {/if}
</main>

<style>
  .dev-version {
    font-size: 0.7em;
    opacity: 0.7;
    margin-left: 8px;
    font-weight: normal;
    color: var(--text-accent);
    cursor: pointer;
    user-select: none;
  }
  .dev-version:hover {
    text-decoration: underline;
  }
  .dev-menu {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 10000;
    background: var(--bg-secondary);
    color: var(--text-primary);
    padding: 24px;
    border-radius: 16px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.3);
    border: 1px solid rgba(255, 255, 255, 0.1);
    display: flex;
    flex-direction: column;
    gap: 16px;
    min-width: 280px;
  }
  .dev-menu h3 {
    margin: 0;
    text-align: center;
    font-size: 1.5em;
    color: var(--text-accent);
  }
  .wip-donate-btn {
    background: var(--warning-action-bg);
    color: var(--warning-action-text);
    border: none;
    border-radius: 10px;
    padding: 12px 32px;
    font-weight: bold;
    cursor: pointer;
    font-size: 1.1em;
    transition: all 0.2s ease;
  }
</style>