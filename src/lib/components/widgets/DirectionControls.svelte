<script lang="ts">
  import { createEventDispatcher, onMount, onDestroy } from "svelte";
  import { registerGameAction } from "$lib/services/gameHotkeyService";
  import { logService } from "$lib/services/logService.js";
  import hotkeyService from "$lib/services/hotkeyService";
  import { voiceControlService } from "$lib/services/voiceControlService.js";

  import DirectionGrid from "./controls/DirectionGrid.svelte";
  import DistanceSelector from "./controls/DistanceSelector.svelte";
  import ActionButtons from "./controls/ActionButtons.svelte";

  export let isMoveInProgress = false;
  export let selectedDirection = null;
  export let selectedDistance = null;

  export const availableDirections: string[] = [
    "up-left",
    "up",
    "up-right",
    "left",
    null,
    "right",
    "down-left",
    "down",
    "down-right",
  ];
  export let distanceRows: number[][] = [];
  export let isPlayerTurn: boolean = false;
  export let blockModeEnabled: boolean = false;
  export let centerInfoProps: any = {};
  export let isConfirmDisabled: boolean = false;

  const dispatch = createEventDispatcher();

  const isVoiceSupported = voiceControlService.isApiSupported;
  let isIos = false;

  $: controlsDisabled = isMoveInProgress || !isPlayerTurn;
  $: confirmButtonBlocked =
    isConfirmDisabled || !selectedDirection || !selectedDistance;

  onMount(() => {
    isIos = /iPhone|iPad|iPod/i.test(navigator.userAgent);

    availableDirections.forEach((dir) => {
      if (dir) {
        registerGameAction(
          dir as import("$lib/stores/gameSettingsStore").KeybindingAction,
          () => handleDirection(dir),
        );
      }
    });

    registerGameAction("confirm", handleConfirm);
    registerGameAction("no-moves", handleNoMoves);
  });

  $: {
    if (distanceRows && distanceRows.length > 0) {
      distanceRows.flat().forEach((dist) => {
        registerGameAction(`distance-${dist}` as any, () =>
          handleDistance(dist),
        );
      });
    }
  }

  function handleDirection(dir: string) {
    if (controlsDisabled) return;
    logService.action(`Click: "Напрямок: ${dir}" (DirectionControls)`);
    dispatch("direction", dir);
  }
  function handleDistance(dist: number) {
    if (controlsDisabled) return;
    logService.action(`Click: "Відстань: ${dist}" (DirectionControls)`);
    dispatch("distance", dist);
  }
  function handleCentral() {
    if (controlsDisabled) return;
    logService.action('Click: "Центральна кнопка" (DirectionControls)');
    dispatch("central");
  }
  function handleConfirm() {
    if (controlsDisabled) return;
    logService.action('Click: "Підтвердити хід" (DirectionControls)');
    dispatch("confirm");
  }
  function handleNoMoves() {
    if (controlsDisabled) return;
    logService.action(`Click: "Ходів немає" (DirectionControls)`);
    dispatch("noMoves");
  }
  function handleVoiceCommand() {
    if (controlsDisabled) return;
    logService.action(`Click: "Голосова команда" (DirectionControls)`);
    voiceControlService.toggleListening();
  }
</script>

<div class="direction-controls-panel">
  <DirectionGrid
    {selectedDirection}
    disabled={controlsDisabled}
    {centerInfoProps}
    on:direction={(e) => handleDirection(e.detail)}
    on:central={handleCentral}
  />

  <DistanceSelector
    {distanceRows}
    {selectedDistance}
    disabled={controlsDisabled}
    on:distance={(e) => handleDistance(e.detail)}
  />

  <ActionButtons
    confirmDisabled={confirmButtonBlocked}
    {blockModeEnabled}
    {isVoiceSupported}
    disabled={controlsDisabled}
    {isIos}
    on:confirm={handleConfirm}
    on:noMoves={handleNoMoves}
    on:voiceCommand={handleVoiceCommand}
  />
</div>

