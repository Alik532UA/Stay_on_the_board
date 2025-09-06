<script>
  import { onMount } from 'svelte';
  import { gameSettingsStore } from '$lib/stores/gameSettingsStore.js';
  import { availableVoices, isLoading, initializeVoices } from '$lib/stores/voiceStore.js';
  import { _ } from 'svelte-i18n';
  import { get } from 'svelte/store';

  let selectedVoiceURI = get(gameSettingsStore).selectedVoiceURI ?? '';

  onMount(() => {
    if (get(availableVoices).length === 0) {
        initializeVoices();
    }
  });

  function selectVoice() {
    gameSettingsStore.updateSettings({ selectedVoiceURI: String(selectedVoiceURI ?? '') });
  }
</script>

{#if $isLoading}
    <div class="loader-container">
        <div class="loading-spinner"></div>
        <p>{$_('voiceSettings.loading')}</p>
    </div>
{:else if $availableVoices.length > 0}
    <div class="voice-list" data-testid="voice-list">
        {#each $availableVoices as voice (voice.voiceURI)}
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
{:else}
    <div class="no-voices-container">
        <p class="no-voices-message">
            {$_('voiceSettings.noVoices')}
        </p>
    </div>
{/if}

<style>
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
    max-height: 30vh;
    overflow-y: auto;
    padding-right: 10px;
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
</style>
