<script lang="ts">
  import { userActionService } from "$lib/services/userActionService";
  import { t } from "$lib/i18n/typedI18n";
  import { gameSettingsStore } from "$lib/stores/gameSettingsStore.js";
  import {
    isPlayerTurn,
    isConfirmButtonDisabled,
    lastComputerMove,
    lastPlayerMove,
    distanceRows,
    previousPlayerColor,
  } from "$lib/stores/derivedState";
  import { modalStore } from "$lib/stores/modalStore";
  import DirectionControls from "./DirectionControls.svelte";
  import SimpleModalContent from "$lib/components/modals/SimpleModalContent.svelte";
  import { getCenterInfoState } from "$lib/utils/centerInfoUtil";
  import { logService } from "$lib/services/logService.js";
  import { uiStateStore } from "$lib/stores/uiStateStore";
  import { voiceControlStore } from "$lib/stores/voiceControlStore";
  import { debugLogStore } from "$lib/stores/debugLogStore";

  let showDebug = false;
  let clickCount = 0;
  let clickTimer: NodeJS.Timeout;

  $: selectedDirection = $uiStateStore?.selectedDirection;
  $: selectedDistance = $uiStateStore?.selectedDistance;
  $: isMoveInProgress = $uiStateStore?.isComputerMoveInProgress;

  $: logService.ui("[ControlsPanelWidget] Reactive change detected", {
    selectedDirection,
    selectedDistance,
    isConfirmButtonDisabled: $isConfirmButtonDisabled,
  });

  $: centerInfoProps = getCenterInfoState({
    selectedDirection: selectedDirection,
    selectedDistance,
    lastComputerMove: $lastComputerMove,
    lastPlayerMove: $lastPlayerMove,
    isPlayerTurn: $isPlayerTurn,
    previousPlayerColor: $previousPlayerColor,
  });

  function handleDirection(e: CustomEvent<any>) {
    logService.action(`Click: "Напрямок: ${e.detail}" (ControlsPanelWidget)`);
    userActionService.selectDirection(e.detail);
  }
  function handleDistance(e: CustomEvent<any>) {
    logService.action(`Click: "Відстань: ${e.detail}" (ControlsPanelWidget)`);
    userActionService.selectDistance(e.detail);
  }
  function handleCentral() {
    logService.action('Click: "Центральна кнопка" (ControlsPanelWidget)');
    if (centerInfoProps.clickable) onConfirmClick();
  }
  function handleConfirm() {
    logService.action('Click: "Підтвердити хід" (ControlsPanelWidget)');
    onConfirmClick();
  }
  function handleNoMoves() {
    logService.action('Click: "Ходів немає" (ControlsPanelWidget)');
    userActionService.claimNoMoves();
  }

  function onConfirmClick() {
    if ($isConfirmButtonDisabled) {
      modalStore.showModal({
        component: SimpleModalContent,
        variant: "menu",
        dataTestId: "confirm-move-hint-modal",
        props: {
          titleKey: "modal.confirmMoveHintTitle" as const,
          contentKey: "modal.confirmMoveHintContent" as const,
          actions: [
            {
              labelKey: "modal.ok" as const,
              variant: "primary",
              isHot: true,
              onClick: () => modalStore.closeModal(),
              dataTestId: "confirm-move-hint-ok-btn",
            },
          ],
        },
      });
      return;
    }
    userActionService.confirmMove();
  }

  function handleLabelClick() {
    clearTimeout(clickTimer);
    clickCount++;
    if (clickCount === 3) {
      showDebug = !showDebug;
      clickCount = 0;
      if (showDebug) {
        logService.forceEnableLogging();
      }
    }
    clickTimer = setTimeout(() => {
      clickCount = 0;
    }, 1000);
  }

  function copyLogs() {
    const voiceTranscript =
      document.getElementById("voice-transcript")?.innerText || "";
    const recognitionError =
      document.getElementById("recognition-error")?.innerText || "";
    const generalLogs =
      document.getElementById("general-logs")?.innerText || "";

    const fullLog = `---
Voice Transcript ---
${voiceTranscript}

--- Recognition Error ---
${recognitionError}

--- General Logs ---
${generalLogs}`;

    navigator.clipboard.writeText(fullLog);
    logService.ui("[ControlsPanelWidget] Copied full debug log to clipboard.");
  }

  function clearLogs() {
    debugLogStore.clear();
  }
