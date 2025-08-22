<!--
ВАЖЛИВО! Архітектурний принцип: пауза (затримка) після ходу гравця реалізується лише у візуалізації дошки (animationStore),
логіка гри та center-info оновлюються миттєво і не залежать від цієї паузи. Це гарантує SoC, SSoT, UDF.
-->
<script lang="ts">
  // ВАЖЛИВО! Заборонено напряму змінювати moveQueue або board з UI-компонента!
  // Компонент лише спостерігає за станом гри і ініціює анімацію через animationStore.
  // Всі зміни логіки гри — лише через оркестратор/сервіси.
  //
  // IMPORTANT: Never mutate moveQueue or board directly from UI! This component only observes state and triggers animation.
  import { gameState } from '$lib/stores/gameState.js';
  import { settingsStore } from '$lib/stores/settingsStore.js';

  import { modalStore } from '$lib/stores/modalStore.js';
  import SvgIcons from '../SvgIcons.svelte';
  import { safeScale } from '$lib/utils/transitions.ts';
  import { quintOut } from 'svelte/easing';
  import { isCellBlocked, getDamageClass } from '$lib/utils/boardUtils.ts';
  import { animationStore } from '$lib/stores/animationStore.js';
  import { visualPosition, visualCellVisitCounts, visualBoardState, currentPlayer, availableMoves } from '$lib/stores/derivedState.ts';
  import { derived } from 'svelte/store';
  import { get } from 'svelte/store';
  import { onMount } from 'svelte';
  import { uiEffectsStore } from '$lib/stores/uiEffectsStore.js';
  import BoardCell from './BoardCell.svelte';
  import PlayerPiece from './PlayerPiece.svelte';
  import { logService } from '$lib/services/logService.js';
  import { enableAllGameCheckboxesIfNeeded } from '$lib/utils/uiUtils.ts';

  const boardSize = derived(gameState, $gameState => $gameState ? Number($gameState.boardSize) : 0);

  onMount(() => {
    // Зберігаємо попередню позицію для виявлення змін після ходу гравця (SSoT в gameState)
    let lastRow: number | null = null;
    let lastCol: number | null = null;

    const unsubscribe = gameState.subscribe(($gameState) => {
      if (!$gameState) return;

      // Ініціалізація та пропуск на першому ході
      if ($gameState.isFirstMove) {
        lastRow = $gameState.playerRow;
        lastCol = $gameState.playerCol;
        return;
      }

      // Вмикаємо чекбокси при старті нової гри
      if ($gameState.moveHistory.length === 1) {
        enableAllGameCheckboxesIfNeeded();
      }

      // НАВІЩО: Реакція на зміну позиції гравця для автоприховування дошки.
      if (
        get(settingsStore).autoHideBoard &&
        get(settingsStore).showBoard &&
        ($gameState.playerRow !== lastRow || $gameState.playerCol !== lastCol) &&
        $gameState.moveHistory.length > 1
      ) {
        uiEffectsStore.autoHideBoard(0);
        lastRow = $gameState.playerRow;
        lastCol = $gameState.playerCol;
      }

      // --- Після автоприховування дошки ---
      // Показуємо дошку після очищення moveQueue, але не під час ходу комп'ютера
      if (
        $gameState.moveQueue &&
        $gameState.moveQueue.length === 0 &&
        $gameState.moveHistory.length > 1 &&
        !$gameState.isComputerMoveInProgress
      ) {
        enableAllGameCheckboxesIfNeeded();
      }
    });
    return unsubscribe;
  });

  let prevGameId: number|null = null;
  // Видаляємо prevMoveQueueLength, оскільки анімація тепер керується через animationStore
  // НАВІЩО: Відстежуємо зміну gameId для скидання стану при новій грі.
  gameState.subscribe(($gameState) => {
    if (!$gameState) {
      prevGameId = null;
      return;
    }
    // Якщо нова гра — скидаємо лічильник
    if ($gameState.gameId !== prevGameId) {
      prevGameId = $gameState.gameId;
      logService.ui('[BoardWrapperWidget] Нова гра, скидаємо стан');
    }
    // Анімація тепер керується через animationStore.visualMoveQueue
    // Не потрібно викликати animateLastMove тут
  });

  const showAvailableMoves = derived(
    [settingsStore, animationStore, currentPlayer],
    ([$settingsStore, $animationStore, $currentPlayer]) => {
      return (
        $settingsStore.showMoves &&
        !$animationStore.isAnimating &&
        $currentPlayer?.type === 'human' &&
        $animationStore.isComputerMoveCompleted
      );
    }
  );

  function getMoveInfo(row: number, col: number) {
    if (!$showAvailableMoves) {
      return { isAvailable: false, isPenalty: false };
    }

    const move = get(availableMoves).find(m => m.row === row && m.col === col);

    if (move) {
      return {
        isAvailable: true,
        isPenalty: move.isPenalty || false
      };
    }
    
    return { isAvailable: false, isPenalty: false };
  }

  function showBoardClickHint(e: Event) {
    if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
    modalStore.showModal({
      titleKey: 'modal.boardClickTitle',
      contentKey: 'modal.boardClickContent',
      buttons: [{ textKey: 'modal.ok', primary: true, isHot: true }],
      dataTestId: 'board-click-modal'
    });
  }

  function onCellRightClick(event: MouseEvent, row: number, col: number): void {
    event.preventDefault();
    if ($gameState && $settingsStore.blockModeEnabled && !(row === $gameState.playerRow && col === $gameState.playerCol)) {
      const visualCounts = get(visualCellVisitCounts);
      const blocked = isCellBlocked(row, col, visualCounts, $settingsStore);
      logService.ui(`${blocked ? 'Розблокування' : 'Блокування'} клітинки [${row},${col}]`);
    }
  }

</script>

{#if $gameState}
  {#key $gameState.gameId}
    {#if $settingsStore.showBoard}
      <div
        class="board-bg-wrapper game-content-block"
        style="--board-size: {$boardSize}"
        onclick={showBoardClickHint}
        onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && showBoardClickHint(e)}
        role="button"
        tabindex="0"
        aria-label="Ігрове поле"
        transition:safeScale={{ duration: 600, easing: quintOut }}
      >
        <div class="game-board" style="--board-size: {$boardSize}" role="grid" data-testid="game-board">
          {#each Array($boardSize) as _, rowIdx (rowIdx)}
            {#each Array($boardSize) as _, colIdx (colIdx)}
              {@const moveInfo = getMoveInfo(rowIdx, colIdx)}
              <BoardCell
                {rowIdx}
                {colIdx}
                visualCellVisitCounts={$visualCellVisitCounts}
                settingsStore={$settingsStore}
                isAvailable={moveInfo.isAvailable}
                isPenalty={moveInfo.isPenalty}
                visualPosition={$visualPosition}
                boardState={$visualBoardState}
                gameState={$gameState}
                on:cellRightClick={(e) => onCellRightClick(e.detail.event, e.detail.row, e.detail.col)}
              />
            {/each}
          {/each}
          
          {#if $settingsStore.showPiece && $visualPosition.row !== null && $visualPosition.col !== null}
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

</style>