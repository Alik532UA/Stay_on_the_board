<!--
ВАЖЛИВО! Архітектурний принцип: пауза (затримка) після ходу гравця реалізується лише у візуалізації дошки (animationStore),
логіка гри та center-info оновлюються миттєво і не залежать від цієї паузи. Це гарантує SoC, SSoT, UDF.
-->
<script lang="ts">
  import { gameSettingsStore, type GameSettingsState } from '$lib/stores/gameSettingsStore.js';
  import { modalStore } from '$lib/stores/modalStore.js';
  import { slide } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';
  import { animationStore } from '$lib/stores/animationStore.js';
  import { visualPosition, visualCellVisitCounts, currentPlayer, availableMoves } from '$lib/stores/derivedState.ts';
  import { derived, get } from 'svelte/store';
  import { onMount } from 'svelte';
  import { uiEffectsStore } from '$lib/stores/uiEffectsStore.js';
  import BoardCell from './BoardCell.svelte';
  import PlayerPiece from './PlayerPiece.svelte';
  import { logService } from '$lib/services/logService.js';
  import { enableAllGameCheckboxesIfNeeded } from '$lib/utils/uiUtils.ts';
  import { isCellBlocked, getDamageClass } from '$lib/utils/boardUtils.ts';
  import { boardStore } from '$lib/stores/boardStore';
  import { uiStateStore } from '$lib/stores/uiStateStore';

  const boardSize = derived(boardStore, $boardStore => $boardStore ? Number($boardStore.boardSize) : 0);

  function slideAndScale(node: HTMLElement, params: any) {
    const slideTransition = slide(node, params);
    return {
      duration: params.duration,
      easing: params.easing,
      css: (t: number, u: number) => `
        ${slideTransition.css ? slideTransition.css(t, u) : ''}
        transform-origin: top center;
        transform: scale(${t});
      `
    };
  }

  onMount(() => {
    let lastRow: number | null = null;
    let lastCol: number | null = null;

    const unsubscribe = boardStore.subscribe(($boardStore) => {
      if (!$boardStore) return;
      const $uiState = get(uiStateStore);
      if (!$uiState) return;

      if ($uiState.isFirstMove) {
        lastRow = $boardStore.playerRow;
        lastCol = $boardStore.playerCol;
        return;
      }

      if ($boardStore.moveHistory.length === 1 && $uiState.isFirstMove) {
        enableAllGameCheckboxesIfNeeded();
      }

      if (
        get(gameSettingsStore).autoHideBoard &&
        get(gameSettingsStore).showBoard &&
        ($boardStore.playerRow !== lastRow || $boardStore.playerCol !== lastCol) &&
        $boardStore.moveHistory.length > 1
      ) {
        uiEffectsStore.autoHideBoard(0);
        lastRow = $boardStore.playerRow;
        lastCol = $boardStore.playerCol;
      }

      if (
        $boardStore.moveQueue &&
        $boardStore.moveQueue.length === 0 &&
        $boardStore.moveHistory.length > 1 &&
        !$uiState.isComputerMoveInProgress
      ) {
        enableAllGameCheckboxesIfNeeded();
      }
    });
    return unsubscribe;
  });

  const showAvailableMoves = derived(
    [gameSettingsStore, animationStore, currentPlayer],
    ([$gameSettingsStore, $animationStore, $currentPlayer]) => {
      return (
        $gameSettingsStore.showMoves &&
        !$animationStore.isAnimating &&
        $currentPlayer?.type === 'human'
      );
    }
  );

  

  function showBoardClickHint(e: Event) {
    if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
    modalStore.showModal({
      titleKey: 'modal.boardClickTitle',
      contentKey: 'modal.boardClickContent',
      buttons: [{ textKey: 'modal.ok', primary: true, isHot: true }],
      dataTestId: 'board-click-modal'
    });
  }

  function handleBoardWrapperKeyDown(event: KeyboardEvent) {
    if (event.code === 'Enter' || event.code === 'Space') {
      showBoardClickHint(event);
    }
  }

  function onCellRightClick(event: MouseEvent, row: number, col: number): void {
    event.preventDefault();
    const $boardState = get(boardStore);
    const $settings = get(gameSettingsStore);
    if ($boardState && $settings.blockModeEnabled && !(row === $boardState.playerRow && col === $boardState.playerCol)) {
      const visualCounts = get(visualCellVisitCounts) as Record<string, number>;
      const blocked = isCellBlocked(row, col, visualCounts, $settings);
      logService.ui(`${blocked ? 'Розблокування' : 'Блокування'} клітинки [${row},${col}]`);
    }
  }
</script>

{#if $boardStore}
  {#key $boardStore.boardSize}
    {#if $gameSettingsStore.showBoard}
      <div
        class="board-bg-wrapper game-content-block"
        style="--board-size: {$boardSize}"
        on:click={showBoardClickHint}
        on:keydown={handleBoardWrapperKeyDown}
        role="button"
        tabindex="0"
        aria-label="Ігрове поле"
        transition:slideAndScale={{ duration: 500, easing: quintOut }}
      >
        <div class="game-board" style="--board-size: {$boardSize}" role="grid" data-testid="game-board">
          {#each Array($boardSize) as _, rowIdx (rowIdx)}
            {#each Array($boardSize) as _, colIdx (colIdx)}
              {@const move = $showAvailableMoves ? $availableMoves.find(m => m.row === rowIdx && m.col === colIdx) : undefined}
              <BoardCell
                {rowIdx}
                {colIdx}
                visualCellVisitCounts={$visualCellVisitCounts}
                gameSettings={$gameSettingsStore}
                isAvailable={!!move}
                isPenalty={move?.isPenalty || false}
                on:cellRightClick={(e) => onCellRightClick(e.detail.event, e.detail.row, e.detail.col)}
              />
            {/each}
          {/each}
          
          {#if $gameSettingsStore.showPiece && $visualPosition.row !== null && $visualPosition.col !== null}
            <PlayerPiece
              row={$visualPosition.row}
              col={$visualPosition.col}
              boardSize={$boardSize}
            />
          {/if}
        </div>
      </div>
    {/if}
  {/key}
{/if}

<style>
  /* Стилі залишаються без змін */
</style>