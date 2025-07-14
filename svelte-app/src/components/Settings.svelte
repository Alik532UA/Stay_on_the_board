<script>
  import { settingsStore } from '../stores/settingsStore.js';
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
  <h2>Налаштування</h2>
  <form class="settings-form">
    <label>
      <input type="checkbox" name="showMoves" checked={settings.showMoves} on:change={onChange} /> Показувати доступні ходи
    </label>
    <br /><br />
    <label>
      Мова:
      <select name="language" bind:value={settings.language} on:change={onChange}>
        <option value="uk">Українська</option>
        <option value="en">English</option>
        <option value="crh">Qırımtatarca</option>
        <option value="nl">Nederlands</option>
      </select>
    </label>
    <br /><br />
    <label>
      Тема:
      <select name="theme" bind:value={settings.theme} on:change={onChange}>
        <option value="dark">Темна</option>
        <option value="light">Світла</option>
      </select>
    </label>
    <br /><br />
    <label>
      Стиль:
      <select name="style" bind:value={settings.style} on:change={onChange}>
        <option value="classic">Classic</option>
        <option value="peak">Peak</option>
        <option value="cs2">CS2</option>
        <option value="glass">Glassmorphism</option>
        <option value="material">Material You</option>
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