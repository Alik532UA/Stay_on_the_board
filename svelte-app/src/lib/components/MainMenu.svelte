<script>
  import '../css/layouts/main-menu.css';
  import { settingsStore } from '$lib/stores/settingsStore.js';
  import { logStore } from '../stores/logStore.js';
  import { goto } from '$app/navigation';
  import { base } from '$app/paths';
  import { _ , isLoading, locale } from 'svelte-i18n';
  import SvgIcons from './SvgIcons.svelte';
  import { appVersion } from '$lib/stores/versionStore.js';
  // Language dropdown logic (inline, замість LanguageSwitcher)
  let showLangDropdown = false;
  const languages = [
    { code: 'uk', svg: `<svg width="32" height="24" viewBox="0 0 32 24"><rect width="32" height="12" y="0" fill="#0057B7"/><rect width="32" height="12" y="12" fill="#FFD700"/></svg>` },
    { code: 'en', svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 30" width="32" height="24">
	<clipPath id="t">
		<path d="M25,15h25v15zv15h-25zh-25v-15zv-15h25z"/>
	</clipPath>
	<path d="M0,0v30h50v-30z" fill="#012169"/>
	<path d="M0,0 50,30M50,0 0,30" stroke="#fff" stroke-width="6"/>
	<path d="M0,0 50,30M50,0 0,30" clip-path="url(#t)" stroke="#C8102E" stroke-width="4"/>
	<path d="M-1 11h22v-12h8v12h22v8h-22v12h-8v-12h-22z" fill="#C8102E" stroke="#FFF" stroke-width="2"/>
</svg>` },
    { code: 'crh', svg: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="24" viewBox="0 0 350 195"><path fill="#00a3dd" d="M0 0h350v195H0z"/><path d="M40 30v30H30v10h20V40h20v30H60v10h30V70H80V40h20v30h20V60h-10V30Z" style="fill:#f8d80e"/></svg>` },
    { code: 'nl', svg: `<svg width="32" height="24" viewBox="0 0 32 24"><rect width="32" height="8" y="0" fill="#21468b"/><rect width="32" height="8" y="8" fill="#fff"/><rect width="32" height="8" y="16" fill="#ae1c28"/></svg>` }
  ];
  /** @param {string} lang */
  function selectLang(lang) {
    logStore.addLog(`Зміна мови: ${lang}`, 'info');
    settingsStore.updateSettings({ language: lang });
    localStorage.setItem('language', lang);
    locale.set(lang);
    showLangDropdown = false;
  }
  function toggleLangDropdown() {
    showLangDropdown = !showLangDropdown;
  }
  function closeLangDropdown() {
    showLangDropdown = false;
  }
  $: settings = $settingsStore;
  let showThemeDropdown = false;
  let showWipNotice = false;
  function openWipNotice() { showWipNotice = true; }
  function closeWipNotice() { showWipNotice = false; }
  $: currentFlagSvg = languages.find(lang => lang.code === $settingsStore.language)?.svg || languages[0].svg;

  /**
   * @param {string} route
   */
  function navigateTo(route) {
    logStore.addLog(`Навігація: ${route}`, 'info');
    goto(`${base}${route}`);
  }

  function clearCache() {
    logStore.addLog('Очищення кешу та перезавантаження сторінки', 'info');
    localStorage.clear();
    location.reload();
  }

  /**
   * @param {string} style
   * @param {string} theme
   */
  function selectTheme(style, theme) {
    logStore.addLog(`Зміна теми: ${style}, ${theme}`, 'info');
    settingsStore.updateSettings({ style, theme });
    showThemeDropdown = false;
  }

  function closeDropdowns() {
    showThemeDropdown = false;
    showLangDropdown = false;
    closeWipNotice(); // Додаємо закриття повідомлення
  }
</script>

