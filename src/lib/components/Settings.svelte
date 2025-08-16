<script>
  import { settingsStore } from '../stores/settingsStore.js';
  import { _ } from 'svelte-i18n';
  import LanguageSwitcher from './LanguageSwitcher.svelte';
  import SvgIcons from './SvgIcons.svelte';
  import { customTooltip } from '$lib/actions/customTooltip.js';
  $: settings = $settingsStore;

  /** @param {Event} e */
  function onChange(e) {
    const target = /** @type {HTMLInputElement|HTMLSelectElement} */(e.target);
    const { name, value, type } = target;
    const checked = type === 'checkbox' && 'checked' in target ? target.checked : undefined;
    settingsStore.updateSettings({ [name]: type === 'checkbox' ? checked : value });
  }
  function resetSettings() {
    settingsStore.resetSettings();
  }
</script>

<div class="settings-panel">
  <h2 class="settings-title">{$_('settings.title')}</h2>
  <div class="settings-group lang-group">
    <span class="settings-label">{$_('settings.language')}:</span>
    <LanguageSwitcher />
  </div>
  <div class="settings-group">
    <label class="custom-checkbox" use:customTooltip={$_('settings.showMovesHint')}>
      <input type="checkbox" name="showMoves" checked={settings.showMoves} onchange={onChange} />
      <span class="checkmark"></span>
      {$_('settings.showMoves')}
    </label>
  </div>
  <div class="settings-group">
    <label for="theme-select">{$_('settings.theme')}:</label>
    <select id="theme-select" name="theme" value={settings.theme} onchange={onChange}>
      <option value="dark">{$_('settings.themeDark')}</option>
      <option value="light">{$_('settings.themeLight')}</option>
    </select>
  </div>
  <div class="settings-group">
    <label for="style-select">{$_('settings.style')}:</label>
    <select id="style-select" name="style" value={settings.style} onchange={onChange}>
      <option value="purple">{$_('mainMenu.themeName.purple')}</option>
      <option value="green">{$_('settings.styleGreen')}</option>
      <option value="blue">{$_('settings.styleBlue')}</option>
      <option value="gray">{$_('settings.styleGray')}</option>
      <option value="orange">{$_('settings.styleOrange')}</option>
      <option value="wood">{$_('mainMenu.themeName.wood')}</option>
    </select>
  </div>
  <div class="settings-actions">
    <button class="reset-btn" onclick={resetSettings} aria-label="{$_('settings.reset')}" use:customTooltip={$_('settings.resetHint')}>
      <SvgIcons name="reset" />
      {$_('settings.reset')}
    </button>
    <div class="reset-hint">{$_('settings.resetHint')}</div>
  </div>
</div>

<style>
.settings-panel {
  background: rgba(58,24,86,0.97); /* темно-фіолетовий, не чорний */
  border-radius: 18px;
  padding: 32px 28px 28px 28px;
  box-shadow: 0 8px 32px 0 var(--shadow-color);
  min-width: 320px;
  max-width: 380px;
  margin: 36px auto 0 auto;
  color: #fff;
}
.settings-title {
  color: #fff;
  font-size: 2.1em;
  font-weight: 900;
  text-align: center;
  margin-bottom: 28px;
  text-shadow: 0 2px 12px #0008;
  letter-spacing: 0.01em;
}
.settings-group {
  margin-bottom: 24px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.lang-group {
  flex-direction: row;
  align-items: center;
  gap: 12px;
  margin-bottom: 28px;
}
.settings-label {
  color: #ffe082;
  font-size: 1.08em;
  font-weight: 600;
}
select {
  padding: 10px 16px;
  border-radius: 8px;
  border: 1.5px solid #bdbdbd;
  background: #4b256a;
  color: #fff;
  font-size: 1em;
  transition: border 0.2s, box-shadow 0.2s, background 0.2s;
  margin-top: 4px;
  box-shadow: 0 2px 8px #0002;
}
select:focus, select:hover {
  border-color: #ff9800;
  background: #5c3380;
  box-shadow: 0 0 0 2px #ff980055;
}
.custom-checkbox {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 1.08em;
  cursor: pointer;
  user-select: none;
  position: relative;
  color: #fff;
}
.custom-checkbox input[type="checkbox"] {
  display: none;
}
.custom-checkbox .checkmark {
  width: 22px;
  height: 22px;
  border-radius: 6px;
  background: #eee;
  border: 2px solid #ff9800;
  display: inline-block;
  position: relative;
  transition: background 0.2s;
}
.custom-checkbox input[type="checkbox"]:checked + .checkmark {
  background: #ff9800;
  border-color: #ff9800;
}
.custom-checkbox .checkmark:after {
  content: '';
  position: absolute;
  display: none;
}
.custom-checkbox input[type="checkbox"]:checked + .checkmark:after {
  display: block;
}
.custom-checkbox .checkmark:after {
  left: 7px;
  top: 2px;
  width: 6px;
  height: 12px;
  border: solid #fff;
  border-width: 0 3px 3px 0;
  transform: rotate(45deg);
}
.settings-actions {
  text-align: center;
  margin-top: 18px;
}
.reset-btn {
  background: linear-gradient(90deg, #ff9800 60%, #ffb300 100%);
  color: #fff;
  border: none;
  border-radius: 10px;
  padding: 12px 32px;
  font-weight: bold;
  cursor: pointer;
  font-size: 1.12em;
  transition: background 0.18s, color 0.18s, box-shadow 0.18s, transform 0.12s;
  box-shadow: 0 2px 12px #ff980055;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-top: 6px;
  margin-bottom: 2px;
  outline: none;
}
.reset-btn:hover, .reset-btn:focus {
  background: linear-gradient(90deg, #fff 60%, #ffe082 100%);
  color: #ff9800;
  border: 1.5px solid #ff9800;
  box-shadow: 0 4px 24px 0 #ff980088;
  transform: scale(1.045);
}
.reset-btn:active {
  background: #ff9800;
  color: #fff;
  transform: scale(0.97);
}
.reset-hint {
  color: #ffe082;
  font-size: 0.98em;
  margin-top: 6px;
  text-align: center;
  opacity: 0.85;
}
.settings-group label,
.settings-group select {
  opacity: 1 !important;
}
</style> 