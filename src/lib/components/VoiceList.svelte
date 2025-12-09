<script>
  import { onMount, onDestroy } from "svelte";
  import { gameSettingsStore } from "$lib/stores/gameSettingsStore.js";
  import {
    availableVoices,
    isLoading,
    initializeVoices,
  } from "$lib/stores/voiceStore";
  import { _ } from "svelte-i18n";
  import { get } from "svelte/store";
  import { speakTestPhrase } from "$lib/services/speechService.js";

  let selectedVoiceURI = "";

  const unsubscribe = gameSettingsStore.subscribe((settings) => {
    selectedVoiceURI = settings.selectedVoiceURI ?? "";
  });

  onMount(() => {
    if (get(availableVoices).length === 0) {
      initializeVoices();
    }
  });

  onDestroy(() => {
    if (unsubscribe) {
      unsubscribe();
    }
  });

  /**
   * @param {string} uri
   */
  function selectVoice(uri) {
    gameSettingsStore.updateSettings({ selectedVoiceURI: uri });
    speakTestPhrase();
  }
</script>

{#if $isLoading}
  <div class="loader-container">
    <div class="loading-spinner"></div>
    <p>{$_("voiceSettings.loading")}</p>
  </div>
{:else if $availableVoices.length > 0}
  <div class="voice-list button-group" data-testid="voice-list">
    {#each $availableVoices as voice (voice.voiceURI)}
      <button
        class="voice-selection-button"
        class:active={selectedVoiceURI === voice.voiceURI}
        on:click={() => selectVoice(voice.voiceURI)}
        data-testid="voice-selection-button-{voice.voiceURI}"
      >
        {voice.name} ({voice.lang})
      </button>
    {/each}
  </div>
{:else}
  <div class="no-voices-container">
    <p class="no-voices-message">
      {$_("voiceSettings.noVoices")}
    </p>
  </div>
{/if}

<style>
  .button-group {
    display: flex;
    flex-direction: column;
    gap: 10px;
    width: 100%;
  }

  .voice-selection-button {
    background-color: rgba(255, 255, 255, 0.07);
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: white;
    padding: 8px 16px;
    border-radius: 12px;
    cursor: pointer;
    transition:
      background-color 0.2s,
      border-color 0.2s;
    text-align: left;
    font-size: 1em;
    line-height: 1.3;
    flex-shrink: 0;
  }

  .voice-selection-button:hover {
    border-color: rgba(255, 255, 255, 0.5);
  }

  .voice-selection-button.active {
    background-color: var(--text-accent, #ffbe0b);
    border-color: var(--text-accent, #ffbe0b);
    color: #000;
    font-weight: bold;
  }

  .loader-container {
    text-align: center;
    padding: 2em;
  }
  .loading-spinner {
    width: 40px;
    height: 40px;
    border: 4px solid rgba(255, 255, 255, 0.3);
    border-top-color: #fff;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 1em;
  }
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
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

  .voice-list {
    padding-right: 10px;
    padding-bottom: 24px;
    padding-top: 4px;
    min-height: 0;
    width: 95%;
    margin: 0 auto;
  }
</style>

