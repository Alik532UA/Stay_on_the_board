<script>
  import '../css/components/game-board.css';
  import { appState, setBoardSize, movePlayer, toggleBlockCell, makeComputerMove } from '../stores/gameStore.js';
  import { logStore } from '../stores/logStore.js';
  import { goto } from '$app/navigation';
  import GameControls from './GameControls.svelte';
  import Modal from './Modal.svelte';
  import { get } from 'svelte/store';
  import { onMount } from 'svelte';
  import { _ } from 'svelte-i18n';
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

  // Виношу виклики $_() на верхній рівень
  $: playerTitle = $_('gameBoard.player');
  $: mainMenuTitle = $_('gameBoard.mainMenu');

  onMount(() => {
    if (!board || !Array.isArray(board) || board.length === 0) {
      logStore.addLog('Дошка не ініціалізована, створюю дефолтну 3x3', 'warn');
      setBoardSize(3);
    }
  });

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
    <button class="main-menu-btn" title={mainMenuTitle} on:click={goToMainMenu}>
      <img src="/MainMenu.png" alt={mainMenuTitle} class="main-menu-btn-img" />
    </button>
    <select class="board-size-select" bind:value={boardSize} on:change={onBoardSizeChange}>
      {#each boardSizes as n}
        <option value={n}>{n}x{n}</option>
      {/each}
    </select>
  </div>
  <div class="board-bg-wrapper">
    <div class="game-board" style="--board-size: {boardSize}">
      {#each Array(boardSize) as _, rowIdx}
        {#each Array(boardSize) as _, colIdx}
          <div
            class="board-cell {((rowIdx + colIdx) % 2 === 0) ? 'light' : 'dark'}"
          >
            {#if rowIdx === playerRow && colIdx === playerCol}
              <span class="crown" title={playerTitle}>👑</span>
            {/if}
            {#if isAvailable(rowIdx, colIdx)}
              <span class="move-dot"></span>
            {/if}
          </div>
        {/each}
      {/each}
    </div>
  </div>
  <GameControls />
  <Modal />
</div>

<style>
</style> 