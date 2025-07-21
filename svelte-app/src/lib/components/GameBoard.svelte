<script>
  import '../css/components/game-board.css';
  import { appState, setBoardSize, toggleBlockCell, setDirection, setDistance, toggleBlockMode, cashOutAndEndGame, resetGame, stopReplay } from '$lib/stores/gameStore.js';
  import { logStore } from '$lib/stores/logStore.js';
  import { navigateToMainMenu } from '$lib/utils/navigation.js';
  import GameControls from '$lib/components/GameControls.svelte';
  import Modal from '$lib/components/Modal.svelte';
  import { get } from 'svelte/store';
  import { onMount } from 'svelte';
  import { _ } from 'svelte-i18n';
  import { uiState, closeVoiceSettingsModal, clearGameModeModalRequest } from '$lib/stores/uiStore.js';
  import VoiceSettingsModal from '$lib/components/VoiceSettingsModal.svelte';
  import { settingsStore } from '$lib/stores/settingsStore.js';
  import { modalStore } from '$lib/stores/modalStore.js';
  import SvgIcons from './SvgIcons.svelte';
  import { base } from '$app/paths';
  import ReplayControls from '$lib/components/ReplayControls.svelte';
  import { replayPosition, replayCellVisitCounts, replaySegments } from '$lib/utils/replay.js';
  import { goto } from '$app/navigation';
  import FAQModal from '$lib/components/FAQModal.svelte';
  import { confirmPlayerMove } from '$lib/gameOrchestrator.js';
  import GameModeModal from '$lib/components/GameModeModal.svelte';
  import { clearCache } from '$lib/utils/cacheManager.js';

  let showBoard = $derived($settingsStore.showBoard);

  let boardSize = $derived(Number($appState.boardSize));
  let playerRow = $derived($appState.playerRow);
  let playerCol = $derived($appState.playerCol);
  let blockedCells = $derived($appState.blockedCells);
  let blockModeEnabled = $derived($appState.blockModeEnabled);
  let showMoves = $derived($settingsStore.showMoves);
  let cellVisitCounts = $derived($appState.cellVisitCounts);
  let blockOnVisitCount = $derived($settingsStore.blockOnVisitCount);
  let mainMenuTitle = $derived($_('gameBoard.mainMenu'));

  onMount(() => {
    const state = get(appState);
    if (state.isGameOver || (state.score === 0 && !state.isReplayMode && state.moveHistory.length <= 1)) {
      resetGame();
    }

    // Відкладаємо логіку показу модального вікна, щоб уникнути race conditions
    setTimeout(() => {
      if (get(uiState).shouldShowGameModeModalOnLoad) {
        showGameModeSelector();
        clearGameModeModalRequest();
      }
    }, 50);
  });

  function showGameModeSelector() {
    modalStore.showModal({
      titleKey: 'gameModes.title',
      component: GameModeModal,
      buttons: [
        { textKey: 'modal.cancel', onClick: modalStore.closeModal }
      ],
      closable: false
    });
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

  let activeCellVisitCounts = $derived($appState.isReplayMode ? $replayCellVisitCounts : $appState.cellVisitCounts);

  /** @param {number} row @param {number} col */
  function isCellBlocked(row, col) {
    const visitCount = activeCellVisitCounts[`${row}-${col}`] || 0;
    return blockModeEnabled && visitCount > blockOnVisitCount;
  }

  /** @param {number} row @param {number} col */
  function getDamageClass(row, col) {
    if (!blockModeEnabled) return '';
    const visitCount = activeCellVisitCounts[`${row}-${col}`] || 0;
    if (visitCount > 0 && visitCount <= blockOnVisitCount) {
      return `cell-damage-${visitCount}`;
    }
    return '';
  }

  // === Динамічні гарячі клавіші ===
  /** @type {Record<string, () => void>} */
  const actionHandlers = {
    'up-left': () => setDirection('up-left'),
    'up': () => setDirection('up'),
    'up-right': () => setDirection('up-right'),
    'left': () => setDirection('left'),
    'right': () => setDirection('right'),
    'down-left': () => setDirection('down-left'),
    'down': () => setDirection('down'),
    'down-right': () => setDirection('down-right'),
    'confirm': confirmPlayerMove,
    'no-moves': () => { logStore.addLog(`[handleKeydown] "немає ходів"`, 'info'); setDirection('down-right'); },
    'toggle-block-mode': () => { logStore.addLog('[handleKeydown] Перемкнено режим заблокованих клітинок', 'info'); toggleBlockMode(); },
    'toggle-board': () => { logStore.addLog('[handleKeydown] Перемкнено видимість дошки', 'info'); settingsStore.toggleShowBoard(); },
    'increase-board': () => setBoardSize(Math.min(get(appState).boardSize + 1, 9)),
    'decrease-board': () => setBoardSize(Math.max(get(appState).boardSize - 1, 2)),
    'toggle-speech': () => { logStore.addLog('[handleKeydown] Перемкнено мовлення', 'info'); settingsStore.toggleSpeech(); },
    'distance-1': () => setDistance(1),
    'distance-2': () => setDistance(2),
    'distance-3': () => setDistance(3),
    'distance-4': () => setDistance(4),
    'distance-5': () => setDistance(5),
    'distance-6': () => setDistance(6),
    'distance-7': () => setDistance(7),
    'distance-8': () => setDistance(8),
  };

  const keyToActionMap = $derived(Object.entries($settingsStore.keybindings).reduce((acc, [action, keys]) => {
    keys.forEach(key => {
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(action);
    });
    return acc;
  }, /** @type {Record<string, string[]>} */ ({})));

  function getKeyToActionMap() {
    /** @type {Record<string, string>} */
    const map = {};
    Object.entries($settingsStore.keybindings).forEach(([action, keys]) => {
      keys.forEach(key => {
        map[key] = action;
      });
    });
    return map;
  }

  /** @param {KeyboardEvent} event */
  function handleKeydown(event) {
    if (get(modalStore).isOpen) return;

    const target = /** @type {HTMLElement} */ (event.target);
    if (target && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))) {
      return;
    }

    const actions = keyToActionMap[event.code];
    if (!actions || actions.length === 0) return;

    event.preventDefault();

    if (actions.length === 1) {
      const handler = actionHandlers[actions[0]];
      if (handler) handler();
    } else {
      const resolvedAction = $settingsStore.keyConflictResolution[event.code];
      if (resolvedAction && actionHandlers[resolvedAction]) {
        actionHandlers[resolvedAction]();
      } else {
        // Show modal to choose
        modalStore.showModal({
          titleKey: 'modal.keyConflictTitle',
          content: {
            key: event.code,
            actions: actions,
          },
          buttons: actions.map(action => ({
            text: $_(`controlsPage.actions.${action}`),
            onClick: () => {
              // 1. Зберігаємо вибір користувача
              const newResolutions = {
                ...$settingsStore.keyConflictResolution,
                [event.code]: action
              };

              // 2. Оновлюємо прив'язки, видаляючи конфліктну клавішу з інших дій
              /** @type {Record<string, string[]>} */
              const newKeybindings = { ...$settingsStore.keybindings };
              actions.forEach(otherAction => {
                if (otherAction !== action && Array.isArray(newKeybindings[otherAction])) {
                  newKeybindings[otherAction] = newKeybindings[otherAction].filter(
                    key => key !== event.code
                  );
                }
              });

              settingsStore.updateSettings({
                keyConflictResolution: newResolutions,
                keybindings: newKeybindings
              });

              // 3. Виконуємо обрану дію
              if (actionHandlers[action]) {
                actionHandlers[action]();
              }
              
              // 4. Закриваємо модальне вікно
              modalStore.closeModal();
            }
          }))
        });
      }
    }
  }

  /** @param {MouseEvent|KeyboardEvent|undefined} e */
  function showBoardClickHint(e) {
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
    if (!(event instanceof MouseEvent)) return;
    event.preventDefault();
    if (blockModeEnabled && !(row === playerRow && col === playerCol)) {
      const blocked = blockedCells && blockedCells.some(cell => cell.row === row && cell.col === col);
      logStore.addLog(`${blocked ? 'Розблокування' : 'Блокування'} клітинки [${row},${col}]`, 'info');
      toggleBlockCell(row, col);
    }
  }

  function showGameInfoModal() {
    modalStore.showModal({
      titleKey: 'faq.title',
      content: { isFaq: true },
      buttons: [
        { textKey: 'rulesPage.title', onClick: () => { goto(`${base}/rules`); modalStore.closeModal(); }, customClass: 'blue-btn' },
        { textKey: 'modal.ok', primary: true, isHot: true, onClick: modalStore.closeModal }
      ]
    });
  }
