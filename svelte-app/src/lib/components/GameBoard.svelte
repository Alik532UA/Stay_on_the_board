<script>
  import '../css/components/game-board.css';
  import { appState, setDirection, setDistance, confirmMove, noMoves, setBoardSize, movePlayer, toggleBlockCell, makeComputerMove, toggleBlockMode, toggleShowBoard, toggleSpeech } from '$lib/stores/gameStore.js';
  import { logStore } from '$lib/stores/logStore.js';
  import { goto } from '$app/navigation';
  import GameControls from '$lib/components/GameControls.svelte';
  import Modal from '$lib/components/Modal.svelte';
  import { get } from 'svelte/store';
  import { onMount } from 'svelte';
  import { _ } from 'svelte-i18n';
  import { uiState, closeVoiceSettingsModal } from '$lib/stores/uiStore.js';
  import VoiceSettingsModal from '$lib/components/VoiceSettingsModal.svelte';
  import { settingsStore } from '$lib/stores/settingsStore.js';
  import { modalStore } from '$lib/stores/modalStore.js';
  import SvgIcons from './SvgIcons.svelte';
  import { flip } from 'svelte/animate';
  import { quintOut } from 'svelte/easing';
  // Функція очищення кешу
  function clearCache() {
    localStorage.clear();
    sessionStorage.clear();
    // Очищення всіх cookies
    if (document.cookie && document.cookie !== '') {
      const cookies = document.cookie.split(';');
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i];
        const eqPos = cookie.indexOf('=');
        const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
        document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/';
      }
    }
    location.reload();
  }
  let boardSizes = Array.from({length:8},(_,i)=>i+2); // number[]
  let showBoardSizeDropdown = false;
  function toggleBoardSizeDropdown() {
    showBoardSizeDropdown = !showBoardSizeDropdown;
  }
  function closeBoardSizeDropdown() {
    showBoardSizeDropdown = false;
  }
  /**
   * @param {number} n
   */
  function selectBoardSize(n) {
    setBoardSize(n);
    showBoardSizeDropdown = false;
  }

  let boardSize = $derived(Number($appState.boardSize));
  let board = $derived($appState.board);
  let playerRow = $derived($appState.playerRow);
  let playerCol = $derived($appState.playerCol);
  let blockedCells = $derived($appState.blockedCells);
  let blockModeEnabled = $derived($appState.blockModeEnabled);
  let currentPlayer = $derived($appState.currentPlayer);
  let showMoves = $derived($settingsStore.showMoves);
  let showBoard = $derived($settingsStore.showBoard);
  let visualPiece = $state([{ id: 'queen', row: playerRow, col: playerCol }]);

  $effect(() => {
    console.log('[GameBoard] playerRow:', playerRow, 'playerCol:', playerCol, 'availableMoves:', $appState.availableMoves, 'blockedCells:', blockedCells);
  });
  $effect(() => {
    const logicalRow = playerRow;
    const logicalCol = playerCol;
    if (visualPiece[0].row === logicalRow && visualPiece[0].col === logicalCol) {
      return;
    }
    const isPlayersTurnNow = currentPlayer === 1;
    if (isPlayersTurnNow) {
      const timer = setTimeout(() => {
        visualPiece = [{ id: 'queen', row: logicalRow, col: logicalCol }];
      }, 500);
      return () => clearTimeout(timer);
    } else {
      visualPiece = [{ id: 'queen', row: logicalRow, col: logicalCol }];
    }
  });
  // Виношу виклики $_() на верхній рівень
  let playerTitle = $derived($_('gameBoard.player'));
  let mainMenuTitle = $derived($_('gameBoard.mainMenu'));

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

  function showPenaltyInfo() {
    modalStore.showModal({
      titleKey: 'gameBoard.penaltyInfoTitle',
      contentKey: 'gameBoard.penaltyHint',
      buttons: [{ textKey: 'modal.ok', primary: true, isHot: true }]
    });
  }

  function onBoardSizeChange(/** @type {Event} */ event) {
    const newSize = +/** @type {HTMLSelectElement} */(event.target).value;
    logStore.addLog(`Зміна розміру дошки на ${newSize}x${newSize}`, 'info');
    setBoardSize(newSize);
  }

  /**
   * @param {number} row
   * @param {number} col
   */
  function isAvailable(row, col) {
    const result = $appState.availableMoves && $appState.availableMoves.some(move => move.row === row && move.col === col);
    return result;
  }

  /**
   * @param {number} row
   * @param {number} col
   */
  function isBlocked(row, col) {
    const result = blockedCells && blockedCells.some(cell => Number(cell.row) === Number(row) && Number(cell.col) === Number(col));
    return result;
  }

  /**
   * Перевіряє, чи є клітинка заблокованою.
   * @param {number} row
   * @param {number} col
   */
  function isCellBlocked(row, col) {
    return !!(blockedCells && blockedCells.some(cell => cell.row === row && cell.col === col));
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

  /**
   * Обробляє натискання клавіш для керування грою.
   * @param {KeyboardEvent} event
   */
  function handleKeydown(event) {
    // ЗАПОБІЖНИК: Якщо модальне вікно відкрите, ігноруємо всі ігрові гарячі клавіші.
    if (get(modalStore).isOpen) {
      return;
    }
    // Ігноруємо гарячі клавіші, якщо фокус на полі вводу
    const target = event.target;
    if (target && typeof target === 'object' && 'tagName' in target) {
      const tag = target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') {
        return;
      }
    }

    // Запобігаємо стандартній поведінці браузера (напр. скролінг стрілками)
    // для клавіш, які ми обробляємо.
    let handled = true;

    switch (event.key) {
      // Напрямки (Numpad та стрілки)
      case 'ArrowUp':
      case '8':
        setDirection('up');
        break;
      case 'ArrowDown':
      case '2':
        setDirection('down');
        break;
      case 'ArrowLeft':
      case '4':
        setDirection('left');
        break;
      case 'ArrowRight':
      case '6':
        setDirection('right');
        break;
      case '7':
        setDirection('up-left');
        break;
      case '9':
        setDirection('up-right');
        break;
      case '1':
        // Якщо це відстань, а не напрямок
        if ($appState.selectedDirection) {
          setDistance(1);
        } else {
          setDirection('down-left');
        }
        break;
      case '3':
        setDirection('down-right');
        break;

      // Альтернативне керування (QWE/ASD/ZXC)
      case 'w':
        setDirection('up');
        break;
      case 's':
      case 'x':
        setDirection('down');
        break;
      case 'a':
        setDirection('left');
        break;
      case 'd':
        setDirection('right');
        break;
      case 'q':
        setDirection('up-left');
        break;
      case 'e':
        setDirection('up-right');
        break;
      case 'z':
        setDirection('down-left');
        break;
      case 'c':
        setDirection('down-right');
        break;

      // Дії
      case 'Enter':
      case ' ': // Spacebar
      case '5': // NumPad5
        confirmMove();
        break;
      case 'n':
      case 'N':
        noMoves();
        break;
      case 'Backspace':
      case 'Decimal': // Numpad .
        logStore.addLog(`[handleKeydown] Натиснуто "${event.key}" — заявити "немає ходів"`, 'info');
        noMoves();
        break;
      case 'v':
      case 'V':
        logStore.addLog('[handleKeydown] Перемкнено озвучування ходів', 'info');
        toggleSpeech();
        break;
        
      // Налаштування дошки та режимів
      case '*': // Numpad Multiply
        logStore.addLog('[handleKeydown] Перемкнено режим заблокованих клітинок', 'info');
        toggleBlockMode();
        break;
      case '/': // Numpad Divide
        logStore.addLog('[handleKeydown] Перемкнено видимість дошки', 'info');
        toggleShowBoard();
        break;
      case '+': // Numpad Add
        {
          const currentSize = get(appState).boardSize;
          if (currentSize < 9) {
            logStore.addLog(`[handleKeydown] Збільшено розмір дошки до ${currentSize + 1}`, 'info');
            setBoardSize(currentSize + 1);
          }
        }
        break;
      case '-': // Numpad Subtract
        {
          const currentSize = get(appState).boardSize;
          if (currentSize > 2) {
            logStore.addLog(`[handleKeydown] Зменшено розмір дошки до ${currentSize - 1}`, 'info');
            setBoardSize(currentSize - 1);
          }
        }
        break;

      default:
        handled = false; // Ми не обробили цю клавішу
        break;
    }

    if (handled) {
      event.preventDefault();
    }
  }
