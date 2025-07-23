---
type: improvement-plan
status: виконано
title: "Відновлення UI після архітектурного рефакторингу"
id: PLAN-004
date: "2025-07-13"
author: ""
---

# Тип: План
# Статус: Виконано
# Назва: План рефакторингу UI Restoration
# Опис: Завершений план рефакторингу UI Restoration з описом етапів, цілей, рішень та підсумків виконання.

## Опис

Повне відновлення функціональності та візуального вигляду ігрового екрану після архітектурного рефакторингу на віджети, з наповненням кожного нового компонента-віджета відповідною логікою, стилями та розміткою.

---

### ✅ Крок 1: Відновлення Логіки та Стилів `TopRowWidget`

**Завдання:** Додати до компонента верхньої панелі керування всю необхідну логіку та стилі.

- [ ] Замініть весь вміст файлу `svelte-app/src/lib/components/widgets/TopRowWidget.svelte` на наступний код:

  ```svelte
  <script>
    import { navigateToMainMenu } from '$lib/utils/navigation.js';
    import { _ } from 'svelte-i18n';
    import SvgIcons from '../SvgIcons.svelte';
    import { showGameModeSelector, showGameInfoModal } from '$lib/utils/uiHelpers.js';
    import { clearCache } from '$lib/utils/cacheManager.js';
  </script>

  <div class="game-board-top-row">
    <button class="main-menu-btn" title={$_('gameBoard.mainMenu')} on:click={navigateToMainMenu}>
      <SvgIcons name="home" />
    </button>
    <button class="main-menu-btn" title={$_('gameModes.changeModeTooltip')} on:click={showGameModeSelector}>
      <SvgIcons name="game-mode" />
    </button>
    <button class="main-menu-btn" title={$_('gameBoard.info')} on:click={showGameInfoModal}>
      <SvgIcons name="info" />
    </button>
    {#if import.meta.env.DEV}
      <button class="main-menu-btn" title={$_('gameBoard.clearCache')} on:click={() => clearCache({ keepAppearance: false })}>
        <SvgIcons name="clear-cache" />
      </button>
    {/if}
  </div>
  ```

---

### ✅ Крок 2: Відновлення Логіки та Стилів `ScorePanelWidget`

**Завдання:** Додати до компонента панелі рахунку всю необхідну логіку та стилі.

- [ ] Замініть весь вміст файлу `svelte-app/src/lib/components/widgets/ScorePanelWidget.svelte` на наступний код:

  ```svelte
  <script>
    import { appState, cashOutAndEndGame } from '$lib/stores/gameStore.js';
    import { modalStore } from '$lib/stores/modalStore.js';
    import { _ } from 'svelte-i18n';
  
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
  </script>

  {#if !$appState.isReplayMode}
    <div class="score-panel game-content-block">
      <div class="score-display">
        <span class="score-label-text">{$_('gameBoard.scoreLabel')}:</span>
        <span
          class="score-value-clickable"
          class:positive-score={$appState.score > 0}
          on:click={showScoreInfo}
          on:keydown={e => (e.key === 'Enter' || e.key === ' ') && showScoreInfo()}
          role="button"
          tabindex="0"
          title={$_('modal.scoreInfoTitle')}
        >{$appState.score}</span>
        {#if $appState.penaltyPoints > 0}
          <span 
            class="penalty-display" 
            on:click={showPenaltyInfo}
            on:keydown={e => (e.key === 'Enter' || e.key === ' ') && showPenaltyInfo()}
            title={$_('gameBoard.penaltyHint')}
            role="button"
            tabindex="0"
          >-{$appState.penaltyPoints}</span>
        {/if}
      </div>
      <button class="cash-out-btn" on:click={cashOutAndEndGame} title={$_('gameBoard.cashOut')}>
        {$_('gameBoard.cashOut')}
      </button>
    </div>
  {/if}
  ```

---

### ✅ Крок 3: Відновлення Логіки та Стилів `BoardWrapperWidget`

**Завдання:** Додати до компонента ігрової дошки всю необхідну логіку та стилі.

