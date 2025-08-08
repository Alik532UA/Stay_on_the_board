<script>
  import { localGameStore } from '$lib/stores/localGameStore.js';
  import { _ } from 'svelte-i18n';
  import { logService } from '$lib/services/logService.js';

  // Створюємо локальні змінні для зручності доступу до налаштувань
  $: settings = $localGameStore.settings;

  /**
   * Оновлює налаштування розміру дошки в store
   * @param {number} increment - Крок зміни (+1 або -1)
   */
  function changeBoardSize(increment) {
    logService.action(`Click: "Змінити розмір дошки: ${increment > 0 ? '+' : ''}${increment}" (LocalGameSettings)`);
    const newSize = settings.boardSize + increment;
    if (newSize >= 2 && newSize <= 9) {
      localGameStore.updateSettings({ boardSize: newSize });
    }
  }
</script>

<div class="settings-card">
  <h2>{$_('localGame.settingsTitle')}</h2>

  <div class="settings-list">
    <!-- Керування розміром дошки -->
    <div class="setting-item">
      <span>{$_('settings.boardSize')}</span>
      <div class="size-adjuster">
        <button 
          class="adjust-btn" 
          on:click={() => changeBoardSize(-1)}
          disabled={settings.boardSize <= 2}
        >-</button>
        <span class="current-size">{settings.boardSize}x{settings.boardSize}</span>
        <button 
          class="adjust-btn" 
          on:click={() => changeBoardSize(1)}
          disabled={settings.boardSize >= 9}
        >+</button>
      </div>
    </div>

    <!-- Чекбокс: Режим заблокованих клітинок -->
    <label class="ios-switch-label">
      <span>{$_('gameControls.blockMode')}</span>
      <div class="ios-switch">
        <input 
          type="checkbox" 
          bind:checked={settings.blockModeEnabled}
          on:change={(e) => {
            logService.action(`Click: "Режим заблокованих клітинок: ${e.currentTarget.checked}" (LocalGameSettings)`);
            localGameStore.updateSettings({ blockModeEnabled: e.currentTarget.checked });
          }}
        />
        <span class="slider"></span>
      </div>
    </label>

    <!-- Чекбокс: Автоматично приховувати дошку -->
    <label class="ios-switch-label">
      <span>{$_('gameModes.autoHideBoard')}</span>
      <div class="ios-switch">
        <input 
          type="checkbox" 
          bind:checked={settings.autoHideBoard}
          on:change={(e) => {
            logService.action(`Click: "Автоматично приховувати дошку: ${e.currentTarget.checked}" (LocalGameSettings)`);
            localGameStore.updateSettings({ autoHideBoard: e.currentTarget.checked });
          }}
        />
        <span class="slider"></span>
      </div>
    </label>

    <!-- Чекбокс: Заборонити змінювати правила -->
    <label class="ios-switch-label">
      <span>{$_('localGame.lockSettings')}</span>
      <div class="ios-switch">
        <input 
          type="checkbox" 
          bind:checked={settings.lockSettings}
          on:change={(e) => {
            logService.action(`Click: "Заборонити змінювати правила: ${e.currentTarget.checked}" (LocalGameSettings)`);
            localGameStore.updateSettings({ lockSettings: e.currentTarget.checked });
          }}
        />
        <span class="slider"></span>
      </div>
    </label>
  </div>
</div>

<style>
  .settings-card {
    background: var(--bg-secondary);
    padding: 24px;
    border-radius: var(--unified-border-radius);
    box-shadow: var(--unified-shadow);
    border: var(--unified-border);
  }
  h2 {
    text-align: center;
    margin: 0 0 20px 0;
    color: var(--text-primary);
  }
  .settings-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .setting-item, .ios-switch-label {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 1.08em;
    min-height: 40px;
  }
  .size-adjuster {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .adjust-btn {
    background: var(--control-bg);
    color: var(--text-primary);
    border: 1.5px solid var(--border-color);
    border-radius: 8px;
    width: 40px;
    height: 40px;
    font-size: 1.2em;
    font-weight: bold;
    cursor: pointer;
    transition: background 0.2s, border-color 0.2s;
  }
  .adjust-btn:hover {
    background: var(--control-hover);
    border-color: var(--control-hover);
  }
  .adjust-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .current-size {
    font-weight: bold;
    min-width: 50px;
    text-align: center;
  }
  .ios-switch {
    position: relative;
    width: 44px;
    height: 24px;
  }
  .ios-switch input { display: none; }
  .slider {
    position: absolute;
    cursor: pointer;
    inset: 0;
    background: var(--toggle-off-bg);
    border-radius: 12px;
    transition: background 0.2s;
  }
  .slider:before {
    content: '';
    position: absolute;
    left: 2px;
    top: 2px;
    width: 20px;
    height: 20px;
    background: #fff;
    border-radius: 50%;
    transition: transform 0.2s;
  }
  input:checked + .slider { background: var(--control-selected); }
  input:checked + .slider:before { transform: translateX(20px); }
</style> 