<style>
  .direction-controls-panel {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 18px;
    width: 100%;
  }

  /* Глобальні стилі для кнопок, які використовуються в підкомпонентах */
  :global(.dir-btn),
  :global(.dist-btn),
  :global(.control-btn) {
    border-radius: 16px;
    border: var(--global-border-width) solid var(--border-color, #444);
    background: var(--control-bg, #222);
    color: var(--text-primary, #fff);
    cursor: pointer;
    transition:
      background 0.25s,
      box-shadow 0.25s,
      color 0.2s,
      transform 0.15s,
      border-color 0.25s;
    box-shadow: 0 2px 16px 0 var(--shadow-color, #0002);
    backdrop-filter: blur(6px);
    outline: none;
    position: relative;
    z-index: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2em;
    width: 70px;
    height: 70px;
    font-family: "M PLUS Rounded 1c", sans-serif !important;
  }
  :global(.dir-btn:disabled),
  :global(.dist-btn:disabled),
  :global(.control-btn:disabled),
  :global(.confirm-btn:disabled),
  :global(.no-moves-btn:disabled),
  :global(.voice-btn:disabled) {
    opacity: 0.5;
    cursor: not-allowed;
    pointer-events: none;
  }
  :global(.dir-btn.active) {
    background: var(--control-selected, #ff9800);
    color: var(--control-selected-text, #fff);
    border-color: var(--control-selected, #ff9800);
    transform: scale(1.1);
    box-shadow: 0 4px 24px 0 var(--shadow-color, #0004);
  }
  :global(.control-btn.center-info.confirm-btn-active) {
    background: #43a047 !important;
    color: #fff !important;
  }
  :global(#center-info) {
    border: none !important;
    font-family: "M PLUS Rounded 1c", sans-serif !important;
  }
  :global(
      #center-info:not(.confirm-btn-active):not(.computer-move-display):not(
          .direction-distance-state
        )
    ) {
    background: transparent !important;
  }
  :global(#center-info.confirm-btn-active) {
    background: #43a047 !important;
    color: #fff !important;
    border-color: #43a047 !important;
    animation: pulse-green 1.5s infinite !important;
    cursor: pointer !important;
  }
  @keyframes pulse-green {
    0% {
      box-shadow: 0 0 0 0 #43a047;
    }
    70% {
      box-shadow: 0 0 0 10px rgba(67, 160, 71, 0.2);
    }
    100% {
      box-shadow: 0 0 0 0 #43a047;
    }
  }
  :global(#center-info.confirm-btn-active:hover) {
    background: #2e7d32 !important;
    border-color: #2e7d32 !important;
    transform: scale(1.02);
  }
  :global(#center-info.computer-move-display) {
    background: orange !important;
    color: #fff !important;
    font-weight: bold !important;
    border: none !important;
    cursor: default !important;
  }
  :global(.dist-btn) {
    width: 50px;
    height: 50px;
    font-size: 1.5em;
    border-radius: 16px;
    border: var(--global-border-width) solid var(--border-color, #444);
    background: var(--control-bg, #222);
    color: var(--text-primary, #fff);
    cursor: pointer;
    transition:
      background 0.25s,
      color 0.2s,
      transform 0.15s;
  }
  :global(.dist-btn.active) {
    background: var(--control-selected, #ff9800);
    color: var(--control-selected-text, #fff);
    border-color: var(--control-selected, #ff9800);
    transform: scale(1.1);
  }
  :global(.confirm-btn),
  :global(.no-moves-btn),
  :global(.voice-btn) {
    background: #43a047cc;
    color: #fff;
    border: none;
    border-radius: 12px;
    min-height: 52px;
    width: 90%;
    font-weight: bold;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    transition:
      background 0.25s,
      transform 0.15s;
  }
  :global(.confirm-btn.disabled) {
    background: rgba(85, 85, 85, 0.3);
    color: #999;
    cursor: pointer;
  }
  :global(.confirm-btn:not(.disabled):hover) {
    background: #2e7d32;
    transform: scale(1.02);
  }
  :global(.no-moves-btn) {
    background: #ffb300;
    color: #222;
  }
  :global(.no-moves-btn:hover) {
    background: #f57c00;
    transform: scale(1.02);
  }
  :global(.voice-btn) {
    background: #00bcd4;
    color: #fff;
  }
  :global(.voice-btn:hover) {
    background: #0097a7;
    transform: scale(1.02);
  }
  :global(.voice-btn.active) {
    background: #e53935;
    color: #fff;
  }
  :global(.voice-btn:disabled) {
    background: #757575;
    cursor: not-allowed;
  }
  :global(.voice-btn:disabled:hover) {
    background: #757575;
    transform: none;
  }
</style>