</script>

{#if $uiStateStore}
  <div class="game-controls-panel" data-testid="controls-panel">
    <!-- FIX: Додано data-testid для заголовка, який вмикає дебаг -->
    <div
      class="select-direction-label"
      on:click={handleLabelClick}
      on:keydown={handleLabelClick}
      role="button"
      tabindex="0"
      data-testid="controls-panel-title"
    >
      {$t("gameControls.selectDirectionAndDistance")}
    </div>
    <DirectionControls
      availableDirections={[
        "up-left",
        "up",
        "up-right",
        "left",
        null,
        "right",
        "down-left",
        "down",
        "down-right",
      ]}
      distanceRows={$distanceRows}
      isPlayerTurn={$isPlayerTurn}
      blockModeEnabled={$gameSettingsStore.blockModeEnabled}
      isConfirmDisabled={$isConfirmButtonDisabled}
      {centerInfoProps}
      {isMoveInProgress}
      {selectedDirection}
      {selectedDistance}
      on:direction={handleDirection}
      on:distance={handleDistance}
      on:central={handleCentral}
      on:confirm={handleConfirm}
      on:noMoves={handleNoMoves}
    />
    {#if showDebug}
      <div class="debug-panel" data-testid="voice-debug-panel">
        <div class="debug-controls">
          <button class="debug-btn" on:click={copyLogs}>Copy</button>
          <button class="debug-btn" on:click={clearLogs}>Clear</button>
        </div>
        <p>Recognized Text:</p>
        <pre id="voice-transcript">{$voiceControlStore.lastTranscript ||
            "No speech detected yet."}</pre>
        {#if $voiceControlStore.recognitionError}
          <p>Recognition Error Details:</p>
          <pre id="recognition-error">{JSON.stringify(
              $voiceControlStore.recognitionError,
              null,
              2,
            )}</pre>
        {/if}
        <p>--- General Logs ---</p>
        <div id="general-logs" class="logs-container">
          {#each $debugLogStore as log, i (i)}
            <div class="log-entry">{log}</div>
          {/each}
        </div>
      </div>
    {/if}
  </div>
{/if}

<style>
  .game-controls-panel {
    background: var(--bg-secondary);
    box-shadow: var(--dynamic-widget-shadow) var(--current-player-shadow-color);
    border-radius: var(--unified-border-radius);
    padding: 24px 18px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 18px;
    width: 100%;
    box-sizing: border-box;
    backdrop-filter: var(--unified-backdrop-filter);
    border: var(--unified-border);
  }

  .select-direction-label {
    width: 100%;
    text-align: center;
    font-size: 1.13em;
    font-weight: 500;
    margin-bottom: 6px;
    color: var(--text-primary);
    cursor: pointer;
  }

  .debug-panel {
    width: 100%;
    margin-top: 10px;
    padding: 10px;
    background-color: #2c2c2c; /* Slightly lighter dark */
    color: #f0f0f0; /* Lighter text */
    border-radius: 8px; /* Softer corners */
    font-family: monospace;
    position: relative;
    border: var(--global-border-width) solid #444;
    max-height: 400px; /* Limit height */
    overflow-y: auto; /* Allow scrolling */
    font-size: 0.85em;
  }

  .debug-controls {
    position: absolute;
    top: 5px;
    right: 5px;
    display: flex;
    gap: 5px;
  }

  .debug-btn {
    background: #555;
    border: none;
    color: white;
    padding: 5px 10px;
    border-radius: 5px;
    cursor: pointer;
  }

  .debug-btn:hover {
    background: #777;
  }

  .logs-container {
    margin-top: 10px;
    padding-top: 10px;
    border-top: 1px solid #555;
    white-space: pre-wrap; /* Wrap long log lines */
    word-break: break-all; /* Break long words */
  }

  .log-entry {
    padding: 2px 0;
    border-bottom: 1px dotted #444;
  }

  .log-entry:last-child {
    border-bottom: none;
  }
</style>
