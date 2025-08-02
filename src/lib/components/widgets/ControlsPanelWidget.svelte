<script lang="ts">
  import { gameState } from '$lib/stores/gameState.js';
  import { playerInputStore } from '$lib/stores/playerInputStore.js';
  import { setDirection, setDistance } from '$lib/services/gameLogicService.js';
  import { gameOrchestrator } from '$lib/gameOrchestrator';
  import { _ } from 'svelte-i18n';
  import { settingsStore } from '$lib/stores/settingsStore.js';
  import SvgIcons from '../SvgIcons.svelte';
  import { get } from 'svelte/store';
  import { availableDistances, isPlayerTurn, isConfirmButtonDisabled, lastComputerMove, isPauseBetweenMoves, distanceRows } from '$lib/stores/derivedState.ts';
  import { modalStore } from '$lib/stores/modalStore.js';
  import DirectionControls from './DirectionControls.svelte';
  import { getCenterInfoState } from '$lib/utils/centerInfoUtil';

  $: $availableDistances;
  $: $isPlayerTurn;
  $: $isConfirmButtonDisabled;
  $: $lastComputerMove;
  $: $isPauseBetweenMoves;

  $: selectedDirection = $playerInputStore.selectedDirection;
  $: selectedDistance = $playerInputStore.selectedDistance;

  $: centerInfoProps = getCenterInfoState({
    selectedDirection: selectedDirection as any,
    selectedDistance,
    lastComputerMove: $lastComputerMove,
    isPlayerTurn: $isPlayerTurn,
    isPauseBetweenMoves: $isPauseBetweenMoves
  });

  function handleDirection(e: CustomEvent<any>) { setDirection(e.detail); }
  function handleDistance(e: CustomEvent<any>) { setDistance(e.detail); }
  function handleCentral() { if (centerInfoProps.clickable) onConfirmClick(); }
  function handleConfirm() { onConfirmClick(); }
  function handleNoMoves() { gameOrchestrator.claimNoMoves(); }
  
  function onConfirmClick() {
    if ($isConfirmButtonDisabled) {
      modalStore.showModal({
        titleKey: 'modal.confirmMoveHintTitle',
        contentKey: 'modal.confirmMoveHintContent',
        buttons: [{ textKey: 'modal.ok', primary: true, isHot: true }]
      });
      return;
    }
    gameOrchestrator.confirmPlayerMove();
  }
</script>

<style>
  .game-controls-panel {
    background: var(--bg-secondary);
    box-shadow: var(--unified-shadow);
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

<div class="game-controls-panel">
  <div class="select-direction-label">{$_('gameControls.selectDirectionAndDistance')}</div>
  <DirectionControls
    {selectedDirection}
    {selectedDistance}
    availableDirections={[
      'up-left', 'up', 'up-right',
      'left', null, 'right',
      'down-left', 'down', 'down-right'
    ]}
    distanceRows={$distanceRows}
    isPlayerTurn={$isPlayerTurn}
    isMoveInProgress={false}
    blockModeEnabled={$settingsStore.blockModeEnabled}
    confirmButtonBlocked={$isConfirmButtonDisabled}
    centerInfoProps={centerInfoProps}
    on:direction={handleDirection}
    on:distance={handleDistance}
    on:central={handleCentral}
    on:confirm={handleConfirm}
    on:noMoves={handleNoMoves}
  />
</div> 