<main class="main-menu">
  {#if $isLoading}
    <div class="main-menu-loading">Завантаження перекладу...</div>
  {:else}
    <div class="main-menu-top-icons">
      <button class="main-menu-icon" title={$_('mainMenu.theme')} aria-label={$_('mainMenu.theme')} on:click={() => showThemeDropdown = !showThemeDropdown}>
        <span class="main-menu-icon-inner">
          <SvgIcons name="theme" />
        </span>
      </button>
      <button class="main-menu-icon" title={$_('mainMenu.language')} aria-label={$_('mainMenu.language')} on:click={toggleLangDropdown}>
        <span class="main-menu-icon-inner">
          {@html currentFlagSvg}
        </span>
      </button>
      {#if showLangDropdown}
        <div class="lang-dropdown main-menu-lang-dropdown" role="dialog" aria-modal="true">
          {#each languages as lang}
            <button class="lang-option" on:click={() => selectLang(lang.code)} aria-label={lang.code}>
              {@html lang.svg}
            </button>
          {/each}
        </div>
      {/if}
      <button class="main-menu-icon" title={$_('mainMenu.donate')} aria-label={$_('mainMenu.donate')} on:click={() => navigateTo('/supporters')}>
        <span class="main-menu-icon-inner">
          <SvgIcons name="donate" />
        </span>
      </button>
    </div>

    {#if showThemeDropdown || showLangDropdown || showWipNotice}
      <div class="screen-overlay-backdrop" role="button" tabindex="0" aria-label={$_('mainMenu.closeDropdowns')} on:click={closeDropdowns} on:keydown={(e) => (e.key === 'Enter' || e.key === ' ') && closeDropdowns()}></div>
    {/if}

    {#if showWipNotice}
      <div class="wip-notice-overlay" on:click|stopPropagation>
        <div class="wip-notice-content">
          <button class="wip-close-btn" on:click={closeWipNotice}>&times;</button>
          <h3>{$_('mainMenu.wipNotice.title')}</h3>
          <p>{$_('mainMenu.wipNotice.description')}</p>
          <button class="wip-donate-btn" on:click={() => window.open('https://send.monobank.ua/jar/8TPmFKQTCK', '_blank', 'noopener,noreferrer')}>
            {$_('mainMenu.donate')}
          </button>
        </div>
      </div>
    {/if}

    {#if showThemeDropdown}
      <div class="theme-dropdown" role="dialog" aria-modal="true" aria-label={$_('mainMenu.themeDropdown')} on:click|stopPropagation on:keydown={(e) => (e.key === 'Escape') && closeDropdowns()}>
        <div class="theme-style-row" data-style="purple">
          <button class="theme-btn" data-theme="light" on:click={() => selectTheme('purple', 'light')}>☀️</button>
          <span class="theme-name">{$_('mainMenu.themeName.purple')}</span>
          <button class="theme-btn" data-theme="dark" on:click={() => selectTheme('purple', 'dark')}>🌙</button>
        </div>
        <div class="theme-style-row" data-style="green">
          <button class="theme-btn" data-theme="light" on:click={() => selectTheme('green', 'light')}>☀️</button>
          <span class="theme-name">{$_('mainMenu.themeName.green')}</span>
          <button class="theme-btn" data-theme="dark" on:click={() => selectTheme('green', 'dark')}>🌙</button>
        </div>
        <div class="theme-style-row" data-style="blue">
          <button class="theme-btn" data-theme="light" on:click={() => selectTheme('blue', 'light')}>☀️</button>
          <span class="theme-name">{$_('mainMenu.themeName.blue')}</span>
          <button class="theme-btn" data-theme="dark" on:click={() => selectTheme('blue', 'dark')}>🌙</button>
        </div>
        <div class="theme-style-row" data-style="gray">
          <button class="theme-btn" data-theme="light" on:click={() => selectTheme('gray', 'light')}>☀️</button>
          <span class="theme-name">{$_('mainMenu.themeName.gray')}</span>
          <button class="theme-btn" data-theme="dark" on:click={() => selectTheme('gray', 'dark')}>🌙</button>
        </div>
        <div class="theme-style-row" data-style="orange">
          <button class="theme-btn" data-theme="light" on:click={() => selectTheme('orange', 'light')}>☀️</button>
          <span class="theme-name">{$_('mainMenu.themeName.orange')}</span>
          <button class="theme-btn" data-theme="dark" on:click={() => selectTheme('orange', 'dark')}>🌙</button>
        </div>
        <div class="theme-style-row" data-style="wood">
          <button class="theme-btn" data-theme="light" on:click={() => selectTheme('wood', 'light')}>☀️</button>
          <span class="theme-name">{$_('mainMenu.themeName.wood')}</span>
          <button class="theme-btn" data-theme="dark" on:click={() => selectTheme('wood', 'dark')}>🌙</button>
        </div>
      </div>
    {/if}

    <div class="main-menu-title">{$_('mainMenu.title')}</div>
    <div class="main-menu-subtitle">
      {$_('mainMenu.menu')}
      {#if import.meta.env.DEV && $appVersion}
        <span class="dev-version">dev v.{$appVersion}</span>
      {/if}
    </div>
    <div id="main-menu-buttons">
      <button class="modal-button secondary" on:click={() => navigateTo('/game')}>{$_('mainMenu.playVsComputer')}</button>
      <button class="modal-button secondary pseudo-disabled" on:click={openWipNotice}>{$_('mainMenu.localGame')}</button>
      <button class="modal-button secondary pseudo-disabled" on:click={openWipNotice}>{$_('mainMenu.playOnline')}</button>
      <!-- <button class="modal-button secondary" on:click={() => navigateTo('/settings')}>{$_('mainMenu.settings')}</button> -->
      <button class="modal-button secondary" on:click={() => navigateTo('/controls')}>{$_('mainMenu.controls')}</button>
      <button class="modal-button secondary" on:click={() => navigateTo('/rules')}>{$_('mainMenu.rules')}</button>
      <button class="modal-button secondary" on:click={() => navigateTo('/supporters')}>{$_('mainMenu.supporters')}</button>
      <button class="modal-button danger" on:click={clearCache}>{$_('mainMenu.clearCache')}</button>
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