</script>

<div class="game-board-container">
  <div class="game-board-top-row">
    <button class="main-menu-btn" title={mainMenuTitle} onclick={goToMainMenu}>
      <SvgIcons name="home" />
    </button>
    <button class="main-menu-btn" title={$_('gameModes.changeModeTooltip')} onclick={showGameModeSelector}>
      <SvgIcons name="game-mode" />
    </button>
    <button class="main-menu-btn" title={$_('gameBoard.info')} onclick={showGameInfoModal}>
      <SvgIcons name="info" />
    </button>
    {#if import.meta.env.DEV}
      <button class="main-menu-btn" title={$_('gameBoard.clearCache')} onclick={() => clearCache({ keepAppearance: false })}>
        <SvgIcons name="clear-cache" />
      </button>
    {/if}
  </div>
  
  {#if !$appState.isReplayMode}
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
  {/if}

  {#key `${$appState.boardSize}-${$appState.gameId}`}
    <div 
      class="board-bg-wrapper game-content-block" 
      class:hidden={!showBoard && !$appState.isReplayMode}
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
            {#each $replaySegments as segment, i (i)}
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
        {#if ($appState.isReplayMode || $settingsStore.showQueen) && $replayPosition}
          {#key $appState.gameId}
            <div
              class="player-piece"
              style="top: {$replayPosition.row * (100 / $appState.boardSize)}%; left: {$replayPosition.col * (100 / $appState.boardSize)}%;"
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

  {#if $appState.isReplayMode}
    <ReplayControls />
    <div class="close-replay-container">
      <button class="modal-btn-generic danger-btn" onclick={stopReplay}>
        {$_('replay.close')}
      </button>
    </div>
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
  .main-menu-btn,
  .clear-cache-btn,
  .board-size-dropdown-btn {
    background: var(--control-bg, #fff3);
    border: none;
    border-radius: 12px;
    width: 64px !important;
    height: 64px !important;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: background 0.2s, color 0.2s, transform 0.2s, box-shadow 0.2s;
    margin-right: 4px;
    box-shadow: 0 2px 16px 0 rgba(80,0,80,0.10);
    overflow: hidden;
    background-clip: padding-box;
    color: var(--text-primary);
    position: relative;
  }
  .main-menu-btn:hover,
  .clear-cache-btn:hover,
  .board-size-dropdown-btn:hover {
    background: var(--control-hover, #ff9800);
    color: #fff;
  }
  .main-menu-btn.active,
  .board-size-dropdown-btn.active {
    background: var(--control-selected, #ff9800);
    color: #fff;
    box-shadow: 0 0 12px var(--control-selected, #ff9800);
    transform: scale(1.05);
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
    background: var(--control-selected);
    color: var(--control-selected-text); /* Використовуємо змінну для кольору тексту */
    border: none;
    border-radius: 10px;
    padding: 8px 16px;
    font-size: 0.95em;
    font-weight: 700;
    cursor: pointer;
    transition: background 0.2s, transform 0.2s, box-shadow 0.2s;
    box-shadow: 0 2px 8px var(--shadow-color); /* Використовуємо змінну для тіні */
  }
  .cash-out-btn:hover {
    background: var(--control-hover); /* Використовуємо змінну для фону при наведенні */
    transform: scale(1.05);
    box-shadow: 0 4px 12px var(--shadow-color);
  }
  .penalty-display {
    color: var(--error-color);
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
    background: var(--dot-color);
  }
  .player-piece :global(svg) {
    width: 70%;
    height: 70%;
    filter: drop-shadow(0 0 8px var(--crown-shadow)) drop-shadow(0 0 4px var(--text-accent));
    display: block;
    max-width: 100%;
    max-height: 100%;
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
  .pro-tip-link {
    margin-top: 12px;
    font-size: 0.95em;
    font-style: italic;
    opacity: 0.9;
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
  .close-replay-container {
    width: 100%;
    max-width: 480px;
    margin: 16px auto 0;
    display: flex;
    justify-content: center;
  }
  .close-replay-container .modal-btn-generic {
    min-width: 200px;
  }
</style> 