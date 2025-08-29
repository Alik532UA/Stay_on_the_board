<script lang="ts">
  import { userActionService } from '$lib/services/userActionService';
  import { _ } from 'svelte-i18n';
  import { gameSettingsStore } from '$lib/stores/gameSettingsStore.js';
  import SvgIcons from '../SvgIcons.svelte';
  import { get } from 'svelte/store';
  import { isPlayerTurn, isConfirmButtonDisabled, lastComputerMove, lastPlayerMove, isPauseBetweenMoves, distanceRows, previousPlayerColor } from '$lib/stores/derivedState.ts';
  import { modalStore } from '$lib/stores/modalStore.js';
  import DirectionControls from './DirectionControls.svelte';
  import { getCenterInfoState } from '$lib/utils/centerInfoUtil';
  import { logService } from '$lib/services/logService.js';
  import { uiStateStore } from '$lib/stores/uiStateStore';

  $: selectedDirection = $uiStateStore?.selectedDirection;
  $: selectedDistance = $uiStateStore?.selectedDistance;
  $: isMoveInProgress = $uiStateStore?.isComputerMoveInProgress;

  $: logService.ui('[ControlsPanelWidget] Reactive change detected', { 
    selectedDirection, 
    selectedDistance, 
    isConfirmButtonDisabled: $isConfirmButtonDisabled 
  });

  $: centerInfoProps = getCenterInfoState({
    selectedDirection: selectedDirection,
    selectedDistance,
    lastComputerMove: $lastComputerMove,
    lastPlayerMove: $lastPlayerMove,
    isPlayerTurn: $isPlayerTurn,
    isPauseBetweenMoves: $isPauseBetweenMoves,
    previousPlayerColor: $previousPlayerColor
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
        titleKey: 'modal.confirmMoveHintTitle',
        contentKey: 'modal.confirmMoveHintContent',
        buttons: [{ textKey: 'modal.ok', primary: true, isHot: true }],
        dataTestId: 'confirm-move-hint-modal'
      });
      return;
    }
    userActionService.confirmMove();
  }
</script>

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
  }
</style>

{#if $uiStateStore}
<div class="game-controls-panel" data-testid="controls-panel">
  <div class="select-direction-label">{$_('gameControls.selectDirectionAndDistance')}</div>
  <DirectionControls
    availableDirections={[
      'up-left', 'up', 'up-right',
      'left', null, 'right',
      'down-left', 'down', 'down-right'
    ]}
    distanceRows={$distanceRows}
    isPlayerTurn={$isPlayerTurn}
    blockModeEnabled={$gameSettingsStore.blockModeEnabled}
    isConfirmDisabled={$isConfirmButtonDisabled}
    centerInfoProps={centerInfoProps}
    isMoveInProgress={isMoveInProgress}
    selectedDirection={selectedDirection}
    selectedDistance={selectedDistance}
    on:direction={handleDirection}
    on:distance={handleDistance}
    on:central={handleCentral}
    on:confirm={handleConfirm}
    on:noMoves={handleNoMoves}
  />
</div>
{/if}