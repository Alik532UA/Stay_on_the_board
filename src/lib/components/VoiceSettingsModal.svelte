<script>
  import { _ } from 'svelte-i18n';
  import VoiceSettings from './VoiceSettings.svelte';
  import VoiceList from './VoiceList.svelte';

  export let close = () => {};
</script>

<div 
  class="modal-overlay" 
  onclick={close} 
  onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') close(); }}
  role="button"
  tabindex="0"
  aria-label={$_('voiceSettings.close')}
>
  <div 
    class="modal-window"
    data-testid="voice-settings-modal"
    tabindex="0"
    onclick={(e) => e.stopPropagation()}
    onkeydown={(e) => { if (e.key === 'Escape') close(); }}
    role="dialog"
    aria-modal="true"
    aria-labelledby="voice-settings-title"
  >
    <div class="modal-header">
      <h2 class="modal-title" id="voice-settings-title">{$_('voiceSettings.title')}</h2>
    </div>
    <div class="modal-body">
      <div class="voice-settings-container">
        <VoiceSettings />
      </div>
      <hr class="divider-h"/>
      <div class="divider-v"></div>
      <div class="voice-list-container">
        <VoiceList />
      </div>
    </div>
    <div class="modal-footer">
      <button class="modal-btn-generic primary" onclick={close} data-testid="voice-settings-save-footer-btn">{$_('common.save')}</button>
    </div>
  </div>
</div>

<style>
  .modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(30, 16, 40, 0.45);
    backdrop-filter: blur(8px);
    z-index: 1001;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .modal-window {
    background: var(--bg-secondary);
    border: 1px solid rgba(255, 255, 255, 0.18);
    box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
    border-radius: 18px;
    max-width: 90vw;
    width: auto;
    color: #fff;
    animation: modalFadeIn 0.3s ease-out forwards;
  }
  @keyframes modalFadeIn { to { transform: scale(1); opacity: 1; } }
  .modal-header {
    padding: 16px 24px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .modal-title {
    font-size: 1.5em;
    font-weight: 700;
    margin: 0;
  }
  
  .modal-body {
    padding: 24px;
    max-height: 60vh;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
  }

  .voice-settings-container,
  .voice-list-container {
    min-width: 300px;
  }

  .divider-h {
    border: none;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    margin: 20px 0;
  }

  .divider-v {
    display: none;
    border: none;
    border-left: 1px solid rgba(255, 255, 255, 0.1);
    margin: 0 20px;
  }

  @media (min-width: 801px) {
    .modal-body {
      flex-direction: row;
    }
    .divider-h {
      display: none;
    }
    .divider-v {
      display: block;
    }
  }

  .modal-footer {
    padding: 16px 24px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    text-align: right;
  }
  .modal-btn-generic {
    padding: 8px 26px;
    font-size: 1.08em;
    border-radius: 8px;
    border: 1.5px solid #eee;
    background: #fff;
    color: #222;
    cursor: pointer;
    font-weight: 600;
  }
  .modal-btn-generic.primary {
    background: #4caf50;
    color: #fff;
    border-color: #388e3c;
  }
</style>