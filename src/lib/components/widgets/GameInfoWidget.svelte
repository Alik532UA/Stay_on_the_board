<script lang="ts">
  import { derived } from "svelte/store";
  import { gameSettingsStore } from "$lib/stores/gameSettingsStore.js";
  import { _ } from "svelte-i18n";
  import {
    lastComputerMove,
    lastPlayerMove,
    isPlayerTurn,
    isGameOver,
    isFirstMove,
  } from "$lib/stores/derivedState.ts";
  import { i18nReady } from "$lib/i18n/init.js";
  import { fade, slide } from "svelte/transition";
  import { quintOut } from "svelte/easing";
  import { playerStore } from "$lib/stores/playerStore";
  import { uiStateStore } from "$lib/stores/uiStateStore";
  import CompactComputerMove from "$lib/components/widgets/game-info/CompactComputerMove.svelte";
  import StructuredMessage from "$lib/components/widgets/game-info/StructuredMessage.svelte";

  // FIX: Import the new factory
  import {
    createGameInfoMessage,
    type GameInfoContext,
  } from "$lib/services/game-info/gameInfoMessageFactory";

  const isCompact = derived(
    gameSettingsStore,
    ($settings) => $settings.showGameInfoWidget === "compact",
  );

  const displayMessage = derived(
    [
      playerStore,
      isGameOver,
      isFirstMove,
      lastComputerMove,
      lastPlayerMove,
      isPlayerTurn,
      _,
      isCompact,
      gameSettingsStore,
      uiStateStore,
    ],
    ([
      $playerStore,
      $isGameOver,
      $isFirstMove,
      $lastComputerMove,
      $lastPlayerMove,
      $isPlayerTurn,
      $_,
      $isCompact,
      $gameSettings,
      $uiState,
    ]) => {
      // FIX: Delegate message creation to factory
      const context: GameInfoContext = {
        playerState: $playerStore,
        isGameOver: $isGameOver,
        isFirstMove: $isFirstMove,
        lastComputerMove: $lastComputerMove,
        lastPlayerMove: $lastPlayerMove,
        isPlayerTurn: $isPlayerTurn,
        translate: $_,
        isCompact: $isCompact,
        gameSettings: $gameSettings,
        uiState: $uiState,
      };

      return createGameInfoMessage(context);
    },
  );
</script>

{#if $i18nReady && $playerStore}
  {#if $gameSettingsStore.showGameInfoWidget !== "hidden"}
    <div
      class="game-info-widget"
      class:compact={$gameSettingsStore.showGameInfoWidget === "compact"}
      transition:slide={{ duration: 400, easing: quintOut }}
      data-testid="game-info-panel"
    >
      <div class="game-info-content" data-testid="game-info-content">
        {#key $displayMessage}
          <div
            class="fade-wrapper"
            in:fade={{ duration: 250, delay: 250 }}
            out:fade={{ duration: 250 }}
          >
            {#if $displayMessage.type === "COMPACT_COMPUTER_MOVE"}
              <CompactComputerMove message={$displayMessage as any} />
            {:else if $displayMessage.type === "STRUCTURED"}
              <StructuredMessage lines={$displayMessage.lines} />
            {:else}
              {$displayMessage.content}
            {/if}
          </div>
        {/key}
      </div>
    </div>
  {/if}
{/if}

<style>
  .game-info-widget {
    background: var(--bg-secondary);
    padding: 20px 12px;
    border-radius: var(--unified-border-radius);
    box-shadow: var(--dynamic-widget-shadow) var(--current-player-shadow-color);
    font-size: 1.1em;
    color: var(--text-primary, #222);
    display: flex;
    align-items: center;
    justify-content: center;
    backdrop-filter: var(--unified-backdrop-filter);
    border: var(--unified-border);
    /* overflow: hidden; -- видаляємо, щоб slide працював коректно */
  }

  .game-info-content {
    font-weight: 500;
    line-height: 1.4;
    width: 100%;
    word-wrap: break-word;
    white-space: pre-line;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    position: relative; /* Батьківський елемент для абсолютно позиціонованої обгортки */
    min-height: 50px; /* Задаємо мінімальну висоту, щоб уникнути стрибків розміру */
  }

  .fade-wrapper {
    /* Робимо обгортку абсолютною, щоб стара і нова версії могли анімуватися одна над одною */
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 100%;
  }
</style>