</script>

<div class="game-board-container">
  <div class="game-board-top-row">
    <button class="main-menu-btn" title={mainMenuTitle} on:click={goToMainMenu}>
      <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 547.596 547.596" width="32" height="32" aria-label={mainMenuTitle} class="main-menu-btn-img">
        <g>
          <path d="M540.76,254.788L294.506,38.216c-11.475-10.098-30.064-10.098-41.386,0L6.943,254.788   c-11.475,10.098-8.415,18.284,6.885,18.284h75.964v221.773c0,12.087,9.945,22.108,22.108,22.108h92.947V371.067   c0-12.087,9.945-22.108,22.109-22.108h93.865c12.239,0,22.108,9.792,22.108,22.108v145.886h92.947   c12.24,0,22.108-9.945,22.108-22.108v-221.85h75.965C549.021,272.995,552.081,264.886,540.76,254.788z"/>
        </g>
      </svg>
    </button>
    {#if import.meta.env.DEV}
      <button class="clear-cache-btn" aria-label="Очистити кеш" title="Очистити кеш" on:click={clearCache}>
        <svg width="64" height="64" viewBox="0 0 16 16" fill="none">
          <path fill="currentColor" d="M13.9907,0 C14.8816,0 15.3277,1.07714 14.6978,1.70711 L13.8556,2.54922 C14.421,3.15654 14.8904,3.85028 15.2448,4.60695 C15.8028,5.79836 16.0583,7.109 15.9888,8.42277 C15.9193,9.73654 15.5268,11.0129 14.8462,12.1388 C14.1656,13.2646 13.2178,14.2053 12.0868,14.8773 C10.9558,15.5494 9.67655,15.9322 8.3623,15.9918 C7.04804,16.0514 5.73937,15.7859 4.55221,15.2189 C3.36505,14.652 2.33604,13.8009 1.55634,12.7413 C0.776635,11.6816 0.270299,10.446 0.0821822,9.14392 C0.00321229,8.59731 0.382309,8.09018 0.928918,8.01121 C1.47553,7.93224 1.98266,8.31133 2.06163,8.85794 C2.20272,9.83451 2.58247,10.7612 3.16725,11.556 C3.75203,12.3507 4.52378,12.989 5.41415,13.4142 C6.30452,13.8394 7.28602,14.0385 8.27172,13.9939 C9.25741,13.9492 10.2169,13.6621 11.0651,13.158 C11.9133,12.6539 12.6242,11.9485 13.1346,11.1041 C13.6451,10.2597 13.9395,9.30241 13.9916,8.31708 C14.0437,7.33175 13.8521,6.34877 13.4336,5.45521 C13.178,4.90949 12.8426,4.40741 12.4402,3.96464 L11.7071,4.69779 C11.0771,5.32776 9.99996,4.88159 9.99996,3.99069 L9.99996,0 L13.9907,0 Z M1.499979,4 C2.05226,4 2.499979,4.44772 2.499979,5 C2.499979,5.55229 2.05226,6 1.499979,6 C0.947694,6 0.499979,5.55228 0.499979,5 C0.499979,4.44772 0.947694,4 1.499979,4 Z M3.74998,1.25 C4.30226,1.25 4.74998,1.69772 4.74998,2.25 C4.74998,2.80229 4.30226,3.25 3.74998,3.25 C3.19769,3.25 2.74998,2.80228 2.74998,2.25 C2.74998,1.69772 3.19769,1.25 3.74998,1.25 Z M6.99998,0 C7.55226,0 7.99998,0.447716 7.99998,1 C7.99998,1.55229 7.55226,2 6.99998,2 C6.44769,2 5.99998,1.55229 5.99998,1 C5.99998,0.447716 6.44769,0 6.99998,0 Z"/>
        </svg>
      </button>
    {/if}
    <div class="board-size-dropdown-wrapper">
      <button class="board-size-dropdown-btn" on:click={toggleBoardSizeDropdown} aria-haspopup="listbox" aria-expanded={showBoardSizeDropdown}>
        <span class="board-size-dropdown-btn-text">{boardSize}</span>
      </button>
      {#if showBoardSizeDropdown}
        <div class="dropdown-backdrop" on:click={closeBoardSizeDropdown}></div>
        <ul class="board-size-dropdown-list" role="listbox">
          {#each boardSizes as n (n)}
            <li class="board-size-dropdown-option {n === boardSize ? 'selected' : ''}" role="option" aria-selected={n === boardSize} on:click={() => selectBoardSize(n)}>{n}x{n}</li>
          {/each}
        </ul>
      {/if}
    </div>
  </div>
  <div class="score-panel">
    Рахунок: {$appState.score}
    {#if $appState.penaltyPoints > 0}
      <span 
        class="penalty-display" 
        on:click={showPenaltyInfo}
        title={$_('gameBoard.penaltyHint')}
        role="button"
        tabindex="0"
      >-{$appState.penaltyPoints}</span>
    {/if}
  </div>
  {#if showBoard}
    {#key `${$appState.boardSize}-${$appState.gameId}`}
      <div class="board-bg-wrapper">
        <div class="game-board" style="--board-size: {boardSize}">
          {#each Array(boardSize) as _, rowIdx (rowIdx)}
            {#each Array(boardSize) as _, colIdx (colIdx)}
              <div
                class="board-cell"
                class:light={ (rowIdx + colIdx) % 2 === 0 }
                class:dark={ (rowIdx + colIdx) % 2 !== 0 }
                class:blocked-cell={ isCellBlocked(rowIdx, colIdx) }
                class:available={ showMoves && isAvailable(rowIdx, colIdx) && currentPlayer === 1 }
                role="button"
                tabindex="0"
                aria-label={`Cell ${rowIdx + 1}, ${colIdx + 1}`}
                on:click={() => onCellClick(rowIdx, colIdx)}
                on:contextmenu={(e) => onCellRightClick(e, rowIdx, colIdx)}
                on:keydown={(e) => { if (e.key === 'Enter' || e.key === ' ') onCellClick(rowIdx, colIdx); }}
              >
                {#if isCellBlocked(rowIdx, colIdx)}
                  <span class="blocked-x">✗</span>
                {:else}
                  {#if isAvailable(rowIdx, colIdx) && currentPlayer === 1 && showMoves}
                    <span class="move-dot"></span>
                  {/if}
                {/if}
              </div>
            {/each}
          {/each}
          {#each visualPiece as piece (piece.id)}
            <div
              class="player-piece"
              style="top: calc(var(--cell-size) * {piece.row}); left: calc(var(--cell-size) * {piece.col});"
              animate:flip={{ duration: 600, easing: quintOut }}
            >
              <SvgIcons name="queen" />
            </div>
          {/each}
        </div>
      </div>
    {/key}
  {/if}
  <!-- Рендеримо ферзя як окремий елемент поверх сітки -->
  <GameControls />
  <Modal />
  {#if $uiState.isVoiceSettingsModalOpen}
    <VoiceSettingsModal close={closeVoiceSettingsModal} />
  {/if}
</div>

<svelte:window on:keydown={handleKeydown} />

<style>
  .clear-cache-btn {
    background: #fff3;
    border: none;
    width: 44px;
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-left: 4px;
    cursor: pointer;
    transition: background 0.2s;
  }
  .clear-cache-btn:hover {
    background: #ff9800;
    color: #fff;
  }
  .score-panel {
    background: var(--bg-secondary, #fff3);
    padding: 12px 20px;
    border-radius: 12px;
    box-shadow: var(--unified-shadow, 0 2px 12px 0 rgba(80,0,80,0.10));
    margin-bottom: 16px;
    text-align: center;
    font-size: 1.2em;
    font-weight: bold;
    color: var(--text-primary, #222);
    width: 100%;
    max-width: 340px;
    margin-left: auto;
    margin-right: auto;
  }
  .penalty-display {
    color: #f44336; /* Червоний колір для штрафів */
    font-weight: bold;
    margin-left: 8px;
    cursor: pointer;
    transition: color 0.2s, transform 0.2s;
    border-radius: 4px;
    padding: 2px 6px;
  }
  .penalty-display:hover {
    color: #d32f2f;
    transform: scale(1.1);
    background: rgba(244, 67, 54, 0.1);
  }
  .penalty-display:focus {
    outline: 2px solid #f44336;
    outline-offset: 2px;
  }
</style> 