<script>
  import { settingsStore } from '$lib/stores/settingsStore';
  import { _ } from 'svelte-i18n';
  import { logService } from '$lib/services/logService.js';
  import ToggleButton from '$lib/components/ToggleButton.svelte';
  import { get } from 'svelte/store';

  // НАВІЩО: Тепер компонент працює виключно з settingsStore,
  // що відповідає принципу SSoT.
  $: settings = $settingsStore;

  /**
   * Оновлює налаштування розміру дошки в store
   * @param {number} increment - Крок зміни (+1 або -1)
   */
  function changeBoardSize(increment) {
    logService.action(`Click: "Змінити розмір дошки: ${increment > 0 ? '+' : ''}${increment}" (LocalGameSettings)`);
    const newSize = settings.boardSize + increment;
    if (newSize >= 2 && newSize <= 9) {
      settingsStore.updateSettings({ boardSize: newSize });
    }
  }
</script>

{#if settings}
<div class="settings-card">
  <h2 data-testid="local-game-settings-title">{$_('localGame.settingsTitle')}</h2>

  <div class="settings-list">
    <!-- Керування розміром дошки -->
    <div class="setting-item">
      <span class="setting-label">{$_('settings.boardSizeLabel')}</span>
      <div class="size-adjuster">
        <button
          class="adjust-btn"
          on:click={() => changeBoardSize(-1)}
          disabled={settings.boardSize <= 2}
          data-testid="board-size-decrement-btn"
        >-</button>
        <span class="current-size">{settings.boardSize}x{settings.boardSize}</span>
        <button
          class="adjust-btn"
          on:click={() => changeBoardSize(1)}
          disabled={settings.boardSize >= 9}
          data-testid="board-size-increment-btn"
        >+</button>
      </div>
    </div>

    <!-- ToggleButton: Режим заблокованих клітинок -->
    <ToggleButton
      label={$_('gameControls.blockMode')}
      bind:checked={settings.blockModeEnabled}
      on:toggle={() => {
        const newCheckedState = !settings.blockModeEnabled;
        logService.action(`Click: "Режим заблокованих клітинок: ${newCheckedState}" (LocalGameSettings)`);
        settingsStore.updateSettings({ blockModeEnabled: newCheckedState });
      }}
      dataTestId="block-mode-toggle"
    />

    <!-- ToggleButton: Автоматично приховувати дошку -->
    <ToggleButton
      label={$_('gameModes.autoHideBoard')}
      bind:checked={settings.autoHideBoard}
      on:toggle={() => {
        const newCheckedState = !settings.autoHideBoard;
        logService.action(`Click: "Автоматично приховувати дошку: ${newCheckedState}" (LocalGameSettings)`);
        settingsStore.updateSettings({ autoHideBoard: newCheckedState });
      }}
      dataTestId="auto-hide-board-toggle"
    />

    <!-- ToggleButton: Заборонити змінювати правила -->
    <ToggleButton
      label={$_('localGame.lockSettings')}
      bind:checked={settings.lockSettings}
      on:toggle={() => {
        const newCheckedState = !settings.lockSettings;
        logService.action(`Click: "Заборонити змінювати правила: ${newCheckedState}" (LocalGameSettings)`);
        settingsStore.updateSettings({ lockSettings: newCheckedState });
      }}
      dataTestId="lock-settings-toggle"
    />
  </div>
</div>
{/if}

<style>
  .setting-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 1.08em;
    padding: 0;
    gap: 12px;
  }
  .setting-label {
    font-weight: 700;
    font-size: 1em;
    text-align: left;
    flex-grow: 1;
  }
  .settings-card {
    background: linear-gradient(120deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.04) 100%);
    backdrop-filter: var(--unified-backdrop-filter);
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
</style>