<script>
  // Додаємо максимальне логування для імпортів
  try {
    import { appState, toggleBlockMode, toggleShowMoves, toggleShowBoard, toggleSpeech, setDirection, setDistance, confirmMove, noMoves, resetGame, availableDistances } from '../stores/gameStore.js';
    console.log('[GameControls] Імпортовано gameStore.js успішно');
  } catch (e) {
    console.error('[GameControls] Помилка імпорту gameStore.js:', e);
  }
  try {
    import { modalStore } from '$lib/stores/modalStore.js';
    console.log('[GameControls] Імпортовано modalStore.js успішно');
  } catch (e) {
    console.error('[GameControls] Помилка імпорту modalStore.js:', e);
  }
  try {
    import { logStore } from '$lib/stores/logStore.js';
    console.log('[GameControls] Імпортовано logStore.js успішно');
  } catch (e) {
    console.error('[GameControls] Помилка імпорту logStore.js:', e);
  }
  try {
    import { _ } from 'svelte-i18n';
    console.log('[GameControls] Імпортовано svelte-i18n успішно');
  } catch (e) {
    console.error('[GameControls] Помилка імпорту svelte-i18n:', e);
  }
  import { onMount } from 'svelte';
</script>
  $: isPlayerTurn = $appState.currentPlayer === 1;
  $: computerLastMoveDisplay = $appState.computerLastMoveDisplay;
  // Для відображення стрілки за напрямком
  const directionArrows = {
    'up-left': '↖',
    'up': '↑',
    'up-right': '↗',
    'left': '←',
    'right': '→',
    'down-left': '↙',
    'down': '↓',
    'down-right': '↘',
  };
  function getCentralText() {
    if (typeof computerLastMoveDisplay === 'object' && computerLastMoveDisplay !== null && typeof computerLastMoveDisplay.direction === 'string') {
      const dir = directionArrows[computerLastMoveDisplay.direction] || '';
      const dist = typeof computerLastMoveDisplay.distance === 'number' ? computerLastMoveDisplay.distance : '';
      return `${dir}${dist}`;
    }
    if (selectedDirection && selectedDistance) {
      return `${directionArrows[selectedDirection] || ''}${selectedDistance}`;
    }
    if (selectedDirection) {
      return directionArrows[selectedDirection];
    }
    return '•';
  }
  function onCentralClick() {
    if (selectedDirection && selectedDistance && isPlayerTurn) {
      onConfirmMove();
    }
  }
  $: blockModeEnabled = typeof $appState.blockModeEnabled === 'boolean' ? $appState.blockModeEnabled : false;
  $: showMoves = typeof $appState.settings?.showMoves === 'boolean' ? $appState.settings.showMoves : true;
  $: showBoard = typeof $appState.settings?.showBoard === 'boolean' ? $appState.settings.showBoard : true;
  $: speechEnabled = typeof $appState.settings?.speechEnabled === 'boolean' ? $appState.settings.speechEnabled : false;
  $: selectedDirection = $appState.selectedDirection || null;
  $: selectedDistance = $appState.selectedDistance || null;
  $: buttonDisabled = !selectedDirection || !selectedDistance;
  
  // Логування зміни стану кнопки
  $: console.log('[GameControls] Button state changed:', {
    selectedDirection,
    selectedDistance,
    buttonDisabled
  });

  // --- CENTRAL BUTTON STATE LOGIC ---
  $: centerInfoState = (() => {
    // 1. Початковий стан: нічого не вибрано, немає ходу комп'ютера
    if (!selectedDirection && !selectedDistance && !computerLastMoveDisplay) {
      return { class: '', content: '', clickable: false, aria: 'Порожньо' };
    }
    // 2. Показ ходу комп'ютера
    if (!selectedDirection && !selectedDistance && typeof computerLastMoveDisplay === 'object' && computerLastMoveDisplay !== null) {
      let dir = '';
      let dist = '';
      if (typeof computerLastMoveDisplay.direction === 'string' && directionArrows.hasOwnProperty(computerLastMoveDisplay.direction)) {
        dir = directionArrows[computerLastMoveDisplay.direction];
      }
      if (typeof computerLastMoveDisplay.distance === 'number') {
        dist = computerLastMoveDisplay.distance;
      }
      return {
        class: 'computer-move-display',
        content: `${dir}${dist}`,
        clickable: false,
        aria: `Хід комп'ютера: ${dir}${dist}`
      };
    }
    // 3. Тільки напрямок
    if (selectedDirection && !selectedDistance) {
      let dir = '';
      if (typeof selectedDirection === 'string' && directionArrows.hasOwnProperty(selectedDirection)) {
        dir = directionArrows[selectedDirection];
      }
      return {
        class: 'direction-distance-state',
        content: dir,
        clickable: false,
        aria: `Вибрано напрямок: ${dir}`
      };
    }
    // 4. Тільки відстань
    if (!selectedDirection && selectedDistance) {
      return {
        class: 'direction-distance-state',
        content: selectedDistance,
        clickable: false,
        aria: `Вибрано відстань: ${selectedDistance}`
      };
    }
    // 5. Підтверджуваний хід (напрямок + відстань)
    if (selectedDirection && selectedDistance) {
      let dir = '';
      if (typeof selectedDirection === 'string' && directionArrows.hasOwnProperty(selectedDirection)) {
        dir = directionArrows[selectedDirection];
      }
      return {
        class: 'confirm-btn-active',
        content: `${dir}${selectedDistance}`,
        clickable: isPlayerTurn,
        aria: `Підтвердити хід: ${dir}${selectedDistance}`
      };
    }
    // fallback
    return { class: '', content: '', clickable: false, aria: '' };
  })();

  /**
   * @typedef {Object} ModalButton
   * @property {string} text
   * @property {boolean} [primary]
   * @property {() => void} [onClick]
   */

  function confirmReset() {
    logStore.addLog('Запит на скидання гри', 'info');
    /** @type {ModalButton[]} */
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

  function onBlockModeChange() { toggleBlockMode(); }
  function onShowMovesChange() { toggleShowMoves(); }
  function onShowBoardChange() { toggleShowBoard(); }
  function onSpeechChange() { toggleSpeech(); }
  /**
   * @param {string} dir
   */
  function onDirectionClick(dir) { setDirection(dir); }
  /**
   * @param {number} dist
   */
  function onDistanceClick(dist) { setDistance(dist); }
  function onConfirmMove() { 
    console.log('[GameControls] Confirm move button clicked', {
      selectedDirection,
      selectedDistance,
      buttonDisabled
    });
    confirmMove(); 
  }
  function onNoMoves() { noMoves(); }
</script>

<div class="game-controls-panel">
  <div class="toggles">
    {#if showBoard}
      <label class="switch">
        <input type="checkbox" bind:checked={showMoves} on:change={onShowMovesChange} />
        <span class="slider"></span>
        {$_('gameControls.showMoves')}
      </label>
    {/if}
    <label class="switch">
      <input type="checkbox" bind:checked={showBoard} on:change={onShowBoardChange} />
      <span class="slider"></span>
      {$_('gameControls.showBoard')}
    </label>
    <label class="switch">
      <input type="checkbox" bind:checked={blockModeEnabled} on:change={onBlockModeChange} />
      <span class="slider"></span>
      {$_('gameControls.blockMode')}
    </label>
    <label class="switch">
      <input type="checkbox" bind:checked={speechEnabled} on:change={onSpeechChange} />
      <span class="slider"></span>
      {$_('gameControls.speech')} <span style="font-size:1.1em;">&#9881;</span>
    </label>
  </div>
  <div class="directions directions-3x3">
    <button class="dir-btn {selectedDirection === 'up-left' ? 'active' : ''}" on:click={() => onDirectionClick('up-left')}>↖</button>
    <button class="dir-btn {selectedDirection === 'up' ? 'active' : ''}" on:click={() => onDirectionClick('up')}>↑</button>
    <button class="dir-btn {selectedDirection === 'up-right' ? 'active' : ''}" on:click={() => onDirectionClick('up-right')}>↗</button>
    <button class="dir-btn {selectedDirection === 'left' ? 'active' : ''}" on:click={() => onDirectionClick('left')}>←</button>
    <button
      id="center-info"
      class="control-btn center-info {centerInfoState.class}"
      type="button"
      aria-label={centerInfoState.aria}
      on:click={centerInfoState.clickable ? onCentralClick : undefined}
      tabindex="0"
      disabled={!centerInfoState.clickable}
    >
      {centerInfoState.content}
    </button>
    <button class="dir-btn {selectedDirection === 'right' ? 'active' : ''}" on:click={() => onDirectionClick('right')}>→</button>
    <button class="dir-btn {selectedDirection === 'down-left' ? 'active' : ''}" on:click={() => onDirectionClick('down-left')}>↙</button>
    <button class="dir-btn {selectedDirection === 'down' ? 'active' : ''}" on:click={() => onDirectionClick('down')}>↓</button>
    <button class="dir-btn {selectedDirection === 'down-right' ? 'active' : ''}" on:click={() => onDirectionClick('down-right')}>↘</button>
  </div>
  <div class="distance-select">
    <div>{$_('gameControls.selectDistance')}</div>
    <div class="distance-btns">
      {#each $availableDistances as dist}
        <button class="dist-btn {selectedDistance === dist ? 'active' : ''}" on:click={() => onDistanceClick(dist)}>{dist}</button>
      {/each}
    </div>
  </div>
  <div class="action-btns">
    <button class="confirm-btn" on:click={onConfirmMove} disabled={buttonDisabled} title={$_('gameControls.confirm')}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" style="margin-right:8px;vertical-align:middle;"><path d="M5 13l4 4L19 7" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
      {$_('gameControls.confirm')}
    </button>
    {#if blockModeEnabled}
      <button class="no-moves-btn" on:click={onNoMoves} title="Ходів немає">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" style="margin-right:8px;vertical-align:middle;"><path d="M18 6L6 18M6 6l12 12" stroke="#222" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        Ходів немає
      </button>
    {/if}
  </div>
</div>

<style>
.game-controls-panel {
  background: rgba(80,0,80,0.18);
  border-radius: 24px;
  padding: 24px 18px 24px 18px;
  /* margin-top: 18px; */
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  min-width: 320px;
  /* Glassmorphism */
  backdrop-filter: blur(12px);
  box-shadow: 0 8px 32px 0 rgba(80,0,80,0.18);
  border: 1.5px solid rgba(255,255,255,0.18);
}
.toggles {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
}
.switch {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 1.08em;
}
.switch input[type="checkbox"] {
  display: none;
}
.switch .slider {
  width: 36px;
  height: 20px;
  background: #ccc;
  border-radius: 12px;
  position: relative;
  margin-right: 6px;
  transition: background 0.2s;
}
.switch input[type="checkbox"]:checked + .slider {
  background: #ff9800;
}
.switch .slider:before {
  content: '';
  position: absolute;
  left: 2px;
  top: 2px;
  width: 16px;
  height: 16px;
  background: #fff;
  border-radius: 50%;
  transition: transform 0.2s;
}
.switch input[type="checkbox"]:checked + .slider:before {
  transform: translateX(16px);
}
.directions-3x3 {
  display: grid;
  grid-template-columns: repeat(3, 85px);
  grid-template-rows: repeat(3, 85px);
  gap: 14px;
  margin: 18px 0 10px 0;
  justify-content: center;
}
.dir-btn, .dist-btn {
  width: 85px;
  height: 85px;
  font-size: 2.21em;
  font-family: 'M PLUS Rounded 1c', sans-serif !important;
  border-radius: 12px;
}
.dir-btn {
  border: none;
  border-radius: 16px;
  background: rgba(255,255,255,0.13);
  color: #fff;
  cursor: pointer;
  transition: background 0.25s, box-shadow 0.25s, color 0.2s, transform 0.15s;
  box-shadow: 0 2px 16px 0 rgba(80,0,80,0.10);
  backdrop-filter: blur(6px);
  outline: none;
  position: relative;
  z-index: 1;
}
.dir-btn:focus, .dir-btn:hover {
  background: rgba(255,152,0,0.25);
  color: #ff9800;
  transform: scale(1.10);
  box-shadow: 0 4px 24px 0 #ff980088;
}
.dir-btn[disabled] {
  background: transparent;
  color: #bbb;
  cursor: default;
  box-shadow: none;
}
.dir-btn.active {
  background: rgba(255,152,0,0.45);
  color: #fff;
  font-weight: bold;
  box-shadow: 0 0 0 3px #ff9800cc, 0 4px 24px 0 #ff980088;
  transform: scale(1.12);
}
.central-btn {
  font-size: 1.56em;
  background: rgba(67,160,71,0.13);
  color: #222;
  border: 2.5px solid #43a047;
  border-radius: 12px;
  transition: background 0.2s, box-shadow 0.2s, color 0.2s;
  box-shadow: 0 0 0 0 #43a047;
  z-index: 2;
  backdrop-filter: blur(8px);
  width: 65px;
  height: 65px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.central-btn.active-confirm {
  background: #43a047cc;
  color: #fff;
  animation: pulse-green 1s infinite alternate;
  border: 2.5px solid #43a047;
  box-shadow: 0 0 16px 4px #43a04799, 0 4px 24px 0 #43a04744;
  cursor: pointer;
}
.central-btn.show-move {
  background: #ff9800cc;
  color: #fff;
  border: 2.5px solid #ff9800;
  animation: none;
  box-shadow: 0 0 16px 4px #ff980099, 0 4px 24px 0 #ff980044;
}
@keyframes pulse-green {
  0% { box-shadow: 0 0 0 0 #43a04799, 0 4px 24px 0 #43a04744; }
  100% { box-shadow: 0 0 24px 8px #43a04799, 0 4px 24px 0 #43a04744; }
}
.distance-select {
  width: 100%;
  text-align: center;
  margin: 18px 0 0 0;
}
.distance-btns {
  display: flex;
  gap: 18px;
  justify-content: center;
  margin-top: 10px;
}
.dist-btn {
  background: rgba(255,255,255,0.13);
  color: #fff;
  border: none;
  border-radius: 12px;
  width: 44px;
  height: 44px;
  font-size: 1.2em;
  cursor: pointer;
  transition: background 0.22s, color 0.18s, box-shadow 0.22s, transform 0.15s;
  box-shadow: 0 2px 12px 0 rgba(80,0,80,0.10);
  backdrop-filter: blur(6px);
  outline: none;
  display: flex;
  align-items: center;
  justify-content: center;
}
.dist-btn:focus, .dist-btn:hover {
  background: rgba(255,152,0,0.25);
  color: #ff9800;
  transform: scale(1.10);
  box-shadow: 0 4px 16px 0 #ff980088;
}
.dist-btn.active {
  background: rgba(255,152,0,0.45);
  color: #fff;
  font-weight: bold;
  box-shadow: 0 0 0 3px #ff9800cc, 0 4px 16px 0 #ff980088;
  transform: scale(1.12);
}
/* --- Improved action-btns --- */
.action-btns {
  display: flex;
  flex-direction: column !important;
  gap: 14px;
  align-items: center;
}
@media (max-width: 600px) {
  .action-btns {
    flex-direction: column !important;
    gap: 14px;
    padding: 10px 0 6px 0;
  }
}
.confirm-btn, .no-moves-btn {
  flex: 1 1 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.18em;
  font-weight: 700;
  border: none;
  border-radius: 12px;
  min-height: 54px;
  min-width: 0;
  padding: 0 0.5em;
  box-shadow: 0 2px 16px 0 rgba(80,0,80,0.10);
  transition: background 0.22s, color 0.18s, box-shadow 0.22s, transform 0.15s;
  cursor: pointer;
  letter-spacing: 0.01em;
}
.confirm-btn {
  background: linear-gradient(90deg, #43a047 60%, #66bb6a 100%);
  color: #fff;
  box-shadow: 0 4px 24px 0 #43a04733;
}
.confirm-btn:focus, .confirm-btn:hover {
  background: linear-gradient(90deg, #66bb6a 60%, #43a047 100%);
  color: #fff;
  outline: none;
  transform: scale(1.045);
  box-shadow: 0 6px 32px 0 #43a04755;
}
.confirm-btn:disabled {
  background: #ccc;
  color: #666;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}
.no-moves-btn {
  background: linear-gradient(90deg, #ffb300 60%, #ffe082 100%);
  color: #222;
  box-shadow: 0 4px 24px 0 #ffb30033;
}
.no-moves-btn:focus, .no-moves-btn:hover {
  background: linear-gradient(90deg, #ffe082 60%, #ffb300 100%);
  color: #222;
  outline: none;
  transform: scale(1.045);
  box-shadow: 0 6px 32px 0 #ffb30055;
}
</style> 