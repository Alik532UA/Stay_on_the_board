<script>
  import { appState, toggleBlockCell, clearComputerMove } from '$lib/stores/gameStore.js';
  import { settingsStore } from '$lib/stores/settingsStore.js';
  import { logStore } from '$lib/stores/logStore.js';
  import { modalStore } from '$lib/stores/modalStore.js';
  import SvgIcons from '../SvgIcons.svelte';
  import { slide, scale } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';

  let boardSize = $derived(Number($appState.boardSize));
  let playerRow = $derived($appState.playerRow);
  let playerCol = $derived($appState.playerCol);
  let blockedCells = $derived($appState.blockedCells);
  let blockModeEnabled = $derived($appState.blockModeEnabled);
  let showMoves = $derived($settingsStore.showMoves);
  let blockOnVisitCount = $derived($settingsStore.blockOnVisitCount);
  let activeCellVisitCounts = $derived($appState.cellVisitCounts);
  /** @type {number|null} */
  let lastRow = null;
  /** @type {number|null} */
  let lastCol = null;
  let animating = false;
  let pieceClass = 'player-piece';

  $effect(() => {
    if (playerRow !== null && playerCol !== null && (playerRow !== lastRow || playerCol !== lastCol)) {
      animating = false;
      setTimeout(() => { animating = true; pieceClass = 'player-piece animating'; }, 0);
      lastRow = playerRow;
      lastCol = playerCol;
    } else {
      pieceClass = 'player-piece';
    }
  });

  /**
   * @param {number} row
   * @param {number} col
   */
  function isAvailable(row, col) {
    return $appState.availableMoves && $appState.availableMoves.some(move => move.row === row && move.col === col);
  }

  /**
   * @param {number} row
   * @param {number} col
   */
  function isCellBlocked(row, col) {
    const visitCount = activeCellVisitCounts[`${row}-${col}`] || 0;
    return blockModeEnabled && visitCount > blockOnVisitCount;
  }

  /**
   * @param {number} row
   * @param {number} col
   */
  function getDamageClass(row, col) {
    if (!blockModeEnabled) return '';
    const visitCount = activeCellVisitCounts[`${row}-${col}`] || 0;
    if (visitCount > 0 && visitCount <= blockOnVisitCount) {
      return `cell-damage-${visitCount}`;
    }
    return '';
  }

  /**
   * @param {MouseEvent|KeyboardEvent} e
   */
  function showBoardClickHint(e) {
    if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
    modalStore.showModal({
      titleKey: 'modal.boardClickTitle',
      contentKey: 'modal.boardClickContent',
      buttons: [{ textKey: 'modal.ok', primary: true, isHot: true }]
    });
  }

  /**
   * @param {MouseEvent} event
   * @param {number} row
   * @param {number} col
   */
  function onCellRightClick(event, row, col) {
    if (!(event instanceof MouseEvent)) return;
    event.preventDefault();
    if (blockModeEnabled && !(row === playerRow && col === playerCol)) {
      const blocked = blockedCells && blockedCells.some(cell => cell.row === row && cell.col === col);
      logStore.addLog(`${blocked ? 'Розблокування' : 'Блокування'} клітинки [${row},${col}]`, 'info');
      toggleBlockCell(row, col);
    }
  }

  /**
   * @param {HTMLElement} node
   * @param {any} params
   */
  function scaleAndSlide(node, params) {
    const slideTrans = slide(node, params);
    // Явно анімуємо і scale, і opacity
    return {
      duration: params.duration,
      easing: params.easing,
      /**
       * @param {number} t
       */
      css: t => `
        ${slideTrans.css ? slideTrans.css(t, 1) : ''}
        opacity: ${t};
        transform: scale(${t});
      `
    };
  }
</script>

{#if $settingsStore.showBoard}
  <div 
    class="board-bg-wrapper game-content-block"
    style="--board-size: {boardSize}"
    on:click={showBoardClickHint} 
    on:keydown={(e) => (e.key === 'Enter' || e.key === ' ') && showBoardClickHint(e)}
    role="button"
    tabindex="0"
    aria-label="Ігрове поле"
    transition:scaleAndSlide={{ duration: 600, easing: quintOut }}
  >
    <div class="game-board" style="--board-size: {boardSize}" role="grid">
      {#each Array(boardSize) as _, rowIdx (rowIdx)}
        {#each Array(boardSize) as _, colIdx (colIdx)}
          <div
            class="board-cell {getDamageClass(rowIdx, colIdx)}"
            class:light={(rowIdx + colIdx) % 2 === 0}
            class:dark={(rowIdx + colIdx) % 2 !== 0}
            class:blocked-cell={isCellBlocked(rowIdx, colIdx)}
            class:available={showMoves && isAvailable(rowIdx, colIdx)}
            aria-label={`Cell ${rowIdx + 1}, ${colIdx + 1}`}
            on:contextmenu={(e) => onCellRightClick(e, rowIdx, colIdx)}
            role="gridcell"
            tabindex="0"
          >
            {#if getDamageClass(rowIdx, colIdx) === 'cell-damage-3'}<span class="crack-extra"></span>{/if}
            {#if isCellBlocked(rowIdx, colIdx)}
              <span class="blocked-x">✗</span>
            {:else if $settingsStore.showMoves && isAvailable(rowIdx, colIdx)}
              <span class="move-dot"></span>
            {/if}
          </div>
        {/each}
      {/each}
      
      {#if $settingsStore.showQueen && playerRow !== null && playerCol !== null}
        {#key $appState.gameId}
          <div class={pieceClass}
            style="top: {playerRow * (100 / boardSize)}%; left: {playerCol * (100 / boardSize)}%; z-index: 10;">
            <div class="piece-container"><SvgIcons name="queen" /></div>
          </div>
        {/key}
      {/if}
    </div>
  </div>
{/if} 