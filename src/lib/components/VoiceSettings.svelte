<script>
  import { gameSettingsStore } from '$lib/stores/gameSettingsStore.js';
  import { _ } from 'svelte-i18n';
  import ToggleButton from './ToggleButton.svelte';
  import { speakTestPhrase } from '$lib/services/speechService.js';
</script>

<div class="settings-section">
    <button class="test-voice-button" onclick={() => speakTestPhrase($_('voiceSettings.testPhrase'))} data-testid="voice-settings-test-voice-btn">
        {$_('voiceSettings.testVoice')}
    </button>
</div>

<div class="settings-section">
  <span class="settings-label">{$_('voiceSettings.speed')}</span>
  <div class="button-group">
    <button class:active={$gameSettingsStore.speechRate === 1} onclick={() => gameSettingsStore.updateSettings({ speechRate: 1 })} data-testid="speech-rate-1-btn">x1</button>
    <button class:active={$gameSettingsStore.speechRate === 1.2} onclick={() => gameSettingsStore.updateSettings({ speechRate: 1.2 })} data-testid="speech-rate-1.2-btn">x1.2</button>
    <button class:active={$gameSettingsStore.speechRate === 1.4} onclick={() => gameSettingsStore.updateSettings({ speechRate: 1.4 })} data-testid="speech-rate-1.4-btn">x1.4</button>
    <button class:active={$gameSettingsStore.speechRate === 1.6} onclick={() => gameSettingsStore.updateSettings({ speechRate: 1.6 })} data-testid="speech-rate-1.6-btn">x1.6</button>
    <button class:active={$gameSettingsStore.speechRate === 1.8} onclick={() => gameSettingsStore.updateSettings({ speechRate: 1.8 })} data-testid="speech-rate-1.8-btn">x1.8</button>
    <button class:active={$gameSettingsStore.speechRate === 2} onclick={() => gameSettingsStore.updateSettings({ speechRate: 2 })} data-testid="speech-rate-2-btn">x2</button>
  </div>
</div>
<div class="settings-section">
  <span class="settings-label">{$_('voiceSettings.order')}</span>
  <div class="button-group">
    <button class:active={$gameSettingsStore.speechOrder === 'dist_dir'} onclick={() => gameSettingsStore.updateSettings({ speechOrder: 'dist_dir' })} data-testid="speech-order-dist-dir-btn">{$_('voiceSettings.dist_dir')}</button>
    <button class:active={$gameSettingsStore.speechOrder === 'dir_dist'} onclick={() => gameSettingsStore.updateSettings({ speechOrder: 'dir_dist' })} data-testid="speech-order-dir-dist-btn">{$_('voiceSettings.dir_dist')}</button>
  </div>
</div>
<div class="settings-section">
  <ToggleButton 
    label={$_('voiceSettings.shortSpeech')} 
    checked={$gameSettingsStore.shortSpeech} 
    on:toggle={() => gameSettingsStore.updateSettings({ shortSpeech: !$gameSettingsStore.shortSpeech })}
    dataTestId="short-speech-toggle-btn"
  />
</div>
<div class="settings-section">
  <span class="settings-label">{$_('voiceSettings.speakFor')}</span>
  <div class="button-group">
    <button class:active={$gameSettingsStore.speechFor.player} onclick={() => gameSettingsStore.updateSettings({ speechFor: { ...$gameSettingsStore.speechFor, player: !$gameSettingsStore.speechFor.player } })} data-testid="speech-for-player-btn">{$_('voiceSettings.player')}</button>
    <button class:active={$gameSettingsStore.speechFor.computer} onclick={() => gameSettingsStore.updateSettings({ speechFor: { ...$gameSettingsStore.speechFor, computer: !$gameSettingsStore.speechFor.computer } })} data-testid="speech-for-computer-btn">{$_('voiceSettings.computer')}</button>
  </div>
</div>

<style>
  .settings-section {
    margin-bottom: 20px;
  }

  .settings-label {
    display: block;
    font-weight: bold;
    margin-bottom: 8px;
  }

  .button-group {
    display: flex;
    gap: 10px;
    width: 100%;
  }

  .button-group button {
    background-color: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: white;
    padding: 8px 16px;
    border-radius: 8px;
    cursor: pointer;
    transition: background-color 0.2s;
    flex-grow: 1;
    text-align: center;
  }

  .button-group button.active {
    background-color: var(--text-accent, #ffbe0b);
    color: #000;
    font-weight: bold;
  }

  .test-voice-button {
    background-color: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: white;
    padding: 8px 16px;
    border-radius: 8px;
    cursor: pointer;
    transition: background-color 0.2s;
    width: 100%;
  }
</style>