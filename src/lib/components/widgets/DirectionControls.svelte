<script lang="ts">
  import { createEventDispatcher, onMount, onDestroy } from "svelte";
  import { registerGameAction } from "$lib/services/gameHotkeyService";
  import { logService } from "$lib/services/logService.js";
  import hotkeyService from "$lib/services/hotkeyService";
  import { voiceControlService } from "$lib/services/voiceControlService.js";

  // FIX: Import external styles
  import "$lib/css/widgets/direction-controls.css";

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
</style>
