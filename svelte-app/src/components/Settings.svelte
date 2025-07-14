<script>
  import { settingsStore } from '../stores/settingsStore.js';
  import { _ } from 'svelte-i18n';
  import LanguageSwitcher from './LanguageSwitcher.svelte';
  $: settings = $settingsStore;

  /**
   * @param {Event} e
   */
  function onChange(e) {
    const target = /** @type {HTMLInputElement|HTMLSelectElement} */(e.target);
    const { name, value, type } = target;
    const checked = type === 'checkbox' && 'checked' in target ? target.checked : undefined;
    settingsStore.updateSettings({ [name]: type === 'checkbox' ? checked : value });
  }
</script>

<div class="settings">
  <h2>{$_('settings.title')}</h2>
  <LanguageSwitcher />
  <form class="settings-form">
    <label>
      <input type="checkbox" name="showMoves" checked={settings.showMoves} on:change={onChange} /> {$_('settings.showMoves')}
    </label>
    <br /><br />
    <!-- Language selection removed: now handled by LanguageSwitcher -->
    <label>
      {$_('settings.theme')}:
      <select name="theme" bind:value={settings.theme} on:change={onChange}>
        <option value="dark">{$_('settings.themeDark')}</option>
        <option value="light">{$_('settings.themeLight')}</option>
      </select>
    </label>
    <br /><br />
    <label>
      {$_('settings.style')}:
      <select name="style" bind:value={settings.style} on:change={onChange}>
        <option value="classic">{$_('settings.styleClassic')}</option>
        <option value="peak">{$_('settings.stylePeak')}</option>
        <option value="cs2">{$_('settings.styleCS2')}</option>
        <option value="glass">{$_('settings.styleGlass')}</option>
        <option value="material">{$_('settings.styleMaterial')}</option>
      </select>
    </label>
  </form>
</div>

<style>
.settings {
  max-width: 400px;
  margin: 32px auto;
  padding: 24px;
  background: #fafafa;
  border-radius: 10px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.07);
}
.settings h2 {
  text-align: center;
  margin-bottom: 24px;
}
.settings label {
  display: block;
  margin-bottom: 12px;
  font-size: 1.1em;
}
.settings select, .settings input[type="checkbox"] {
  margin-left: 8px;
  font-size: 1em;
}
</style> 