<script>
  import '../css/layouts/main-menu.css';
  import { settingsStore } from '../stores/settingsStore.js';
  import { logStore } from '$lib/stores/logStore.js';
  import { goto } from '$app/navigation';
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
</script>