- [ ] Замініть весь вміст файлу `svelte-app/src/lib/components/widgets/BoardWrapperWidget.svelte` на наступний код:

  ```svelte
  <script>
    import { appState, toggleBlockCell } from '$lib/stores/gameStore.js';
    import { settingsStore } from '$lib/stores/settingsStore.js';
    import { logStore } from '$lib/stores/logStore.js';
    import { modalStore } from '$lib/stores/modalStore.js';
    import SvgIcons from '../SvgIcons.svelte';
    import { replayPosition, replayCellVisitCounts, replaySegments } from '$lib/utils/replay.js';

    let showBoard = $derived($settingsStore.showBoard);
    let boardSize = $derived(Number($appState.boardSize));
    let playerRow = $derived($appState.playerRow);
    let playerCol = $derived($appState.playerCol);
    let blockedCells = $derived($appState.blockedCells);
    let blockModeEnabled = $derived($appState.blockModeEnabled);
    let showMoves = $derived($settingsStore.showMoves);
    let blockOnVisitCount = $derived($settingsStore.blockOnVisitCount);
    let activeCellVisitCounts = $derived($appState.isReplayMode ? $replayCellVisitCounts : $appState.cellVisitCounts);

    function isAvailable(row, col) {
      return $appState.availableMoves && $appState.availableMoves.some(move => move.row === row && move.col === col);
    }

    function isCellBlocked(row, col) {
      const visitCount = activeCellVisitCounts[`${row}-${col}`] || 0;
      return blockModeEnabled && visitCount > blockOnVisitCount;
    }

    function getDamageClass(row, col) {
      if (!blockModeEnabled) return '';
      const visitCount = activeCellVisitCounts[`${row}-${col}`] || 0;
      if (visitCount > 0 && visitCount <= blockOnVisitCount) {
        return `cell-damage-${visitCount}`;
      }
      return '';
    }

    function showBoardClickHint(e) {
      if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
      modalStore.showModal({
        titleKey: 'modal.boardClickTitle',
        contentKey: 'modal.boardClickContent',
        buttons: [{ textKey: 'modal.ok', primary: true, isHot: true }]
      });
    }

    function onCellRightClick(event, row, col) {
      if (!(event instanceof MouseEvent)) return;
      event.preventDefault();
      if (blockModeEnabled && !(row === playerRow && col === playerCol)) {
        const blocked = blockedCells && blockedCells.some(cell => cell.row === row && cell.col === col);
        logStore.addLog(`${blocked ? 'Розблокування' : 'Блокування'} клітинки [${row},${col}]`, 'info');
        toggleBlockCell(row, col);
      }
    }
  </script>

  <div 
    class="board-bg-wrapper game-content-block" 
    class:hidden={!showBoard && !$appState.isReplayMode}
    style="--board-size: {boardSize}"
    on:click={showBoardClickHint} 
    on:keydown={(e) => (e.key === 'Enter' || e.key === ' ') && showBoardClickHint(e)}
    role="button"
    tabindex="0"
    aria-label="Ігрове поле"
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
            {:else if !$appState.isReplayMode && $settingsStore.showMoves && isAvailable(rowIdx, colIdx)}
              <span class="move-dot"></span>
            {/if}
          </div>
        {/each}
      {/each}
      {#if $appState.isReplayMode}
        <svg class="replay-path-svg" viewBox="0 0 100 100" overflow="visible">
          {#each $replaySegments as segment, i (i)}
            <line x1={segment.x1} y1={segment.y1} x2={segment.x2} y2={segment.y2} stroke={segment.color} stroke-opacity={segment.opacity}/>
          {/each}
        </svg>
      {/if}
      {#if ($appState.isReplayMode || $settingsStore.showQueen) && $replayPosition}
        {#key $appState.gameId}
          <div class="player-piece" style="top: {$replayPosition.row * (100 / $appState.boardSize)}%; left: {$replayPosition.col * (100 / $appState.boardSize)}%;">
            <div class="piece-container"><SvgIcons name="queen" /></div>
          </div>
        {/key}
      {/if}
    </div>
  </div>
  ```

---

### ✅ Крок 4: Відновлення Логіки та Стилів `ControlsPanelWidget`

**Завдання:** Додати до компонента панелі керування всю необхідну логіку та стилі.

