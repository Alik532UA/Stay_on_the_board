<script>
  import '../css/components/game-board.css';
  import { appState, setBoardSize, toggleBlockCell, setDirection, setDistance, confirmMove, noMoves, toggleBlockMode, cashOutAndEndGame, resetGame } from '$lib/stores/gameStore.js';
  import { logStore } from '$lib/stores/logStore.js';
  import { navigateToMainMenu } from '$lib/utils/navigation.js';
  import GameControls from '$lib/components/GameControls.svelte';
  import Modal from '$lib/components/Modal.svelte';
  import { get } from 'svelte/store';
  import { onMount } from 'svelte';
  import { _ } from 'svelte-i18n';
  import { uiState, closeVoiceSettingsModal } from '$lib/stores/uiStore.js';
  import VoiceSettingsModal from '$lib/components/VoiceSettingsModal.svelte';
  import { settingsStore, toggleShowBoard, toggleShowMoves, toggleSpeech, toggleShowQueen } from '$lib/stores/settingsStore.js';
  import { modalStore } from '$lib/stores/modalStore.js';
  import SvgIcons from './SvgIcons.svelte';
  import { base } from '$app/paths';
  import { cubicOut } from 'svelte/easing';
  import { scale } from 'svelte/transition';
  import ReplayControls from '$lib/components/ReplayControls.svelte';

  let showBoard = $derived($settingsStore.showBoard);
  const ANIMATION_DURATION = 10000; // 10 секунд для дебагу

  // Функція очищення кешу
  function clearCache() {
    localStorage.clear();
    sessionStorage.clear();
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
  let boardSizes = Array.from({length:8},(_,i)=>i+2);
  let showBoardSizeDropdown = $state(false);

  function toggleBoardSizeDropdown() {
    showBoardSizeDropdown = !showBoardSizeDropdown;
  }

  function closeBoardSizeDropdown() {
    showBoardSizeDropdown = false;
  }

  /** @param {number} n */
  function selectBoardSize(n) {
    const state = get(appState);
    if (state.boardSize === n) {
      closeBoardSizeDropdown();
      return;
    }
    if (state.score === 0 && state.penaltyPoints === 0) {
      setBoardSize(n);
      closeBoardSizeDropdown();
      return;
    }
    modalStore.showModal({
      titleKey: 'modal.resetScoreTitle',
      contentKey: 'modal.resetScoreContent',
      buttons: [
        {
          textKey: 'modal.resetScoreConfirm',
          customClass: 'green-btn',
          isHot: true,
          onClick: () => {
            setBoardSize(n);
            modalStore.closeModal();
          }
        },
        {
          textKey: 'modal.resetScoreCancel',
          onClick: () => {
            modalStore.closeModal();
          }
        }
      ]
    });
    closeBoardSizeDropdown();
  }

  let boardSize = $derived(Number($appState.boardSize));
  let playerRow = $derived($appState.playerRow);
  let playerCol = $derived($appState.playerCol);
  let blockedCells = $derived($appState.blockedCells);
  let blockModeEnabled = $derived($appState.blockModeEnabled);
  let currentPlayerIndex = $derived($appState.currentPlayerIndex);
  let showMoves = $derived($settingsStore.showMoves);
  let gameId = $derived($appState.gameId);
  let availableMoves = $derived($appState.availableMoves);
  let cellVisitCounts = $derived($appState.cellVisitCounts);
  let blockOnVisitCount = $derived($settingsStore.blockOnVisitCount);

  let playerTitle = $derived($_('gameBoard.player'));
  let mainMenuTitle = $derived($_('gameBoard.mainMenu'));

  let showTutorial = $state(false);
  let isFirstVisit = $state(false);
  onMount(() => {
    // Перевіряємо, чи була попередня гра завершена
    if (get(appState).isGameOver) {
      // Якщо так, мовчки запускаємо нову гру
      resetGame();
    }

    const hasVisited = localStorage.getItem('hasVisitedGame');
    const isTutorialHidden = localStorage.getItem('isTutorialHidden');
    if (!hasVisited) {
      isFirstVisit = true;
      showTutorial = true;
      localStorage.setItem('hasVisitedGame', 'true');
    } else {
      if (isTutorialHidden !== 'true') {
        showTutorial = true;
      }
    }
    if (get(appState).playerRow === null) {
      setBoardSize(get(appState).boardSize);
    }
  });
  function toggleTutorial() {
    showTutorial = !showTutorial;
    if (!isFirstVisit) {
      localStorage.setItem('isTutorialHidden', String(!showTutorial));
    }
  }
  function closeTutorial() {
    showTutorial = false;
    localStorage.setItem('isTutorialHidden', 'true');
    if (isFirstVisit) {
      isFirstVisit = false;
    }
  }

  function goToMainMenu() {
    logStore.addLog('Повернення до головного меню', 'info');
    navigateToMainMenu();
  }

  function showPenaltyInfo() {
    modalStore.showModal({
      titleKey: 'gameBoard.penaltyInfoTitle',
      contentKey: 'gameBoard.penaltyHint',
      buttons: [{ textKey: 'modal.ok', primary: true, isHot: true }]
    });
  }

  function showScoreInfo() {
    modalStore.showModal({
      titleKey: 'modal.scoreInfoTitle',
      contentKey: 'modal.scoreInfoContent',
      buttons: [{ textKey: 'modal.ok', primary: true, isHot: true }]
    });
  }

  /** @param {number} row @param {number} col */
  function isAvailable(row, col) {
    return $appState.availableMoves && $appState.availableMoves.some(move => move.row === row && move.col === col);
  }

  /**
   * @param {number} row
   * @param {number} col
   */
  function isCellBlocked(row, col) {
    if ($appState.isReplayMode) {
      return replayBlockedCells.some(cell => cell.row === row && cell.col === col);
    }
    const visitCount = cellVisitCounts[`${row}-${col}`] || 0;
    return blockModeEnabled && visitCount > blockOnVisitCount;
  }

  /** @param {number} row @param {number} col */
  function getDamageClass(row, col) {
    if (!blockModeEnabled) return '';
    const visitCount = cellVisitCounts[`${row}-${col}`] || 0;
    if (visitCount > 0 && visitCount <= blockOnVisitCount) {
      return `cell-damage-${visitCount}`;
    }
    return '';
  }

  /** @param {KeyboardEvent} event */
  function handleKeydown(event) {
    if (get(modalStore).isOpen) {
      return;
    }
    const target = event.target;
    if (target && typeof target === 'object' && 'tagName' in target) {
      const tag = target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') {
        return;
      }
    }

    let handled = true;

    switch (event.key) {
      case 'ArrowUp': case '8': setDirection('up'); break;
      case 'ArrowDown': case '2': setDirection('down'); break;
      case 'ArrowLeft': case '4': setDirection('left'); break;
      case 'ArrowRight': case '6': setDirection('right'); break;
      case '7': setDirection('up-left'); break;
      case '9': setDirection('up-right'); break;
      case '1':
        if ($appState.selectedDirection) {
          setDistance(1);
        } else {
          setDirection('down-left');
        }
        break;
      case '3': setDirection('down-right'); break;
      case 'w': setDirection('up'); break;
      case 's': case 'x': setDirection('down'); break;
      case 'a': setDirection('left'); break;
      case 'd': setDirection('right'); break;
      case 'q': setDirection('up-left'); break;
      case 'e': setDirection('up-right'); break;
      case 'z': setDirection('down-left'); break;
      case 'c': setDirection('down-right'); break;
      case 'Enter': case ' ': case '5': confirmMove(); break;
      case 'n': case 'N': noMoves(); break;
      case 'Backspace': logStore.addLog(`[handleKeydown] Натиснуто "Backspace" — заявити "немає ходів"`, 'info'); noMoves(); break;
      case 'v': case 'V': logStore.addLog('[handleKeydown] Перемкнено озвучування ходів', 'info'); toggleSpeech(); break;
      case '*': logStore.addLog('[handleKeydown] Перемкнено режим заблокованих клітинок', 'info'); toggleBlockMode(); break;
      case '/': logStore.addLog('[handleKeydown] Перемкнено видимість дошки', 'info'); toggleShowBoard(); break;
      case '+': case '=':
        {
          const currentSize = get(appState).boardSize;
          if (currentSize < 9) {
            selectBoardSize(currentSize + 1);
          }
        }
        break;
      case '-':
        {
          const currentSize = get(appState).boardSize;
          if (currentSize > 2) {
            selectBoardSize(currentSize - 1);
          }
        }
        break;
      default:
        handled = false;
        break;
    }

    if (event.code === 'NumpadDecimal') {
      logStore.addLog(`[handleKeydown] Натиснуто "NumpadDecimal" — заявити "немає ходів"`, 'info');
      noMoves();
      handled = true;
    }

    if (handled) {
      event.preventDefault();
    }
  }

  /**
   * @param {MouseEvent|KeyboardEvent} e
   */
  function showBoardClickHint(e) {
    // e може бути MouseEvent або KeyboardEvent, або undefined
    if (e && typeof e.stopPropagation === 'function') {
      e.stopPropagation();
    }
    modalStore.showModal({
      titleKey: 'modal.boardClickTitle',
      contentKey: 'modal.boardClickContent',
      buttons: [{ textKey: 'modal.ok', primary: true, isHot: true }]
    });
  }

  /** @param {MouseEvent} event @param {number} row @param {number} col */
  function onCellRightClick(event, row, col) {
    // Якщо це не MouseEvent — ігноруємо (лінтер-фікс)
    if (!(event instanceof MouseEvent)) return;
    event.preventDefault();
    if (blockModeEnabled && !(row === playerRow && col === playerCol)) {
      const blocked = blockedCells && blockedCells.some(cell => cell.row === row && cell.col === col);
      logStore.addLog(`${blocked ? 'Розблокування' : 'Блокування'} клітинки [${row},${col}]`, 'info');
      toggleBlockCell(row, col);
    }
  }

  // Реплеї: сегменти для градієнтної лінії
  let replaySegments = $derived(
    (() => {
      if (!$appState.isReplayMode || $appState.moveHistory.length < 2) {
        return [];
      }
      const segments = [];
      const history = $appState.moveHistory;
      const totalSteps = history.length - 1;
      const cellSize = 100 / $appState.boardSize;
      const currentStep = $appState.replayCurrentStep;
      const limitPath = $appState.limitReplayPath;
      const startColor = { r: 76, g: 175, b: 80 };
      const endColor = { r: 244, g: 67, b: 54 };
      for (let i = 0; i < totalSteps; i++) {
        const startPos = history[i].pos;
        const endPos = history[i + 1].pos;
        const ratio = i / totalSteps;
        const r = Math.round(startColor.r + ratio * (endColor.r - startColor.r));
        const g = Math.round(startColor.g + ratio * (endColor.g - startColor.g));
        const b = Math.round(startColor.b + ratio * (endColor.b - startColor.b));
        // --- ОНОВЛЕНА ЛОГІКА ПРОЗОРОСТІ ---
        let opacity = 1.0;
        if (limitPath) {
          const dist = i - currentStep;
          if (dist >= 0 && dist < 3) { // 3 кроки вперед
            opacity = 1.0 - dist * 0.3;
          } else if (dist < 0 && dist >= -1) { // 1 крок назад
            opacity = 0.7;
          } else {
            opacity = 0;
          }
        }
        segments.push({
          x1: startPos.col * cellSize + cellSize / 2,
          y1: startPos.row * cellSize + cellSize / 2,
          x2: endPos.col * cellSize + cellSize / 2,
          y2: endPos.row * cellSize + cellSize / 2,
          color: `rgb(${r}, ${g}, ${b})`,
          opacity: Math.max(0, opacity)
        });
      }
      return segments;
    })()
  );

  let replayPosition = $derived(
    $appState.isReplayMode
      ? $appState.moveHistory[$appState.replayCurrentStep]?.pos
      : ($appState.playerRow !== null && $appState.playerCol !== null)
        ? { row: $appState.playerRow, col: $appState.playerCol }
        : null
  );

  let replayBlockedCells = $derived(
    $appState.isReplayMode
      ? $appState.moveHistory[$appState.replayCurrentStep]?.blocked || []
      : blockedCells
  );
