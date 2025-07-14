<script>
  import '../css/layouts/main-menu.css';
  import { settingsStore } from '../stores/settingsStore.js';
  import { logStore } from '../stores/logStore.js';
  import { goto } from '$app/navigation';
  $: settings = $settingsStore;
  let showThemeDropdown = false;
  let showLangDropdown = false;

  /**
   * @param {string} route
   */
  function navigateTo(route) {
    logStore.addLog(`Навігація: ${route}`, 'info');
    goto(route);
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

  /**
   * @param {string} lang
   */
  function selectLang(lang) {
    logStore.addLog(`Зміна мови: ${lang}`, 'info');
    settingsStore.updateSettings({ language: lang });
    location.reload();
  }
</script>

<main class="main-menu">
  <div class="main-menu-top-icons">
    <button class="main-menu-icon" title="Тема" on:click={() => showThemeDropdown = !showThemeDropdown}>
      <span class="main-menu-icon-inner">🎨</span>
    </button>
    <button class="main-menu-icon" title="Мова" on:click={() => showLangDropdown = !showLangDropdown}>
      <span class="main-menu-icon-inner">
        <svg class="main-menu-icon-svg" width="32" height="24" viewBox="0 0 32 24" fill="none">
          <rect width="32" height="12" y="0" fill="#0057B7"/>
          <rect width="32" height="12" y="12" fill="#FFD700"/>
        </svg>
      </span>
    </button>
    <a class="main-menu-icon" href="#" target="_blank" rel="noopener noreferrer" title="Підтримати проєкт">
      <span class="main-menu-icon-inner">
        <img src="/coin_1fa99.png" alt="Donate" class="main-menu-icon-img" />
      </span>
    </a>
  </div>

  {#if showThemeDropdown}
    <div class="theme-dropdown">
      <div class="theme-style-row" data-style="classic">
        <button on:click={() => selectTheme('classic', 'light')}>☀️ Ubuntu</button>
        <button on:click={() => selectTheme('classic', 'dark')}>🌙 Ubuntu</button>
      </div>
      <div class="theme-style-row" data-style="peak">
        <button on:click={() => selectTheme('peak', 'light')}>☀️ PEAK</button>
        <button on:click={() => selectTheme('peak', 'dark')}>🌙 PEAK</button>
      </div>
      <div class="theme-style-row" data-style="cs2">
        <button on:click={() => selectTheme('cs2', 'light')}>☀️ CS2</button>
        <button on:click={() => selectTheme('cs2', 'dark')}>🌙 CS2</button>
      </div>
      <div class="theme-style-row" data-style="glass">
        <button on:click={() => selectTheme('glass', 'light')}>☀️ Glassmorphism</button>
        <button on:click={() => selectTheme('glass', 'dark')}>🌙 Glassmorphism</button>
      </div>
      <div class="theme-style-row" data-style="material">
        <button on:click={() => selectTheme('material', 'light')}>☀️ Material You</button>
        <button on:click={() => selectTheme('material', 'dark')}>🌙 Material You</button>
      </div>
    </div>
  {/if}

  {#if showLangDropdown}
    <div class="lang-dropdown">
      <button on:click={() => selectLang('uk')}>🇺🇦 Українська</button>
      <button on:click={() => selectLang('en')}>🇬🇧 English</button>
      <button on:click={() => selectLang('crh')}>🏴 Qırımtatarca</button>
      <button on:click={() => selectLang('nl')}>🇳🇱 Nederlands</button>
    </div>
  {/if}

  <div class="main-menu-title">Залишитися на дошці</div>
  <div class="main-menu-subtitle">Меню</div>
  <div id="main-menu-buttons">
    <button class="modal-button secondary" on:click={() => navigateTo('/game')}>Грати з комп'ютером</button>
    <button class="modal-button secondary" on:click={() => navigateTo('/local')}>Локальна гра</button>
    <button class="modal-button secondary" on:click={() => navigateTo('/online')}>Грати онлайн</button>
    <button class="modal-button secondary" on:click={() => navigateTo('/settings')}>Налаштування</button>
    <button class="modal-button secondary" on:click={() => navigateTo('/controls')}>Керування</button>
    <button class="modal-button secondary" on:click={() => navigateTo('/rules')}>Правила</button>
    <button class="modal-button danger" on:click={clearCache}>Очистити кеш</button>
  </div>
</main> 