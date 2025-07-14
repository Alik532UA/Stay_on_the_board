<script>
  import { appState, toggleBlockMode, toggleShowMoves, toggleShowBoard, toggleSpeech, setDirection, setDistance, confirmMove, noMoves, resetGame } from '../stores/gameStore.js';
  import { modalStore } from '../stores/modalStore.js';
  import { logStore } from '../stores/logStore.js';
  import { _ } from 'svelte-i18n';
  $: blockModeEnabled = typeof $appState.blockModeEnabled === 'boolean' ? $appState.blockModeEnabled : false;
  $: showMoves = typeof $appState.settings?.showMoves === 'boolean' ? $appState.settings.showMoves : true;
  $: showBoard = typeof $appState.settings?.showBoard === 'boolean' ? $appState.settings.showBoard : true;
  $: speechEnabled = typeof $appState.settings?.speechEnabled === 'boolean' ? $appState.settings.speechEnabled : false;
  $: selectedDirection = $appState.selectedDirection || null;
  $: selectedDistance = $appState.selectedDistance || null;
  $: availableDistances = $appState.availableDistances || [1,2];
  $: buttonDisabled = !selectedDirection || !selectedDistance;
  
  // Логування зміни стану кнопки
  $: console.log('[GameControls] Button state changed:', {
    selectedDirection,
    selectedDistance,
    buttonDisabled
  });

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
    <label class="switch">
      <input type="checkbox" bind:checked={showMoves} on:change={onShowMovesChange} />
      <span class="slider"></span>
      {$_('gameControls.showMoves')}
    </label>
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
  <div class="directions">
    <button class="dir-btn {selectedDirection === 'up-left' ? 'active' : ''}" on:click={() => onDirectionClick('up-left')}>↖️</button>
    <button class="dir-btn {selectedDirection === 'up' ? 'active' : ''}" on:click={() => onDirectionClick('up')}>⬆️</button>
    <button class="dir-btn {selectedDirection === 'up-right' ? 'active' : ''}" on:click={() => onDirectionClick('up-right')}>↗️</button>
    <button class="dir-btn {selectedDirection === 'left' ? 'active' : ''}" on:click={() => onDirectionClick('left')}>⬅️</button>
    <button class="dir-btn" on:click={() => onDirectionClick('center')} disabled>•</button>
    <button class="dir-btn {selectedDirection === 'right' ? 'active' : ''}" on:click={() => onDirectionClick('right')}>➡️</button>
    <button class="dir-btn {selectedDirection === 'down-left' ? 'active' : ''}" on:click={() => onDirectionClick('down-left')}>↙️</button>
    <button class="dir-btn {selectedDirection === 'down' ? 'active' : ''}" on:click={() => onDirectionClick('down')}>⬇️</button>
    <button class="dir-btn {selectedDirection === 'down-right' ? 'active' : ''}" on:click={() => onDirectionClick('down-right')}>↘️</button>
  </div>
  <div class="distance-select">
    <div>{$_('gameControls.selectDistance')}</div>
    <div class="distance-btns">
      {#each availableDistances as dist}
        <button class="dist-btn {selectedDistance === dist ? 'active' : ''}" on:click={() => onDistanceClick(dist)}>{dist}</button>
      {/each}
    </div>
  </div>
  <div class="action-btns">
    <button class="confirm-btn" on:click={onConfirmMove} disabled={buttonDisabled}>{$_('gameControls.confirm')}</button>
    <button class="no-moves-btn" on:click={onNoMoves}>{$_('gameControls.noMoves')}</button>
  </div>
</div>

<style>
.game-controls-panel {
  background: rgba(80,0,80,0.18);
  border-radius: 24px;
  padding: 24px 18px 24px 18px;
  margin-top: 18px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 18px;
  min-width: 320px;
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
.directions {
  display: grid;
  grid-template-columns: repeat(3, 44px);
  grid-template-rows: repeat(3, 44px);
  gap: 8px;
  margin: 10px 0;
}
.dir-btn {
  width: 44px;
  height: 44px;
  font-size: 1.5em;
  border: none;
  border-radius: 8px;
  background: #2d0036;
  color: #fff;
  cursor: pointer;
  transition: background 0.2s, transform 0.15s;
}
.dir-btn:focus, .dir-btn:hover {
  background: #ff9800;
  color: #222;
  outline: none;
  transform: scale(1.08);
}
.dir-btn[disabled] {
  background: transparent;
  color: #bbb;
  cursor: default;
}
.dir-btn.active,
.dist-btn.active {
  background: #ff9800;
  color: #222;
  font-weight: bold;
  box-shadow: 0 0 0 2px #fff8;
}
.distance-select {
  width: 100%;
  text-align: center;
  margin: 10px 0 0 0;
}
.distance-btns {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-top: 6px;
}
.dist-btn {
  background: #2d0036;
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 6px 18px;
  font-size: 1.1em;
  cursor: pointer;
  transition: background 0.2s, transform 0.15s;
}
.dist-btn:focus, .dist-btn:hover {
  background: #ff9800;
  color: #222;
  outline: none;
  transform: scale(1.08);
}
.action-btns {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  margin-top: 10px;
}
.confirm-btn {
  background: #43a047;
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 10px 0;
  font-size: 1.1em;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s, transform 0.15s;
}
.confirm-btn:focus, .confirm-btn:hover {
  background: #66bb6a;
  color: #222;
  outline: none;
  transform: scale(1.04);
}
.confirm-btn:disabled {
  background: #ccc;
  color: #666;
  cursor: not-allowed;
  transform: none;
}
.confirm-btn:disabled:hover {
  background: #ccc;
  color: #666;
  transform: none;
}
.no-moves-btn {
  background: #ffb300;
  color: #222;
  border: none;
  border-radius: 8px;
  padding: 10px 0;
  font-size: 1.1em;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s, transform 0.15s;
}
.no-moves-btn:focus, .no-moves-btn:hover {
  background: #ffe082;
  color: #222;
  outline: none;
  transform: scale(1.04);
}
</style> 