<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { logService } from "$lib/services/logService";
  import { modalStore } from "$lib/stores/modalStore";
  import { _ } from "svelte-i18n";
  import VoiceSettings from "./VoiceSettings.svelte";
  import VoiceList from "./VoiceList.svelte";
  import StyledButton from "$lib/components/ui/StyledButton.svelte";

  let showFade = false;
  let voiceListContainer: HTMLDivElement | null = null;

  function updateFadeState() {
    if (!voiceListContainer) return;
    const { scrollTop, scrollHeight, clientHeight } = voiceListContainer;
    const isScrollable = scrollHeight > clientHeight;
    const isAtBottom = Math.abs(scrollHeight - scrollTop - clientHeight) < 1;
    showFade = isScrollable && !isAtBottom;
  }

  let mutationObserver: MutationObserver | null = null;
  let resizeObserver: ResizeObserver | null = null;

  onMount(() => {
    if (voiceListContainer) {
      setTimeout(updateFadeState, 0);

      resizeObserver = new ResizeObserver(updateFadeState);
      resizeObserver.observe(voiceListContainer);

      mutationObserver = new MutationObserver(updateFadeState);
      mutationObserver.observe(voiceListContainer, {
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

<div
  class="voice-settings-modal-content"
  data-testid="voice-settings-modal-content"
>
  <h2 class="modal-title-menu" id="voice-settings-title">
    {$_("voiceSettings.title")}
  </h2>

  <div class="voice-settings-body">
    <div class="voice-settings-container">
      <VoiceSettings />
    </div>
    <hr class="divider-h" />
    <div class="divider-v"></div>
    <div
      class="voice-list-container"
      class:fade-bottom={showFade}
      bind:this={voiceListContainer}
      on:scroll={updateFadeState}
    >
      <VoiceList />
    </div>
  </div>

  <div class="actions-column">
    <StyledButton
      variant="primary"
      size="large"
      on:click={() => modalStore.closeModal()}
      dataTestId="voice-settings-save-footer-btn"
    >
      {$_("common.save")}
    </StyledButton>
  </div>
</div>

<style>
  .voice-settings-modal-content {
    display: flex;
    flex-direction: column;
    gap: 20px;
    width: 600px;
    max-width: 95vw;
    box-sizing: border-box;
  }

  .modal-title-menu {
    text-align: center;
    font-size: 1.8em;
    font-weight: 800;
    color: #fff;
    margin: 0;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  }

  .voice-settings-body {
    padding: 24px;
    max-height: 60vh;
    display: flex;
    flex-direction: column;
  }

  .voice-settings-container,
  .voice-list-container {
    min-width: 280px;
    overflow-y: auto;
    flex: 1;
    min-height: 0;
  }

  .voice-list-container.fade-bottom {
    -webkit-mask-image: linear-gradient(to bottom, black 95%, transparent 100%);
    mask-image: linear-gradient(to bottom, black 95%, transparent 100%);
  }

  .voice-list-container::-webkit-scrollbar {
    width: 8px;
  }
  .voice-list-container::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.02);
    border-radius: 4px;
  }
  .voice-list-container::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.15);
    border-radius: 4px;
  }
  .voice-list-container::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.25);
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
    .voice-settings-body {
      flex-direction: row;
    }
    .divider-h {
      display: none;
    }
    .divider-v {
      display: block;
    }
  }

  .actions-column {
    display: flex;
    flex-direction: column;
    margin-top: 10px;
  }
</style>
