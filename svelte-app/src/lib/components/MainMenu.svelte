<script>
  import '../css/layouts/main-menu.css';
  import { settingsStore } from '$lib/stores/settingsStore.js';
  import { logStore } from '../stores/logStore.js';
  import { goto } from '$app/navigation';
  import { base } from '$app/paths';
  import { _ , isLoading, locale } from 'svelte-i18n';
  import SvgIcons from './SvgIcons.svelte';
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
    document.documentElement.setAttribute('data-style', style);
    document.documentElement.setAttribute('data-theme', theme);
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
          <svg class="main-menu-icon-svg" width="32" height="24" viewBox="0 0 32 24" fill="none">
            <rect width="32" height="12" y="0" fill="#0057B7"/>
            <rect width="32" height="12" y="12" fill="#FFD700"/>
          </svg>
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
      <button class="main-menu-icon" title={$_('mainMenu.donate')} aria-label={$_('mainMenu.donate')} on:click={() => window.open('https://send.monobank.ua/jar/8TPmFKQTCK', '_blank', 'noopener,noreferrer')}>
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
        <div class="theme-style-row" data-style="ubuntu">
          <button class="theme-btn" data-theme="light" on:click={() => selectTheme('ubuntu', 'light')}>☀️</button>
          <span class="theme-name">{$_('mainMenu.themeName.ubuntu')}</span>
          <button class="theme-btn" data-theme="dark" on:click={() => selectTheme('ubuntu', 'dark')}>🌙</button>
        </div>
        <div class="theme-style-row" data-style="peak">
          <button class="theme-btn" data-theme="light" on:click={() => selectTheme('peak', 'light')}>☀️</button>
          <span class="theme-name">{$_('mainMenu.themeName.peak')}</span>
          <button class="theme-btn" data-theme="dark" on:click={() => selectTheme('peak', 'dark')}>🌙</button>
        </div>
        <div class="theme-style-row" data-style="cs2">
          <button class="theme-btn" data-theme="light" on:click={() => selectTheme('cs2', 'light')}>☀️</button>
          <span class="theme-name">{$_('mainMenu.themeName.cs2')}</span>
          <button class="theme-btn" data-theme="dark" on:click={() => selectTheme('cs2', 'dark')}>🌙</button>
        </div>
        <div class="theme-style-row" data-style="glass">
          <button class="theme-btn" data-theme="light" on:click={() => selectTheme('glass', 'light')}>☀️</button>
          <span class="theme-name">{$_('mainMenu.themeName.glass')}</span>
          <button class="theme-btn" data-theme="dark" on:click={() => selectTheme('glass', 'dark')}>🌙</button>
        </div>
        <div class="theme-style-row" data-style="material">
          <button class="theme-btn" data-theme="light" on:click={() => selectTheme('material', 'light')}>☀️</button>
          <span class="theme-name">{$_('mainMenu.themeName.material')}</span>
          <button class="theme-btn" data-theme="dark" on:click={() => selectTheme('material', 'dark')}>🌙</button>
        </div>
      </div>
    {/if}

    <div class="main-menu-title">{$_('mainMenu.title')}</div>
    <div class="main-menu-subtitle">{$_('mainMenu.menu')}</div>
    <div id="main-menu-buttons">
      <button class="modal-button secondary" on:click={() => navigateTo('/game')}>{$_('mainMenu.playVsComputer')}</button>
      <button class="modal-button secondary pseudo-disabled" on:click={openWipNotice}>{$_('mainMenu.localGame')}</button>
      <button class="modal-button secondary pseudo-disabled" on:click={openWipNotice}>{$_('mainMenu.playOnline')}</button>
      <!-- <button class="modal-button secondary" on:click={() => navigateTo('/settings')}>{$_('mainMenu.settings')}</button> -->
      <button class="modal-button secondary" on:click={() => navigateTo('/controls')}>{$_('mainMenu.controls')}</button>
      <button class="modal-button secondary" on:click={() => navigateTo('/rules')}>{$_('mainMenu.rules')}</button>
      <button class="modal-button danger" on:click={clearCache}>{$_('mainMenu.clearCache')}</button>
    </div>
  {/if}
</main>