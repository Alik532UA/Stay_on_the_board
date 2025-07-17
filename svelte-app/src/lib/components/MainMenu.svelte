<script>
  import '../css/layouts/main-menu.css';
  import { settingsStore } from '$lib/stores/settingsStore.js';
  import { logStore } from '../stores/logStore.js';
  import { goto } from '$app/navigation';
  import { base } from '$app/paths';
  import { _ , isLoading, locale } from 'svelte-i18n';
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
          <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" id="Layer_1" viewBox="0 0 512 512" xml:space="preserve">
            <path style="fill:#FFC033;" d="M491.09,328.459c-10.239-17.809-28.826-27.937-51.199-27.937c-28.737,0-47.726-21.359-48.085-44.522  c-0.111-9.906,3.228-20.035,10.685-28.828c8.459-10.017,20.815-15.694,33.837-15.694c24.598,0,44.522-10.351,54.872-28.271  c9.796-17.03,9.685-38.4-0.333-55.652C445.122,48.863,360.307,0,269.373,0C146.938,0,41.421,86.15,18.381,204.911  c-3.338,17.03-5.009,34.059-4.896,51.089v0.668c0.223,58.991,20.48,116.313,58.435,162.282C120.671,478.052,192.685,512,269.374,512  c91.157,0,176.085-49.085,221.717-128C500.997,366.859,500.997,345.6,491.09,328.459z M292.745,104.181  c13.803-23.93,44.3-32.278,68.452-18.365c23.93,13.803,32.167,44.412,18.365,68.452c-13.803,23.819-44.412,32.167-68.452,18.254  C287.18,158.72,278.945,128.223,292.745,104.181z"/>
            <path style="fill:#F9A926;" d="M71.919,418.95C120.67,478.052,192.684,512,269.373,512c91.157,0,176.085-49.085,221.717-128  c9.907-17.141,9.907-38.4,0-55.541c-10.239-17.809-28.826-27.937-51.199-27.937c-28.737,0-47.726-21.359-48.085-44.522H13.483v0.668  C13.707,315.659,33.963,372.981,71.919,418.95z"/>
            <path style="fill:#88CC2A;" d="M124.677,306.087c-27.619,0-50.087-22.468-50.087-50.087s22.468-50.087,50.087-50.087  s50.087,22.468,50.087,50.087S152.296,306.087,124.677,306.087z"/>
            <path style="fill:#736056;" d="M171.981,420.609c-23.923-13.802-32.21-44.397-18.326-68.424  c13.695-23.726,44.21-32.294,68.413-18.321c23.922,13.801,32.21,44.392,18.326,68.419  C226.622,426.154,196.056,434.511,171.981,420.609z"/>
            <path style="fill:#37AFCC;" d="M323.198,431.18c-26.712-7.156-42.599-34.587-35.424-61.342c7.175-26.741,34.59-42.578,61.336-35.413  c12.924,3.456,23.728,11.745,30.413,23.326l0,0c6.696,11.587,8.478,25.087,5.011,38.016  C377.349,422.55,349.888,438.339,323.198,431.18z"/>
            <path style="fill:#E6563A;" d="M153.655,159.81c-13.855-23.966-5.651-54.579,18.326-68.424  c24.013-13.841,54.599-5.613,68.413,18.332l0,0c13.877,24.016,5.607,54.605-18.326,68.424  C197.941,192.057,167.398,183.631,153.655,159.81z"/>
            <path style="fill:#7FB335;" d="M124.677,306.087c27.619,0,50.087-22.468,50.087-50.087H74.59  C74.59,283.619,97.057,306.087,124.677,306.087z"/>
          </svg>
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
          <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" id="Capa_1" viewBox="0 0 58 58" xml:space="preserve">
            <g id="XMLID_90_">
              <path id="XMLID_122_" style="fill:#F4BF1A;" d="M43.918,44.203C33.805,54.316,18.832,56.016,9.069,48.646   c0.599,0.793,1.25,1.556,1.969,2.275c9.567,9.567,26.188,8.459,37.123-2.475c10.934-10.935,12.042-27.556,2.474-37.123   c-0.718-0.719-1.481-1.37-2.274-1.969C55.731,19.117,54.031,34.09,43.918,44.203"/>
              <path id="XMLID_121_" style="fill:#FFD949;" d="M46.393,7.08c9.568,9.568,8.46,26.188-2.475,37.123   C32.983,55.138,16.363,56.246,6.795,46.678C-2.773,37.11-1.665,20.49,9.27,9.555C20.205-1.38,36.825-2.488,46.393,7.08"/>
              <path id="XMLID_89_" style="fill:#F4BF1A;" d="M23.091,49.188c-5.243,0-10.025-1.896-13.468-5.338   c-7.993-7.993-6.883-22.109,2.475-31.466c4.965-4.966,11.525-7.813,17.998-7.813c5.243,0,10.025,1.896,13.468,5.338   c7.993,7.993,6.883,22.109-2.475,31.466C36.125,46.339,29.565,49.188,23.091,49.188"/>
              <path id="XMLID_119_" style="fill:#DCA815;" d="M44.596,43.467l4.256,4.256c0.461-0.49,0.906-0.989,1.329-1.499l-4.249-4.249   C45.509,42.484,45.056,42.977,44.596,43.467"/>
              <path id="XMLID_118_" style="fill:#DCA815;" d="M40.895,46.837l4.258,4.258c0.525-0.407,1.039-0.837,1.544-1.284l-4.251-4.251   C41.939,46.007,41.421,46.429,40.895,46.837"/>
              <path id="XMLID_117_" style="fill:#DCA815;" d="M47.746,39.545l4.255,4.255c0.386-0.57,0.752-1.148,1.095-1.733l-4.246-4.246   C48.506,38.406,48.131,38.978,47.746,39.545"/>
              <path id="XMLID_116_" style="fill:#DCA815;" d="M50.29,35.018l4.26,4.259c0.301-0.662,0.573-1.331,0.822-2.005l-4.254-4.254   C50.869,33.691,50.59,34.357,50.29,35.018"/>
              <path id="XMLID_115_" style="fill:#DCA815;" d="M36.62,49.633l4.256,4.256c0.603-0.326,1.201-0.668,1.789-1.04l-4.259-4.258   C37.818,48.962,37.223,49.307,36.62,49.633"/>
              <path id="XMLID_114_" style="fill:#DCA815;" d="M31.683,51.767l4.255,4.255c0.693-0.228,1.384-0.478,2.068-0.761l-4.254-4.253   C33.068,51.29,32.378,51.54,31.683,51.767"/>
              <path id="XMLID_113_" style="fill:#DCA815;" d="M24.555,53.125l4.259,4.259c0.851-0.048,1.706-0.137,2.561-0.267l-4.261-4.261   C26.259,52.985,25.406,53.078,24.555,53.125"/>
              <path id="XMLID_112_" style="fill:#DCA815;" d="M16.688,52.328l4.27,4.27c1.14,0.306,2.306,0.527,3.49,0.663l-4.268-4.269   C18.995,52.854,17.829,52.636,16.688,52.328"/>
              <path id="XMLID_111_" style="fill:#DCA815;" d="M52.368,28.611l4.252,4.252c0.162-0.818,0.287-1.637,0.373-2.455l-4.257-4.257   C52.65,26.971,52.529,27.791,52.368,28.611"/>
              <path id="XMLID_88_" style="fill:#DCA815;" d="M57.103,26.275c-0.057-1.079-0.176-2.148-0.37-3.198l-4.281-4.281   c0.199,1.065,0.352,2.142,0.409,3.237L57.103,26.275z"/>
              <path id="XMLID_109_" style="fill:#D1D4D2;" d="M5.715,57c-2.757,0-5-2.243-5-5c0-0.552,0.448-1,1-1c0.552,0,1,0.448,1,1   c0,1.654,1.346,3,3,3c0.552,0,1,0.448,1,1C6.715,56.552,6.267,57,5.715,57"/>
              <path id="XMLID_108_" style="fill:#D1D4D2;" d="M55.715,7c-0.552,0-1-0.448-1-1c0-2.206-1.346-4-3-4c-0.552,0-1-0.448-1-1   c0-0.552,0.448-1,1-1c2.757,0,5,2.691,5,6C56.715,6.552,56.267,7,55.715,7"/>
              <path id="XMLID_107_" style="fill:#D1D4D2;" d="M45.715,56c-0.552,0-1-0.448-1-1c0-0.552,0.448-1,1-1c4.962,0,9-4.038,9-9   c0-0.552,0.448-1,1-1c0.552,0,1,0.448,1,1C56.715,51.065,51.78,56,45.715,56"/>
              <path id="XMLID_106_" style="fill:#D1D4D2;" d="M52.715,58c-0.552,0-1-0.448-1-1c0-0.552,0.448-1,1-1c1.626,0,3-0.916,3-2   c0-0.552,0.448-1,1-1c0.552,0,1,0.448,1,1C57.715,56.206,55.472,58,52.715,58"/>
              <path id="XMLID_105_" style="fill:#FFD949;" d="M38.226,22.875c-0.239-5.821-4.527-8.069-11.098-8.076   c-0.291,0-0.577,0.009-0.858,0.028c-2.047,0.135-3.953-0.19-5.331-1.122c-0.556-0.377-1-0.772-1.281-1.185   c-0.127-0.188-0.48-0.058-0.499,0.182c-0.032,0.414-0.054,0.899-0.046,1.433c0.028,2.023-0.173,1.722-1.405,3.631   c-0.681,1.056-1.225,2.24-1.63,3.513c-0.896,0.366-1.625,1.151-1.834,2.117l-0.276,1.281c-0.25,1.158,0.302,2.248,1.291,2.733   c0.151,2.882,1.216,5.46,3.774,7.265l-0.321,1.742c-0.083,0.45-0.408,0.802-0.835,0.907l-5.97,1.455   c-1.552,0.456-2.739,1.821-3.131,3.59L8.683,42.79c0.305,0.358,0.603,0.722,0.941,1.059c3.442,3.443,8.225,5.339,13.468,5.339   c4.467,0,8.976-1.358,12.974-3.831l-6.81-5.255c-0.446-0.345-0.681-0.872-0.611-1.368l0.273-1.958   c3.822-0.673,6.344-3.058,7.814-6.34c1.714-0.197,3.097-1.321,3.242-2.841l0.159-1.674C40.254,24.656,39.452,23.508,38.226,22.875"/>
            </g>
            </svg>
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