<script>
  import { onMount } from 'svelte';
  import { settingsStore } from '$lib/stores/settingsStore.js';
  import { loadAndGetVoices, filterVoicesByLang } from '$lib/speech.js';
  import { locale } from 'svelte-i18n';
  import { get } from 'svelte/store';

  export let close = () => {};

  let isLoading = true;
  /** @type {SpeechSynthesisVoice[]} */
  let availableVoices = [];
  let selectedVoiceURI = get(settingsStore).selectedVoiceURI;

  onMount(async () => {
    const currentLocale = get(locale);
    try {
      // Await the promise to ensure voices are loaded
      const allVoices = await loadAndGetVoices();
      // Filter the loaded voices
      availableVoices = filterVoicesByLang(allVoices, currentLocale);
    } catch (error) {
      console.error("Помилка завантаження голосів:", error);
    }
    isLoading = false;
  });

  function selectVoice() {
    settingsStore.updateSettings({ selectedVoiceURI: selectedVoiceURI ? String(selectedVoiceURI) : '' });
  }
</script>

<div class="modal-overlay" onclick={close}>
  <div class="modal-window" onclick={(e) => e.stopPropagation()}>
    <div class="modal-header">
      <h2 class="modal-title">Налаштування голосу</h2>
      <button class="modal-close" onclick={close}>&times;</button>
    </div>
    <div class="modal-body">
      {#if isLoading}
        <div class="loader-container">
          <div class="loading-spinner"></div>
          <p>Завантаження голосів...</p>
        </div>
      {:else if availableVoices.length > 0}
        <div class="voice-list" role="radiogroup" aria-labelledby="voice-settings-title">
          {#each availableVoices as voice (voice.voiceURI)}
            <label class="voice-option">
              <input 
                type="radio" 
                name="voice" 
                value={voice.voiceURI} 
                bind:group={selectedVoiceURI} 
                onchange={selectVoice} 
              />
              <span class="voice-name">{voice.name}</span>
            </label>
          {/each}
        </div>
      {:else}
        <p class="no-voices-message">Українські голоси не знайдено у вашому браузері. Озвучування буде стандартним голосом системи.</p>
      {/if}
    </div>
    <div class="modal-footer">
      <button class="modal-btn-generic primary" onclick={close}>Закрити</button>
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
    background: rgba(40, 10, 35, 0.85);
    border: 1px solid rgba(255, 255, 255, 0.18);
    box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
    border-radius: 18px;
    max-width: 500px;
    width: 90vw;
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
  .modal-close {
    background: none;
    border: none;
    color: #fff;
    font-size: 2em;
    cursor: pointer;
    opacity: 0.7;
    transition: opacity 0.2s;
  }
  .modal-close:hover {
    opacity: 1;
  }
  .modal-body {
    padding: 24px;
    max-height: 60vh;
    overflow-y: auto;
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
  .loader-container {
    text-align: center;
    padding: 2em;
  }
  .loading-spinner {
    width: 40px;
    height: 40px;
    border: 4px solid rgba(255,255,255,0.3);
    border-top-color: #fff;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 1em;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  .voice-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .voice-option {
    display: flex;
    align-items: center;
    padding: 12px;
    border-radius: 8px;
    background: rgba(255,255,255,0.05);
    cursor: pointer;
    transition: background 0.2s;
  }
  .voice-option:hover {
    background: rgba(255,255,255,0.1);
  }
  .voice-option input[type="radio"] {
    margin-right: 12px;
    accent-color: #ff9800;
  }
  .voice-name {
    font-size: 1em;
  }
  .no-voices-message {
    text-align: center;
    padding: 1em;
    color: #ccc;
  }
</style> 