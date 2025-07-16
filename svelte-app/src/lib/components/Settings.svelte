<script>
  import { settingsStore } from '../stores/settingsStore.js';
  import { _ } from 'svelte-i18n';
  import LanguageSwitcher from './LanguageSwitcher.svelte';
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
    <label class="custom-checkbox" title="{$_('settings.showMovesHint')}">
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
      <option value="ubuntu">{$_('mainMenu.themeName.ubuntu')}</option>
      <option value="peak">{$_('settings.stylePeak')}</option>
      <option value="cs2">{$_('settings.styleCS2')}</option>
      <option value="glass">{$_('settings.styleGlass')}</option>
      <option value="material">{$_('settings.styleMaterial')}</option>
    </select>
  </div>
  <div class="settings-actions">
    <button class="reset-btn" onclick={resetSettings} aria-label="{$_('settings.reset')}" title="{$_('settings.resetHint')}">
      <svg class="reset-icon" width="20" height="20" viewBox="0 0 20 20" fill="none" style="vertical-align:middle;margin-right:8px;">
        <path d="M10 2v4M10 2l2 2M10 2l-2 2" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M4.93 4.93A8 8 0 1 0 10 2" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
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
  box-shadow: 0 8px 32px 0 rgba(80,0,80,0.22);
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
.reset-icon {
  margin-right: 8px;
  vertical-align: middle;
  transition: transform 0.18s;
}
.reset-btn:active .reset-icon {
  transform: rotate(-30deg) scale(0.92);
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
.settings-group label[disabled],
.settings-group select:disabled {
  opacity: 0.5 !important;
  cursor: not-allowed;
}
</style> 