- [ ] Замініть весь вміст файлу `svelte-app/src/lib/components/widgets/ControlsPanelWidget.svelte` на:

  ```svelte
  <script>
    import { appState, setDirection, setDistance, availableDistances } from '$lib/stores/gameStore.js';
    import { confirmPlayerMove, claimNoMoves } from '$lib/gameOrchestrator.js';
    import { _ } from 'svelte-i18n';
    import { settingsStore } from '$lib/stores/settingsStore.js';
    import SvgIcons from '../SvgIcons.svelte';
    import { get } from 'svelte/store';

    $: isPlayerTurn = $appState.players[$appState.currentPlayerIndex]?.type === 'human';
    $: computerLastMoveDisplay = $appState.computerLastMoveDisplay;
    const directionArrows = { 'up-left': '↖', 'up': '↑', 'up-right': '↗', 'left': '←', 'right': '→', 'down-left': '↙', 'down': '↓', 'down-right': '↘' };
    $: selectedDirection = $appState.selectedDirection || null;
    $: selectedDistance = $appState.selectedDistance || null;
    $: buttonDisabled = !selectedDirection || !selectedDistance;

    $: centerInfoState = (() => {
      if (!selectedDirection && !selectedDistance && !computerLastMoveDisplay) return { class: '', content: '', clickable: false, aria: 'Порожньо' };
      if (!selectedDirection && !selectedDistance && computerLastMoveDisplay) {
        const dir = directionArrows[computerLastMoveDisplay.direction] || '';
        const dist = computerLastMoveDisplay.distance || '';
        return { class: 'computer-move-display', content: `${dir}${dist}`, clickable: false, aria: `Хід комп'ютера: ${dir}${dist}` };
      }
      if (selectedDirection && !selectedDistance) return { class: 'direction-distance-state', content: directionArrows[selectedDirection], clickable: false, aria: `Вибрано напрямок: ${directionArrows[selectedDirection]}` };
      if (!selectedDirection && selectedDistance) return { class: 'direction-distance-state', content: String(selectedDistance), clickable: false, aria: `Вибрано відстань: ${selectedDistance}` };
      if (selectedDirection && selectedDistance) {
        const dir = directionArrows[selectedDirection] || '';
        return { class: 'confirm-btn-active', content: `${dir}${selectedDistance}`, clickable: isPlayerTurn, aria: `Підтвердити хід: ${dir}${selectedDistance}` };
      }
      return { class: '', content: '', clickable: false, aria: '' };
    })();

    function onCentralClick() { if (selectedDirection && selectedDistance && isPlayerTurn) confirmPlayerMove(); }
    /** @param {import('$lib/stores/gameStore').Direction} dir */
    function onDirectionClick(dir) { setDirection(dir); }
    /** @param {number} dist */
    function onDistanceClick(dist) { setDistance(dist); }
    
    $: numColumns = ((count) => {
      if (count <= 4) return count;
      if (count === 5 || count === 6) return 3;
      return 4;
    })($availableDistances.length);
  </script>

  <div class="game-controls-panel">
    <div class="directions directions-3x3">
      <button class="dir-btn {selectedDirection === 'up-left' ? 'active' : ''}" on:click={() => onDirectionClick('up-left')} title={`${$_('tooltips.up-left')}\n(${$settingsStore.keybindings['up-left'].join(', ')})`}>↖</button>
      <button class="dir-btn {selectedDirection === 'up' ? 'active' : ''}" on:click={() => onDirectionClick('up')} title={`${$_('tooltips.up')}\n(${$settingsStore.keybindings['up'].join(', ')})`}>↑</button>
      <button class="dir-btn {selectedDirection === 'up-right' ? 'active' : ''}" on:click={() => onDirectionClick('up-right')} title={`${$_('tooltips.up-right')}\n(${$settingsStore.keybindings['up-right'].join(', ')})`}>↗</button>
      <button class="dir-btn {selectedDirection === 'left' ? 'active' : ''}" on:click={() => onDirectionClick('left')} title={`${$_('tooltips.left')}\n(${$settingsStore.keybindings['left'].join(', ')})`}>←</button>
      <button id="center-info" class="control-btn center-info {centerInfoState.class}" type="button" aria-label={centerInfoState.aria} on:click={onCentralClick} disabled={!centerInfoState.clickable}>{String(centerInfoState.content)}</button>
      <button class="dir-btn {selectedDirection === 'right' ? 'active' : ''}" on:click={() => onDirectionClick('right')} title={`${$_('tooltips.right')}\n(${$settingsStore.keybindings['right'].join(', ')})`}>→</button>
      <button class="dir-btn {selectedDirection === 'down-left' ? 'active' : ''}" on:click={() => onDirectionClick('down-left')} title={`${$_('tooltips.down-left')}\n(${$settingsStore.keybindings['down-left'].join(', ')})`}>↙</button>
      <button class="dir-btn {selectedDirection === 'down' ? 'active' : ''}" on:click={() => onDirectionClick('down')} title={`${$_('tooltips.down')}\n(${$settingsStore.keybindings['down'].join(', ')})`}>↓</button>
      <button class="dir-btn {selectedDirection === 'down-right' ? 'active' : ''}" on:click={() => onDirectionClick('down-right')} title={`${$_('tooltips.down-right')}\n(${$settingsStore.keybindings['down-right'].join(', ')})`}>↘</button>
    </div>
    <div class="distance-select">
      <div>{$_('gameControls.selectDistance')}</div>
      <div class="distance-btns" style="--num-columns: {numColumns};">
        {#each $availableDistances as dist}
          <button class="dist-btn {selectedDistance === dist ? 'active' : ''}" on:click={() => onDistanceClick(dist)}>{dist}</button>
        {/each}
      </div>
    </div>
    <div class="action-btns">
      <button class="confirm-btn" on:click={confirmPlayerMove} disabled={buttonDisabled} title={`${$_('tooltips.confirm')}\n(${$settingsStore.keybindings['confirm']})`}>
        <SvgIcons name="confirm" />
        {$_('gameControls.confirm')}
      </button>
      {#if $appState.blockModeEnabled}
        <button class="no-moves-btn" on:click={claimNoMoves} title={`${$_('tooltips.no-moves')}\n(${$settingsStore.keybindings['no-moves']})`}>
          <SvgIcons name="no-moves" />
          {$_('gameControls.noMovesTitle')}
        </button>
      {/if}
    </div>
  </div>
  ```

---

### ✅ Крок 5: Відновлення Логіки та Стилів `SettingsExpanderWidget`

**Завдання:** Додати до компонента налаштувань всю необхідну логіку та стилі.

- [ ] Замініть весь вміст файлу `svelte-app/src/lib/components/widgets/SettingsExpanderWidget.svelte` на:

  ```svelte
  <script>
    import { appState, setBoardSize } from '$lib/stores/gameStore.js';
    import { modalStore } from '$lib/stores/modalStore.js';
    import { _ } from 'svelte-i18n';
    import { openVoiceSettingsModal } from '$lib/stores/uiStore.js';
    import { settingsStore } from '$lib/stores/settingsStore.js';
    import SvgIcons from '../SvgIcons.svelte';
    import { get } from 'svelte/store';

    $: showMoves = $settingsStore.showMoves;
    $: showBoard = $settingsStore.showBoard;
    $: speechEnabled = $settingsStore.speechEnabled;
    $: blockModeEnabled = $appState.blockModeEnabled;

    function changeBoardSize(increment) {
      const currentSize = get(appState).boardSize;
      const newSize = currentSize + increment;
      if (newSize >= 2 && newSize <= 9) selectBoardSize(newSize);
    }

    function selectBoardSize(n) {
      const state = get(appState);
      if (state.boardSize === n) return;
      if (state.score === 0 && state.penaltyPoints === 0) {
        setBoardSize(n);
        return;
      }
      modalStore.showModal({
        titleKey: 'modal.resetScoreTitle',
        contentKey: 'modal.resetScoreContent',
        buttons: [
          { textKey: 'modal.resetScoreConfirm', customClass: 'green-btn', isHot: true, onClick: () => { setBoardSize(n); modalStore.closeModal(); } },
          { textKey: 'modal.resetScoreCancel', onClick: modalStore.closeModal }
        ]
      });
    }

    function selectBlockCount(count) {
      const hasSeenWarning = localStorage.getItem('hasSeenExpertModeWarning');
      if (count > 0 && !hasSeenWarning) {
        modalStore.showModal({
          titleKey: 'modal.expertModeTitle',
          contentKey: 'modal.expertModeContent',
          buttons: [
            { textKey: 'modal.expertModeConfirm', primary: true, isHot: true, onClick: () => { localStorage.setItem('hasSeenExpertModeWarning', 'true'); settingsStore.updateSettings({ blockOnVisitCount: count }); modalStore.closeModal(); } },
            { textKey: 'modal.expertModeCancel', onClick: modalStore.closeModal }
          ]
        });
      } else {
        settingsStore.updateSettings({ blockOnVisitCount: count });
      }
    }
  </script>

  <details class="settings-expander" open>
    <summary class="settings-summary">
      {$_('gameControls.settings')}
      <span class="expander-arrow" aria-hidden="true"><svg viewBox="0 0 24 24" width="24" height="24"><polyline points="6 9 12 15 18 9" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
    </summary>
    <div class="toggles">
      <div class="setting-item board-size-control">
        <span>{$_('settings.boardSize')}</span>
        <div class="size-adjuster">
          <button class="adjust-btn" on:click={() => changeBoardSize(-1)} disabled={$appState.boardSize <= 2}>-</button>
          <span class="current-size">{$appState.boardSize}x{$appState.boardSize}</span>
          <button class="adjust-btn" on:click={() => changeBoardSize(1)} disabled={$appState.boardSize >= 9}>+</button>
        </div>
      </div>
      <label class="ios-switch-label">
        <div class="switch-content-wrapper"><div class="ios-switch"><input type="checkbox" checked={showBoard} on:change={settingsStore.toggleShowBoard} /><span class="slider"></span></div><span>{$_('gameControls.showBoard')}</span></div>
      </label>
      <label class="ios-switch-label" class:disabled={!showBoard}>
        <div class="switch-content-wrapper"><div class="ios-switch"><input type="checkbox" checked={$settingsStore.showQueen} on:change={settingsStore.toggleShowQueen} disabled={!showBoard} /><span class="slider"></span></div><span>{$_('gameControls.showQueen')}</span></div>
      </label>
      <label class="ios-switch-label" class:disabled={!showBoard || !$settingsStore.showQueen}>
        <div class="switch-content-wrapper"><div class="ios-switch"><input type="checkbox" checked={showMoves} on:change={settingsStore.toggleShowMoves} disabled={!showBoard || !$settingsStore.showQueen} /><span class="slider"></span></div><span>{$_('gameControls.showMoves')}</span></div>
      </label>
      <label class="ios-switch-label">
        <div class="switch-content-wrapper"><div class="ios-switch"><input type="checkbox" checked={blockModeEnabled} on:change={() => settingsStore.updateSettings({ blockModeEnabled: !blockModeEnabled })} /><span class="slider"></span></div><span>{$_('gameControls.blockMode')}</span></div>
      </label>
      {#if blockModeEnabled}
        <div class="block-mode-options">
          <span class="options-label">{$_('gameControls.blockAfter')}</span>
          <div class="options-values" role="radiogroup">
            {#each [0, 1, 2, 3] as count}
              <button class="count-selector-btn" class:active={$settingsStore.blockOnVisitCount === count} on:click={() => selectBlockCount(count)}>{count}</button>
            {/each}
          </div>
        </div>
      {/if}
      <label class="ios-switch-label">
        <div class="switch-content-wrapper"><div class="ios-switch"><input type="checkbox" bind:checked={speechEnabled} on:change={() => settingsStore.toggleSpeech()} /><span class="slider"></span></div><span>{$_('gameControls.speech')}</span></div>
        <button class="settings-icon-btn" title={$_('gameControls.voiceSettingsTitle')} on:click|stopPropagation={openVoiceSettingsModal}><SvgIcons name="voice-settings" /></button>
      </label>
      <label class="ios-switch-label">
        <div class="switch-content-wrapper"><div class="ios-switch"><input type="checkbox" checked={$settingsStore.autoHideBoard} on:change={settingsStore.toggleAutoHideBoard} /><span class="slider"></span></div><span>{$_('gameModes.autoHideBoard')}</span></div>
      </label>
    </div>
  </details>
  ```