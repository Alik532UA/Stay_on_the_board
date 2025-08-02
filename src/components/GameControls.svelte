<script lang="ts">
  import { gameState } from '$lib/stores/gameState.js';
  import { playerInputStore } from '$lib/stores/playerInputStore.js';
  import { settingsStore } from '$lib/stores/settingsStore.js';
  import { setDirection, setDistance, resetGame } from '$lib/services/gameLogicService.js';
  import { gameOrchestrator } from '$lib/gameOrchestrator';
  import { modalStore } from '$lib/stores/modalStore.js';
  import { logStore } from '$lib/stores/logStore.js';
  import { _ } from 'svelte-i18n';
  import { onMount } from 'svelte';
  import { derived } from 'svelte/store';
  import DirectionControls from '$lib/components/widgets/DirectionControls.svelte';
  import { getCenterInfoState } from '$lib/utils/centerInfoUtil';
  import { lastComputerMove, availableDistances, isPlayerTurn, isPauseBetweenMoves, distanceRows } from '$lib/stores/derivedState.ts';

  $: $availableDistances;
  $: $isPlayerTurn;
  $: $lastComputerMove;
  $: $isPauseBetweenMoves;
  const directionArrows = {
    'up-left': '↖',
    'up': '↑',
    'up-right': '↗',
    'left': '←',
    'right': '→',
    'down-left': '↙',
    'down': '↓',
    'down-right': '↘',
  } as const;
  type DirectionKey = keyof typeof directionArrows;
  $: selectedDirection = $playerInputStore.selectedDirection;
  $: selectedDistance = $playerInputStore.selectedDistance;

  function isDirectionKey(val: any): val is DirectionKey {
    return typeof val === 'string' && val in directionArrows;
  }

  function getCentralText() {
    if ($lastComputerMove && isDirectionKey($lastComputerMove.direction)) {
      const dir = directionArrows[$lastComputerMove.direction];
      const dist = typeof $lastComputerMove.distance === 'number' ? String($lastComputerMove.distance) : '';
      return `${dir}${dist}`;
    }
    if (selectedDirection && selectedDistance) {
      return `${isDirectionKey(selectedDirection) ? directionArrows[selectedDirection] : ''}${selectedDistance}`;
    }
    if (selectedDirection && isDirectionKey(selectedDirection)) {
      return directionArrows[selectedDirection];
    }
    return '•';
  }
  function onCentralClick() {
    if (selectedDirection && selectedDistance && isPlayerTurn) {
      onConfirmMove();
    }
  }
  $: blockModeEnabled = $settingsStore.blockModeEnabled;
  $: showMoves = $settingsStore.showMoves;
  $: showBoard = $settingsStore.showBoard;
  $: speechEnabled = $settingsStore.speechEnabled;
  $: buttonDisabled = !selectedDirection || !selectedDistance;
  $: playerRow = $gameState.playerRow;
  $: playerCol = $gameState.playerCol;
  $: console.log('[GameControls] Button state changed:', {
    selectedDirection,
    selectedDistance,
    buttonDisabled
  });
  $: centerInfoProps = getCenterInfoState({
    selectedDirection: selectedDirection as any,
    selectedDistance,
    lastComputerMove: $lastComputerMove,
    isPlayerTurn: $isPlayerTurn,
    isPauseBetweenMoves: $isPauseBetweenMoves
  });

  function handleDirection(e: CustomEvent<any>) { setDirection(e.detail); }
  function handleDistance(e: CustomEvent<any>) { setDistance(e.detail); }
  function handleCentral() { if (centerInfoProps.clickable) onConfirmMove(); }
  function handleConfirm() { onConfirmMove(); }
  function handleNoMoves() { onNoMoves(); }
  function confirmReset() {
    logStore.addLog('Запит на скидання гри', 'info');
    const buttons = [
      { text: $_('gameControls.ok'), primary: true, onClick: () => { logStore.addLog('Гру скинуто', 'info'); resetGame(); modalStore.closeModal(); } },
      { text: $_('gameControls.cancel'), onClick: modalStore.closeModal }
    ];
    modalStore.showModal({
      title: $_('gameControls.resetTitle'),
      content: $_('gameControls.resetContent'),
      buttons
    });
  }
  function onBlockModeChange() {
    settingsStore.updateSettings({ blockModeEnabled: !blockModeEnabled });
  }
  function onShowMovesChange() {
    // Видалити всі згадки про updateSettings
  }
  function onShowBoardChange() {
    // Видалити всі згадки про updateSettings
  }
  function onSpeechChange() {
    // Видалити всі згадки про updateSettings
  }
  function onDirectionClick(dir: DirectionKey) { setDirection(dir); }
  function onDistanceClick(dist: number) { setDistance(dist); }
  $: isMoveInProgress = $playerInputStore.isMoveInProgress;
  $: confirmButtonBlocked = !isPlayerTurn || isMoveInProgress || !selectedDirection || !selectedDistance;
  function onConfirmMove() {
    if (!isPlayerTurn || isMoveInProgress) {
      console.log('[GameControls] Move blocked: isPlayerTurn=', isPlayerTurn, 'isMoveInProgress=', isMoveInProgress);
      return;
    }
    if (playerRow !== null && playerCol !== null && selectedDirection && selectedDistance) {
      // movePlayer має отримати нові координати, тут потрібна логіка для їх обчислення
      // Для прикладу: movePlayer(playerRow + 1, playerCol)
      // TODO: Додати коректну логіку для обчислення цільової клітинки
      logStore.addLog('Confirm move: (логіка координат не реалізована)', 'info');
      gameOrchestrator.confirmPlayerMove();
    }
  }
  function onNoMoves() {
    gameOrchestrator.claimNoMoves();
  }
</script>

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
  {isMoveInProgress}
  blockModeEnabled={blockModeEnabled}
  confirmButtonBlocked={confirmButtonBlocked}
  centerInfoProps={centerInfoProps}
  on:direction={handleDirection}
  on:distance={handleDistance}
  on:central={handleCentral}
  on:confirm={handleConfirm}
  on:noMoves={handleNoMoves}
/>

<style>
/* Всі стилі перенесені до дочірніх компонентів */
</style> 