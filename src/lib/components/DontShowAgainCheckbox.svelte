<script lang="ts">
  import { settingsStore } from '$lib/stores/settingsStore.ts';
  import { _ } from 'svelte-i18n';
  let dontShowAgain = false;
  $: dontShowAgain = !$settingsStore.showGameModeModal;

  function handleCheckboxChange(event: Event) {
    const input = event.currentTarget as HTMLInputElement;
    if (input && typeof input.checked === 'boolean') {
      settingsStore.updateSettings({ showGameModeModal: !input.checked });
    }
  }
</script>

<div class="dont-show-again-checkbox">
  <label class="ios-switch-label">
    <div class="switch-content-wrapper">
      <div class="ios-switch">
        <input 
          type="checkbox"
          bind:checked={dontShowAgain}
          on:change={handleCheckboxChange}
        />
        <span class="slider"></span>
      </div>
      <span>{$_('gameModes.dontShowAgain')}</span>
    </div>
  </label>
</div>

<style>
  .dont-show-again-checkbox {
    margin-top: 24px;
    padding-top: 16px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    display: flex;
    justify-content: center;
  }
  .ios-switch-label {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 1.08em;
    min-height: 40px;
    gap: 12px;
    cursor: pointer;
  }
  .switch-content-wrapper {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .ios-switch {
    position: relative;
    width: 44px;
    height: 24px;
    min-width: 44px;
    min-height: 24px;
  }
  .ios-switch input { display: none; }
  .slider {
    position: absolute;
    cursor: pointer;
    inset: 0;
    background: var(--toggle-off-bg, #555);
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
  input:checked + .slider { background: var(--control-selected, #4caf50); }
  input:checked + .slider:before { transform: translateX(20px); }
  .dont-show-again-checkbox .ios-switch {
    position: relative;
    width: 44px !important;
    height: 24px !important;
    min-width: 44px !important;
    min-height: 24px !important;
    display: inline-block;
  }
  .dont-show-again-checkbox .ios-switch input { display: none; }
  .dont-show-again-checkbox .slider {
    position: absolute;
    cursor: pointer;
    inset: 0;
    background: var(--toggle-off-bg, #555);
    border-radius: 12px;
    transition: background 0.2s;
    width: 44px !important;
    height: 24px !important;
  }
  .dont-show-again-checkbox .slider:before {
    content: '';
    position: absolute;
    left: 2px;
    top: 2px;
    width: 20px !important;
    height: 20px !important;
    background: #fff;
    border-radius: 50%;
    transition: transform 0.2s;
  }
  .dont-show-again-checkbox input:checked + .slider { background: var(--control-selected, #4caf50); }
  .dont-show-again-checkbox input:checked + .slider:before { transform: translateX(20px); }
</style> 