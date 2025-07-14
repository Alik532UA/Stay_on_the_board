<script>
  import '../css/components/game-board.css';
  import { appState, setBoardSize, movePlayer, toggleBlockCell, makeComputerMove } from '../stores/gameStore.js';
  import { logStore } from '../stores/logStore.js';
  import { goto } from '$app/navigation';
  import GameControls from './GameControls.svelte';
  import Modal from './Modal.svelte';
  import { get } from 'svelte/store';
  let boardSizes = Array.from({length:8},(_,i)=>i+2);
  /** @type {number} */
  let boardSize;
  /** @type {number[][]} */
  let board;
  /** @type {number} */
  let playerRow;
  /** @type {number} */
  let playerCol;
  /** @type {{row:number,col:number}[]} */
  let availableMoves;
  /** @type {{row:number,col:number}[]} */
  let blockedCells;
  /** @type {boolean} */
  let blockModeEnabled;

  $: boardSize = $appState.boardSize;
  $: board = $appState.board;
  $: playerRow = $appState.playerRow;
  $: playerCol = $appState.playerCol;
  $: availableMoves = $appState.availableMoves;
  $: blockedCells = $appState.blockedCells;
  $: blockModeEnabled = $appState.blockModeEnabled;

  function goToMainMenu() {
    logStore.addLog('Повернення до головного меню', 'info');
    goto('/');
  }

  function onBoardSizeChange(/** @type {Event} */ event) {
    const newSize = +/** @type {HTMLSelectElement} */(event.target).value;
    logStore.addLog(`Зміна розміру дошки на ${newSize}x${newSize}`, 'info');
    setBoardSize(newSize);
  }

  function isAvailable(/** @type {number} */ row, /** @type {number} */ col) {
    return availableMoves && availableMoves.some(move => move.row === row && move.col === col);
  }

  function isBlocked(/** @type {number} */ row, /** @type {number} */ col) {
    return blockedCells && blockedCells.some(cell => cell.row === row && cell.col === col);
  }

  function onCellClick(/** @type {number} */ row, /** @type {number} */ col) {
    if (isAvailable(row, col) && !isBlocked(row, col)) {
      logStore.addLog(`Рух гравця на клітинку [${row},${col}]`, 'info');
      movePlayer(row, col);
      // Якщо режим vsComputer — хід комп'ютера після гравця
      if ($appState.gameMode === 'vsComputer') {
        makeComputerMove();
      }
    }
  }

  function onCellRightClick(/** @type {Event} */ event, /** @type {number} */ row, /** @type {number} */ col) {
    event.preventDefault();
    if (blockModeEnabled && !(row === playerRow && col === playerCol)) {
      const blocked = blockedCells && blockedCells.some(cell => cell.row === row && cell.col === col);
      logStore.addLog(`${blocked ? 'Розблокування' : 'Блокування'} клітинки [${row},${col}]`, 'info');
      toggleBlockCell(row, col);
    }
  }
</script>

<div class="game-board-container">
  <div class="game-board-top-row">
    <button class="main-menu-btn" title="Головне меню" on:click={goToMainMenu}>
      <img src="/MainMenu.png" alt="Головне меню" class="main-menu-btn-img" />
    </button>
    <select class="board-size-select" bind:value={boardSize} on:change={onBoardSizeChange}>
      {#each boardSizes as n}
        <option value={n}>{n}x{n}</option>
      {/each}
    </select>
  </div>
  <div class="board-bg-wrapper">
    <div class="game-board">
      {#if board}
        {#each board as row, rowIdx}
          <div class="board-row">
            {#each row as cell, colIdx}
              <div class="board-cell {isAvailable(rowIdx, colIdx) ? 'available' : ''} {isBlocked(rowIdx, colIdx) ? 'blocked' : ''}"
                   on:click={() => onCellClick(rowIdx, colIdx)}
                   on:contextmenu={(e) => onCellRightClick(e, rowIdx, colIdx)}>
                {#if rowIdx === playerRow && colIdx === playerCol}
                  <span class="player-piece">●</span>
                {/if}
                {#if isBlocked(rowIdx, colIdx)}
                  <span class="blocked-mark">✖</span>
                {/if}
              </div>
            {/each}
          </div>
        {/each}
      {/if}
    </div>
  </div>
  <GameControls />
</div>
<Modal />

<style>
  .board-cell.available {
    background: #d0f0d0;
    cursor: pointer;
  }
  .board-cell.blocked {
    background: #bbb;
    cursor: not-allowed;
    position: relative;
  }
  .blocked-mark {
    color: #333;
    font-size: 1.2em;
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    pointer-events: none;
  }
</style> 