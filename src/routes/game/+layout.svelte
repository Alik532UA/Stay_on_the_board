<script lang="ts">
  import VoiceSettingsModal from "$lib/components/VoiceSettingsModal.svelte";
  import { uiState, closeVoiceSettingsModal } from "$lib/stores/uiStore";
  import { appSettingsStore } from "$lib/stores/appSettingsStore.js";
  import { gameSettingsStore } from "$lib/stores/gameSettingsStore.js";
  import { get } from "svelte/store";
  import { gameModeService } from "$lib/services/gameModeService";
  import { userActionService } from "$lib/services/userActionService";
  import { logService } from "$lib/services/logService.js";
  import { onMount, onDestroy } from "svelte";
  import PlayerColorProvider from "$lib/components/PlayerColorProvider.svelte";
  import hotkeyService from "$lib/services/hotkeyService";
  import { gameStore } from "$lib/stores/gameStore";
  import { uiStateStore } from "$lib/stores/uiStateStore";
  import { boardStore } from "$lib/stores/boardStore";
  import { enableAllGameCheckboxesIfNeeded } from "$lib/utils/uiUtils.js";

  import {
    initializeGameHotkeys,
    cleanupGameHotkeys,
    registerGameAction,
  } from "$lib/services/gameHotkeyService";
  import { testModeStore } from "$lib/stores/testModeStore";
  import "$lib/services/commandService.ts";
  import { animationService } from "$lib/services/animationService";

  onDestroy(() => {
    logService.init("[game/+layout] onDestroy called.");
    logService.GAME_MODE(
      "Game layout is being destroyed, cleaning up game mode.",
    );
    const activeGameMode = gameModeService.getCurrentMode();
    if (activeGameMode) {
      activeGameMode.cleanup();
    }
    gameStore.reset();
    uiStateStore.reset();
    boardStore.reset();
    hotkeyService.popContext();
    cleanupGameHotkeys();
  });

  onMount(() => {
    const boardState = get(boardStore);

    if (boardState) {
      const moveHistory = boardState.moveHistory;
      logService.init(
        `[GameLayout] onMount. moveHistory.length is ${moveHistory.length}.`,
      );
      if (moveHistory.length <= 1) {
        logService.init(
          "[GameLayout] onMount: Applying initial settings for new game.",
        );
        enableAllGameCheckboxesIfNeeded();
      }
    } else {
      logService.init(
        "[GameLayout] onMount: boardStore is null (game not initialized yet). Skipping initial settings check.",
      );
    }

    hotkeyService.pushContext("game");
    initializeGameHotkeys();

    registerGameAction("auto-hide-board", () => {
      gameSettingsStore.toggleAutoHideBoard();
    });
    registerGameAction("toggle-block-mode", () => {
      gameSettingsStore.toggleBlockMode();
    });
    registerGameAction("toggle-board", () => {
      gameSettingsStore.toggleShowBoard();
    });
    registerGameAction("increase-board", () => {
      const currentSize = get(gameSettingsStore).boardSize;
      if (currentSize < 9) {
        userActionService.changeBoardSize(currentSize + 1);
      }
    });
    registerGameAction("decrease-board", () => {
      const currentSize = get(gameSettingsStore).boardSize;
      if (currentSize > 2) {
        userActionService.changeBoardSize(currentSize - 1);
      }
    });
    registerGameAction("toggle-speech", () => {
      gameSettingsStore.toggleSpeech();
    });

    if (import.meta.env.DEV || get(testModeStore)?.isEnabled) {
      (window as any).userActionService = userActionService;
      (window as any).gameModeService = gameModeService;
      (window as any).appSettingsStore = appSettingsStore;
      (window as any).gameSettingsStore = gameSettingsStore;
    }
    animationService.initialize();

    return () => {
      animationService.destroy();
    };
  });
</script>

<!-- FIX: Додано data-testid для головного контейнера ігрової сторінки -->
<div class="game-layout-container" data-testid="game-page-layout">
  <slot />
</div>

{#if $uiState.isVoiceSettingsModalOpen}
  <VoiceSettingsModal close={closeVoiceSettingsModal} />
{/if}

<PlayerColorProvider />

<style>
  .game-layout-container {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding-bottom: 24px;
  }
</style>
