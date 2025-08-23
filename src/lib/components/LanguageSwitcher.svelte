<script lang="ts">
  import { locale } from 'svelte-i18n';
  import { settingsStore } from '../stores/settingsStore.js';
import { logService } from '$lib/services/logService.js';
  
  let showDropdown = false;
  const languages = [
    { code: 'uk', label: 'Українська', flag: '🇺🇦' },
    { code: 'en', label: 'English', flag: '🇬🇧' },
    { code: 'crh', label: 'Qırımtatarca', flag: '🇹🇷' },
    { code: 'nl', label: 'Nederlands', flag: '🇳🇱' }
  ];
  function selectLang(lang: string) {
    logService.ui(`Зміна мови: ${lang}`);
    settingsStore.updateSettings({ language: lang });
    localStorage.setItem('language', lang);
    locale.set(lang);
    showDropdown = false;
  }
  function toggleDropdown() {
    showDropdown = !showDropdown;
  }
  function closeDropdown() {
    showDropdown = false;
  }
</script>

<div class="language-switcher">
  <button data-testid="lang-dropdown-btn" class="lang-dropdown-btn" aria-label="Вибір мови" on:click={toggleDropdown}>
    🌐
  </button>
  {#if showDropdown}
    <div class="lang-dropdown" role="menu" on:blur={closeDropdown}>
      {#each languages as lang}
        <button data-testid="lang-option-{lang.code}" class="lang-option" on:click={() => selectLang(lang.code)} aria-label={lang.label}>
          <span class="lang-flag">{lang.flag}</span> <span class="lang-label">{lang.label}</span>
        </button>
      {/each}
    </div>
  {/if}
</div>

<style>
.language-switcher {
  position: relative;
  display: inline-block;
}
.lang-dropdown-btn {
  background: none;
  border: none;
  font-size: 2rem;
  cursor: pointer;
  padding: 0.2em 0.5em;
}
.lang-dropdown {
  position: absolute;
  top: 110%;
  left: 0;
  background: #fff;
  border: 1px solid #ccc;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  z-index: 100;
  min-width: 140px;
  padding: 0.3em 0.2em;
  display: flex;
  flex-direction: column;
  gap: 0.2em;
}
.lang-option {
  display: flex;
  align-items: center;
  background: none;
  border: none;
  width: 100%;
  padding: 0.4em 0.7em;
  font-size: 1.1rem;
  cursor: pointer;
  transition: background 0.15s;
  border-radius: 6px;
}
.lang-option:hover, .lang-option:focus {
  background: #f0f0f0;
}
.lang-flag {
  font-size: 1.5rem;
  margin-right: 0.7em;
}
.lang-label {
  font-size: 1rem;
}
</style> 