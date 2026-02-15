<script lang="ts">
  import { t } from "$lib/i18n/typedI18n";
  import VoiceSettings from "$lib/components/VoiceSettings.svelte";
  import VoiceList from "$lib/components/VoiceList.svelte";
  import { onMount, onDestroy } from "svelte";

  let showFade = false;
  let voiceListWrapper: HTMLDivElement;

  function updateFadeState() {
    if (!voiceListWrapper) return;
    const { scrollTop, scrollHeight, clientHeight } = voiceListWrapper;
    const isScrollable = scrollHeight > clientHeight;
    const isAtBottom = Math.abs(scrollHeight - scrollTop - clientHeight) < 1;
    showFade = isScrollable && !isAtBottom;
  }

  let mutationObserver: MutationObserver;
  let resizeObserver: ResizeObserver;

  onMount(() => {
    if (voiceListWrapper) {
      setTimeout(updateFadeState, 0);
      resizeObserver = new ResizeObserver(updateFadeState);
      resizeObserver.observe(voiceListWrapper);
      mutationObserver = new MutationObserver(updateFadeState);
      mutationObserver.observe(voiceListWrapper, {
        childList: true,
        subtree: true,
      });
    }
  });

  onDestroy(() => {
    if (mutationObserver) mutationObserver.disconnect();
    if (resizeObserver) resizeObserver.disconnect();
  });
</script>

<div class="setup-grid">
  <div class="grid-column">
    <div class="settings-card">
      <span class="settings-label">{$t("settings.voiceSettings")}</span>
      <VoiceSettings />
    </div>
  </div>
  <div class="grid-column">
    <div class="settings-card" style="height: 100%; min-height: 400px;">
      <span class="settings-label">{$t("settings.voiceList")}</span>
      <div
        class="voice-list-wrapper"
        class:fade-bottom={showFade}
        bind:this={voiceListWrapper}
        on:scroll={updateFadeState}
      >
        <VoiceList />
      </div>
    </div>
  </div>
</div>

<style>
  .setup-grid {
    display: grid;
    gap: 24px;
    grid-template-columns: 1fr;
  }

  @media (min-width: 768px) {
    .setup-grid {
      grid-template-columns: 1fr 1fr;
    }
  }

  .grid-column {
    display: flex;
    flex-direction: column;
    gap: 16px;
    min-width: 0;
  }

  .settings-card {
    background: var(--bg-secondary);
    padding: 24px;
    border-radius: var(--unified-border-radius);
    box-shadow: var(--unified-shadow);
    border: var(--unified-border);
    display: flex;
    flex-direction: column;
    gap: 20px;
    flex-grow: 1;
  }

  .settings-label {
    font-weight: 600;
    color: var(--text-secondary);
  }

  .voice-list-wrapper {
    flex-grow: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    overflow-y: auto;
    max-height: 500px;
  }

  .voice-list-wrapper.fade-bottom {
    -webkit-mask-image: linear-gradient(to bottom, black 95%, transparent 100%);
    mask-image: linear-gradient(to bottom, black 95%, transparent 100%);
  }

  .voice-list-wrapper::-webkit-scrollbar {
    width: 8px;
  }

  .voice-list-wrapper::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.02);
    border-radius: 4px;
  }

  .voice-list-wrapper::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.15);
    border-radius: 4px;
  }

  .voice-list-wrapper::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.25);
  }
</style>
