<script>
  import { onMount } from 'svelte';
  import { settingsStore } from '$lib/stores/settingsStore.js';
  import { loadAndGetVoices, filterVoicesByLang, resetVoicesPromise } from '$lib/speech.js';
  import { locale, _ } from 'svelte-i18n';
  import { get } from 'svelte/store';
  import { logService } from '$lib/services/logService.js';

  export let close = () => {};

  let showDetails = false;
  let isLoading = true;
  /** @type {SpeechSynthesisVoice[]} */
  let availableVoices = [];
  /** @type {string} */
  let selectedVoiceURI = get(settingsStore).selectedVoiceURI ?? '';

  const isIOS = typeof window !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isEdge = typeof window !== 'undefined' && navigator.userAgent.includes("Edg/");

  onMount(async () => {
    const currentLocale = get(locale) || 'uk';
    try {
      const allVoices = await loadAndGetVoices();
      let mainVoices = filterVoicesByLang(allVoices, currentLocale);
      if (currentLocale !== 'en') {
        // Додаємо англійські голоси в кінець списку
        const enVoices = filterVoicesByLang(allVoices, 'en');
        // Уникаємо дублікатів (на випадок, якщо англійський голос вже є у mainVoices)
        const mainVoiceURIs = new Set(mainVoices.map(v => v.voiceURI));
        const onlyEn = enVoices.filter(v => !mainVoiceURIs.has(v.voiceURI));
        availableVoices = [...mainVoices, ...onlyEn];
      } else {
        availableVoices = mainVoices;
      }
    } catch (error) {
      logService.ui("Помилка завантаження голосів:", error);
    }
    if (selectedVoiceURI == null) selectedVoiceURI = '';
    isLoading = false;
  });

  function selectVoice() {
    settingsStore.updateSettings({ selectedVoiceURI: String(selectedVoiceURI ?? '') });
  }

  async function recheckVoices() {
    isLoading = true;
    resetVoicesPromise();
    const currentLocale = get(locale) || 'uk';
    try {
      const allVoices = await loadAndGetVoices();
      let mainVoices = filterVoicesByLang(allVoices, currentLocale);
      if (currentLocale !== 'en') {
        const enVoices = filterVoicesByLang(allVoices, 'en');
        const mainVoiceURIs = new Set(mainVoices.map(v => v.voiceURI));
        const onlyEn = enVoices.filter(v => !mainVoiceURIs.has(v.voiceURI));
        availableVoices = [...mainVoices, ...onlyEn];
      } else {
        availableVoices = mainVoices;
      }
    } catch (error) {
      logService.ui("Помилка повторного завантаження голосів:", error);
    }
    isLoading = false;
  }
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
      <button class="modal-close" onclick={close}>&times;</button>
    </div>
    <div class="modal-body">
      {#if isLoading}
        <div class="loader-container">
          <div class="loading-spinner"></div>
          <p>{$_('voiceSettings.loading')}</p>
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
              <span class="voice-name">{voice.name} ({voice.lang})</span>
            </label>
          {/each}
        </div>
        {#if isIOS && selectedVoiceURI}
          <div class="ios-warning">
            <p><strong>{$_('voiceSettings.iosWarning')}</strong></p>
          </div>
        {/if}
      {:else}
        <div class="no-voices-container">
          <p class="no-voices-message">
            {$_('voiceSettings.noVoices')}
          </p>
          {#if isEdge}
            <div class="edge-fix-instructions">
              <h4>{$_('voiceSettings.edgeFixTitle')}</h4>
              <ol>
                <li>{@html $_('voiceSettings.edgeFixStep1')}</li>
                <li>{@html $_('voiceSettings.edgeFixStep2')}</li>
                <li>{@html $_('voiceSettings.edgeFixStep3')}</li>
                <li>{@html $_('voiceSettings.edgeFixStep4')}</li>
              </ol>
              <p>{$_('voiceSettings.edgeFixStep5')}</p>
              <button class="modal-btn-generic primary" onclick={recheckVoices}>
                {$_('voiceSettings.checkAgainButton')}
              </button>
            </div>
            <button class="details-button" onclick={() => showDetails = !showDetails}>
              {showDetails ? $_('voiceSettings.hideDetailsButton') : $_('voiceSettings.whyIsThisNeededTitle')}
            </button>
          {:else}
            <button class="details-button" onclick={() => showDetails = !showDetails}>
              {showDetails ? $_('voiceSettings.hideDetailsButton') : $_('voiceSettings.whyButton')}
            </button>
          {/if}
          {#if showDetails}
            <div class="details-text">
              <p>{$_('voiceSettings.recommendationsContent')}</p>
              <ul>
                <li>{$_('voiceSettings.platformEdge')}</li>
                <li>{$_('voiceSettings.platformAndroid')}</li>
              </ul>
            </div>
          {/if}
        </div>
      {/if}
    </div>
    <div class="modal-footer">
      <button class="modal-btn-generic primary" onclick={close}>{$_('voiceSettings.close')}</button>
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
    gap: 16px;
  }
  .voice-option {
    display: flex;
    align-items: center;
    margin: 0;
    padding: 16px;
    border-radius: 16px;
    background: rgba(255,255,255,0.07);
    cursor: pointer;
    transition: background 0.2s;
    font-size: 1.08em;
    gap: 16px;
  }
  .voice-option:hover {
    background: rgba(255,255,255,0.13);
  }
  .voice-option input[type="radio"] {
    margin-right: 16px;
    accent-color: #ff9800;
    width: 22px;
    height: 22px;
  }
  .voice-name {
    font-size: 1em;
    line-height: 1.3;
    display: block;
  }
  .no-voices-message {
    text-align: center;
    padding: 1em;
    color: #ccc;
  }
  .no-voices-container {
    text-align: center;
    padding: 1em 0;
  }

  .details-button {
    background: none;
    border: none;
    color: var(--text-accent, #ffbe0b);
    text-decoration: underline;
    cursor: pointer;
    margin-top: 16px;
    font-size: 0.95em;
    padding: 4px 8px;
    transition: color 0.2s;
  }

  .details-button:hover {
    color: #fff;
  }

  .details-text {
    margin-top: 20px;
    padding: 16px;
    background: rgba(0, 0, 0, 0.25);
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    text-align: left;
    line-height: 1.6;
    animation: fadeIn 0.4s ease-out forwards;
  }



  .details-text p, .details-text ul {
    margin-bottom: 12px;
    color: var(--text-secondary, #ccc);
  }

  .details-text ul {
    padding-left: 20px;
    margin-bottom: 0;
  }

  .details-text li {
    margin-bottom: 8px;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .ios-warning {
    margin-top: 20px;
    padding: 12px 16px;
    background: rgba(255, 186, 11, 0.15); /* Жовтуватий фон */
    border: 1px solid rgba(255, 186, 11, 0.3);
    border-radius: 8px;
    font-size: 0.9em;
    line-height: 1.5;
    color: #ffbe0b; /* Жовтий текст */
  }

  .ios-warning p {
    margin: 0;
  }

  /* Додаю стилі для edge-fix-instructions */
  .edge-fix-instructions {
    margin-top: 20px;
    padding: 16px;
    background: rgba(0, 0, 0, 0.2);
    border-radius: 8px;
    text-align: left;
  }
  .edge-fix-instructions h4 {
    margin-top: 0;
    color: var(--text-accent, #ffbe0b);
  }
  .edge-fix-instructions ol {
    padding-left: 20px;
    margin-bottom: 12px;
  }
  .edge-fix-instructions li {
    margin-bottom: 8px;
    line-height: 1.5;
  }
  .edge-fix-instructions p {
    font-size: 0.9em;
    opacity: 0.8;
  }
  .edge-fix-instructions button {
    width: 100%;
    margin-top: 16px;
  }
</style> 