</script>

<div class="game-board-container">
  <div class="game-board-top-row">
    <!-- 1. Головне меню -->
    <button class="main-menu-btn" title={mainMenuTitle} onclick={goToMainMenu}>
      <SvgIcons name="home" />
    </button>

    <!-- 2. Вибір розміру дошки -->
    <div class="board-size-dropdown-wrapper">
      <button class="board-size-dropdown-btn" onclick={toggleBoardSizeDropdown} aria-haspopup="listbox" aria-expanded={showBoardSizeDropdown}>
        <span class="board-size-dropdown-btn-text">{boardSize}</span>
      </button>
      {#if showBoardSizeDropdown}
        <!-- Цей фон буде перехоплювати кліки поза меню -->
        <div class="dropdown-backdrop screen-overlay-backdrop" onclick={closeBoardSizeDropdown} onkeydown={e => (e.key === 'Escape') && closeBoardSizeDropdown()} role="button" tabindex="0" aria-label="Закрити меню"></div>
        <ul class="board-size-dropdown-list" role="listbox">
          {#each boardSizes as n (n)}
            <li 
              class="board-size-dropdown-option {n === boardSize ? 'selected' : ''}" 
              role="option" 
              aria-selected={n === boardSize} 
              onclick={() => selectBoardSize(n)}
              onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') selectBoardSize(n); }}
              tabindex="0"
            >
              {n}x{n}
            </li>
          {/each}
        </ul>
      {/if}
    </div>

    <!-- 3. Інформація -->
    <button class="main-menu-btn" title={$_('gameBoard.info')} onclick={toggleTutorial}>
      <SvgIcons name="info" />
    </button>

    <!-- 4. Очистити кеш (тільки для dev) -->
    {#if import.meta.env.DEV}
      <button class="clear-cache-btn" title="Очистити кеш" onclick={clearCache}>
        <span class="visually-hidden">Очистити кеш</span>
        <SvgIcons name="clear-cache" />
      </button>
    {/if}
  </div>
  {#if showTutorial}
    <div class="tutorial-panel game-content-block">
      <button class="tutorial-close-btn" onclick={closeTutorial} aria-label="Закрити інструкцію">&times;</button>
      <p>{$_('gameBoard.tutorialContent')}</p>
      <a href="{base}/rules" class="details-btn">{$_('gameBoard.details')}</a>
    </div>
  {/if}
  <div class="score-panel game-content-block">
    <div class="score-display">
      <span class="score-label-text">{$_('gameBoard.scoreLabel')}:</span>
      <span
        class="score-value-clickable"
        class:positive-score={$appState.score > 0}
        onclick={showScoreInfo}
        onkeydown={e => (e.key === 'Enter' || e.key === ' ') && showScoreInfo()}
        role="button"
        tabindex="0"
        title={$_('modal.scoreInfoTitle')}
      >{$appState.score}</span>
      {#if $appState.penaltyPoints > 0}
        <span 
          class="penalty-display" 
          onclick={showPenaltyInfo}
          onkeydown={e => (e.key === 'Enter' || e.key === ' ') && showPenaltyInfo()}
          title={$_('gameBoard.penaltyHint')}
          role="button"
          tabindex="0"
        >-{$appState.penaltyPoints}</span>
      {/if}
    </div>
    <button class="cash-out-btn" onclick={cashOutAndEndGame} title={$_('gameBoard.cashOut')}>
      {$_('gameBoard.cashOut')}
    </button>
  </div>
  {#key `${$appState.boardSize}-${$appState.gameId}`}
    <div 
      class="board-bg-wrapper game-content-block" 
      class:hidden={!showBoard}
      style="--board-size: {boardSize}"
      onclick={showBoardClickHint} 
      onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && showBoardClickHint(e)}
      role="button"
      tabindex="0"
      aria-label="Ігрове поле"
    >
      <div class="game-board" style="--board-size: {boardSize}" role="grid">
        {#each Array(boardSize) as _, rowIdx (rowIdx)}
          {#each Array(boardSize) as _, colIdx (colIdx)}
            <div
              class="board-cell {getDamageClass(rowIdx, colIdx)}"
              class:light={ (rowIdx + colIdx) % 2 === 0 }
              class:dark={ (rowIdx + colIdx) % 2 !== 0 }
              class:blocked-cell={ isCellBlocked(rowIdx, colIdx) }
              class:available={ showMoves && isAvailable(rowIdx, colIdx) }
              aria-label={`Cell ${rowIdx + 1}, ${colIdx + 1}`}
              oncontextmenu={(e) => e instanceof MouseEvent && onCellRightClick(e, rowIdx, colIdx)}
              role="gridcell"
              tabindex="0"
            >
              {#if getDamageClass(rowIdx, colIdx) === 'cell-damage-3'}
                <span class="crack-extra"></span>
              {/if}
              {#if isCellBlocked(rowIdx, colIdx)}
                <span class="blocked-x">✗</span>
              {:else}
                {#if !$appState.isReplayMode && $settingsStore.showMoves && isAvailable(rowIdx, colIdx)}
                  <span class="move-dot"></span>
                {/if}
              {/if}
            </div>
          {/each}
        {/each}
        {#if $appState.isReplayMode}
          <svg class="replay-path-svg" viewBox="0 0 100 100" overflow="visible">
            {#each replaySegments as segment, i (i)}
              <line 
                x1={segment.x1} 
                y1={segment.y1} 
                x2={segment.x2} 
                y2={segment.y2} 
                stroke={segment.color}
                stroke-opacity={segment.opacity}
              />
            {/each}
          </svg>
        {/if}
        {#if $settingsStore.showQueen && replayPosition}
          {#key $appState.gameId}
            <div
              class="player-piece"
              style="top: {replayPosition.row * (100 / $appState.boardSize)}%; left: {replayPosition.col * (100 / $appState.boardSize)}%;"
            >
              <div class="piece-container">
                <SvgIcons name="queen" />
              </div>
            </div>
          {/key}
        {/if}
      </div>
    </div>
  {/key}
  <!-- Рендеримо ферзя як окремий елемент поверх сітки -->
  {#if $appState.isReplayMode}
    <ReplayControls />
  {:else}
    <GameControls />
  {/if}
  <Modal />
  {#if $uiState.isVoiceSettingsModalOpen}
    <VoiceSettingsModal close={closeVoiceSettingsModal} />
  {/if}
</div>

<svelte:window on:keydown={handleKeydown} />

<style>
  :root {
    --board-hide-duration: 1s; /* 10 секунд для дебагу */
  }
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
    background: #fff6;
  }
  .score-panel {
    background: var(--bg-secondary, #fff3);
    padding: 12px 16px;
    border-radius: 12px;
    box-shadow: var(--unified-shadow, 0 2px 12px 0 rgba(80,0,80,0.10));
    margin-bottom: 16px;
    text-align: center;
    font-size: 1.2em;
    font-weight: bold;
    color: var(--text-primary, #222);
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .score-display {
    display: flex;
    align-items: center;
    gap: 16px;
  }
  .cash-out-btn {
    background: #2196f3;
    color: #fff;
    border: none;
    border-radius: 10px;
    padding: 8px 16px;
    font-size: 0.95em;
    font-weight: 700;
    cursor: pointer;
    transition: background 0.2s, transform 0.2s, box-shadow 0.2s;
    box-shadow: 0 2px 8px rgba(33, 150, 243, 0.3);
  }
  .cash-out-btn:hover {
    background: #1976d2;
    transform: scale(1.05);
    box-shadow: 0 4px 12px rgba(33, 150, 243, 0.4);
  }
  .penalty-display {
    color: #f44336; /* Червоний колір для штрафів */
    font-weight: bold;
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
  .player-piece {
    position: absolute;
    width: var(--cell-size);
    height: var(--cell-size);
    transition: top 0.6s ease-out, left 0.6s ease-out;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10;
    pointer-events: none;
  }
  .move-dot {
    display: block;
    width: 18%;
    height: 18%;
    border-radius: 50%;
    background: #fff;
  }
  .tutorial-panel {
    position: relative;
    background: var(--bg-secondary, #fff3);
    padding: 16px 24px;
    border-radius: 12px;
    box-shadow: var(--unified-shadow, 0 2px 12px 0 rgba(80,0,80,0.10));
    margin-bottom: 16px;
    text-align: center;
    font-size: 1.05em;
    color: var(--text-primary, #222);
    border: 1px solid var(--border-color);
    animation: fadeIn 0.5s ease-out;
  }
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .tutorial-close-btn {
    position: absolute;
    top: 8px;
    right: 8px;
    background: none;
    border: none;
    font-size: 1.5rem;
    color: var(--text-secondary);
    cursor: pointer;
    line-height: 1;
    padding: 4px;
  }
  .tutorial-close-btn:hover {
    color: var(--text-primary);
  }
  .tutorial-panel p {
    margin: 0;
    padding-right: 16px;
  }
  /* ОНОВЛЕНИЙ CSS для .board-bg-wrapper */
  .board-bg-wrapper {
    width: var(--final-dynamic-size);
    height: auto;
    aspect-ratio: 1 / 1;
    margin: 0 auto 16px;
    overflow: hidden;
    background: none;
    max-height: 1000px;
    opacity: 1;
    transform: scale(1);
    transition: 
      max-height var(--board-hide-duration) ease-in-out,
      opacity var(--board-hide-duration) ease-in-out,
      transform var(--board-hide-duration) ease-in-out,
      margin-bottom var(--board-hide-duration) ease-in-out,
      padding-top var(--board-hide-duration) ease-in-out,
      padding-bottom var(--board-hide-duration) ease-in-out;
  }
  .board-bg-wrapper > .game-board {
    min-height: 0;
  }
  .board-bg-wrapper.hidden {
    max-height: 0;
    min-height: 0;
    opacity: 0;
    margin-bottom: 0;
    padding-top: 0;
    padding-bottom: 0;
    transform: scale(0);
  }
  .details-btn {
    display: inline-block;
    margin-top: 12px;
    padding: 6px 14px;
    background: var(--control-bg);
    color: var(--text-primary);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    text-decoration: none;
    font-weight: bold;
    transition: background 0.2s, color 0.2s;
  }
  .details-btn:hover {
    background: var(--control-hover);
    color: #fff;
  }
  .score-value-clickable {
    cursor: pointer;
    text-decoration: none;
    transition: color 0.2s, text-shadow 0.2s;
  }
  .score-value-clickable:hover,
  .score-value-clickable:focus {
    color: var(--text-accent, #ff9800);
    text-shadow: 0 0 8px var(--shadow-color);
    outline: none;
  }
  .positive-score {
    color: var(--positive-score-color, #4CAF50);
    font-weight: bold;
  }
  .board-cell.cell-damage-1::before,
  .board-cell.cell-damage-2::before, .board-cell.cell-damage-2::after,
  .board-cell.cell-damage-3::before, .board-cell.cell-damage-3::after, .board-cell.cell-damage-3 .crack-extra {
    content: '';
    position: absolute;
    width: 1.5px;
    background: rgba(0, 0, 0, 0.2);
    box-shadow: 0 0 2px rgba(0,0,0,0.5);
    border-radius: 2px;
    animation: crack-appear 0.4s ease-out forwards;
  }
  .board-cell.cell-damage-1::before {
    height: 50%;
    top: 25%;
    left: 50%;
    transform: rotate(25deg);
  }
  .board-cell.cell-damage-2::before {
    height: 60%;
    top: 20%;
    left: 40%;
    transform: rotate(-30deg);
  }
  .board-cell.cell-damage-2::after {
    height: 55%;
    top: 25%;
    left: 60%;
    transform: rotate(40deg);
  }
  .board-cell.cell-damage-3::before {
    height: 70%;
    top: 15%;
    left: 50%;
    transform: rotate(15deg);
  }
  .board-cell.cell-damage-3::after {
    height: 60%;
    top: 20%;
    left: 30%;
    transform: rotate(-50deg);
  }
  .board-cell.cell-damage-3 .crack-extra {
    display: block;
    height: 50%;
    top: 30%;
    left: 70%;
    transform: rotate(60deg);
  }
  @keyframes crack-appear {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  .replay-path-svg {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 5;
    overflow: visible;
  }
  .replay-path-svg line {
    stroke-width: 1;
    stroke-linecap: round;
    transition: stroke-opacity 0.3s ease-out;
  }
  .game-board {
    position: relative;
  }
</style> 