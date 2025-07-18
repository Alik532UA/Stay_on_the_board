<script>
  import { appState, toggleBlockMode, setDirection, setDistance, confirmMove, noMoves, resetGame, availableDistances } from '$lib/stores/gameStore.js';
  import { modalStore } from '$lib/stores/modalStore.js';
  import { logStore } from '$lib/stores/logStore.js';
  import { _ } from 'svelte-i18n';
  import { onMount } from 'svelte';
  import { openVoiceSettingsModal } from '$lib/stores/uiStore.js';
  import { settingsStore, toggleShowBoard, toggleShowMoves, toggleSpeech, toggleHideQueen } from '$lib/stores/settingsStore.js';
  import SvgIcons from './SvgIcons.svelte';
  $: isPlayerTurn = $appState.players[$appState.currentPlayerIndex]?.type === 'human';
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
      return `${directionArrows[selectedDirection] || ''}${String(selectedDistance)}`;
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
  $: showMoves = $settingsStore.showMoves;
  $: showBoard = $settingsStore.showBoard;
  $: speechEnabled = $settingsStore.speechEnabled;
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
        dist = String(computerLastMoveDisplay.distance);
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
        content: String(selectedDistance),
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
        content: `${dir}${String(selectedDistance)}`,
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
  /**
   * @param {string} dir
   */
  function onDirectionClick(dir) {
    // Перевіряємо, чи є переданий рядок валідним напрямком
    if (Object.keys(directionArrows).includes(dir)) {
      setDirection(/** @type {import('$lib/stores/gameStore').Direction} */ (dir));
    }
  }
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

  /**
   * @param {Event} event
   */
  async function onSpeechChange(event) {
    // Викликаємо toggleSpeech без аргументів, щоб уникнути помилки типу
    await toggleSpeech();
  }
</script>

<div class="game-controls-panel">
  <details class="settings-expander">
    <summary class="settings-summary">{$_('gameControls.settings')}</summary>
    <div class="toggles">
      <!-- 1. Показати дошку -->
      <label class="ios-switch-label">
        <div class="switch-content-wrapper">
          <div class="ios-switch">
            <input type="checkbox" checked={showBoard} onchange={onShowBoardChange} />
            <span class="slider"></span>
          </div>
          <span>{$_('gameControls.showBoard')}</span>
        </div>
      </label>

      <!-- 2. Приховати ферзя -->
      <label class="ios-switch-label" class:disabled={!showBoard}>
        <div class="switch-content-wrapper">
          <div class="ios-switch">
            <input type="checkbox" checked={$settingsStore.hideQueen} onchange={toggleHideQueen} disabled={!showBoard} />
            <span class="slider"></span>
          </div>
          <span>{$_('gameControls.hideQueen')}</span>
        </div>
      </label>

      <!-- 3. Показувати доступні ходи -->
      <label class="ios-switch-label" class:disabled={!showBoard || $settingsStore.hideQueen}>
        <div class="switch-content-wrapper">
          <div class="ios-switch">
            <input type="checkbox" checked={showMoves} onchange={onShowMovesChange} disabled={!showBoard || $settingsStore.hideQueen} />
            <span class="slider"></span>
          </div>
          <span>{$_('gameControls.showMoves')}</span>
        </div>
      </label>

      <!-- 4. Режим заблокованих клітинок -->
      <label class="ios-switch-label">
        <div class="switch-content-wrapper">
          <div class="ios-switch">
            <input type="checkbox" checked={blockModeEnabled} onchange={onBlockModeChange} />
            <span class="slider"></span>
          </div>
          <span>{$_('gameControls.blockMode')}</span>
        </div>
      </label>

      <!-- 5. Озвучування ходів -->
      <label class="ios-switch-label">
        <div class="switch-content-wrapper">
          <div class="ios-switch">
            <input 
              type="checkbox" 
              bind:checked={speechEnabled} 
              onchange={onSpeechChange}
            />
            <span class="slider"></span>
          </div>
          <span>{$_('gameControls.speech')}</span>
        </div>
        <button
          class="settings-icon-btn"
          title={$_('gameControls.voiceSettingsTitle')}
          onclick={(e) => { e.stopPropagation(); openVoiceSettingsModal(); }}
        >
          <SvgIcons name="voice-settings" />
        </button>
      </label>
    </div>
  </details>
  <div class="directions directions-3x3">
    <button class="dir-btn {selectedDirection === 'up-left' ? 'active' : ''}" onclick={() => onDirectionClick('up-left')}>↖</button>
    <button class="dir-btn {selectedDirection === 'up' ? 'active' : ''}" onclick={() => onDirectionClick('up')}>↑</button>
    <button class="dir-btn {selectedDirection === 'up-right' ? 'active' : ''}" onclick={() => onDirectionClick('up-right')}>↗</button>
    <button class="dir-btn {selectedDirection === 'left' ? 'active' : ''}" onclick={() => onDirectionClick('left')}>←</button>
    <button
      id="center-info"
      class="control-btn center-info {centerInfoState.class}"
      type="button"
      aria-label={centerInfoState.aria}
      onclick={centerInfoState.clickable ? onCentralClick : undefined}
      tabindex="0"
      disabled={!centerInfoState.clickable}
    >
      {String(centerInfoState.content)}
    </button>
    <button class="dir-btn {selectedDirection === 'right' ? 'active' : ''}" onclick={() => onDirectionClick('right')}>→</button>
    <button class="dir-btn {selectedDirection === 'down-left' ? 'active' : ''}" onclick={() => onDirectionClick('down-left')}>↙</button>
    <button class="dir-btn {selectedDirection === 'down' ? 'active' : ''}" onclick={() => onDirectionClick('down')}>↓</button>
    <button class="dir-btn {selectedDirection === 'down-right' ? 'active' : ''}" onclick={() => onDirectionClick('down-right')}>↘</button>
  </div>
  <div class="distance-select">
    <div>{$_('gameControls.selectDistance')}</div>
    <div class="distance-btns">
      {#each $availableDistances as dist}
        <button class="dist-btn {selectedDistance === dist ? 'active' : ''}" onclick={() => onDistanceClick(dist)} value={String(dist)} id={String(dist)}>{String(dist)}</button>
      {/each}
    </div>
  </div>
  <div class="action-btns">
    <button class="confirm-btn" onclick={onConfirmMove} disabled={buttonDisabled} title={$_('gameControls.confirm')}>
      <SvgIcons name="confirm" />
      {$_('gameControls.confirm')}
    </button>
    {#if blockModeEnabled}
      <button class="no-moves-btn" onclick={onNoMoves} title={$_('gameControls.noMovesTitle')}>
        <SvgIcons name="no-moves" />
        {$_('gameControls.noMovesTitle')}
      </button>
    {/if}
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
  /* Glassmorphism */
  backdrop-filter: blur(12px);
  box-shadow: 0 8px 32px 0 rgba(80,0,80,0.18);
  border: 1.5px solid rgba(255,255,255,0.18);
}
.toggles {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  margin-bottom: 8px;
}
.ios-switch-label {
  display: flex;
  align-items: center;
  justify-content: space-between; /* <-- КЛЮЧОВА ЗМІНА */
  cursor: pointer;
  font-size: 1.08em;
  margin-bottom: 2px;
  position: relative; /* <-- ДОДАНО */
}
.switch-content-wrapper {
  display: flex;
  align-items: center;
  gap: 12px; /* Переносимо gap сюди */
}
.ios-switch {
  position: relative;
  width: 36px;
  height: 20px;
  display: inline-block;
}
.ios-switch input[type="checkbox"] {
  opacity: 0;
  width: 0;
  height: 0;
}
.ios-switch .slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: #ccc;
  border-radius: 12px;
  transition: background 0.2s;
}
.ios-switch input[type="checkbox"]:checked + .slider {
  background: #ff9800;
}
.ios-switch .slider:before {
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
.ios-switch input[type="checkbox"]:checked + .slider:before {
  transform: translateX(16px);
}
.directions-3x3 {
  display: grid;
  grid-template-columns: repeat(3, 54px);
  grid-template-rows: repeat(3, 54px);
  gap: 14px;
  margin: 18px 0 10px 0;
  justify-content: center;
}
.dir-btn, .central-btn, .dist-btn {
  font-family: 'M PLUS Rounded 1c', sans-serif !important;
  border-radius: 12px;
}
.dir-btn {
  width: 54px;
  height: 54px;
  font-size: 1.7em;
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
  font-size: 1.3em;
  background: rgba(67,160,71,0.13);
  color: #222;
  border: 2.5px solid #43a047;
  border-radius: 12px;
  transition: background 0.2s, box-shadow 0.2s, color 0.2s;
  box-shadow: 0 0 0 0 #43a047;
  z-index: 2;
  backdrop-filter: blur(8px);
  width: 54px;
  height: 54px;
  display: flex;
  align-items: center;
  justify-content: center;
}
/* Універсальний зелений стиль для кнопки підтвердження */
#center-info.confirm-btn-active {
  background: linear-gradient(145deg, #4caf50, #388e3c) !important;
  color: #ffffff !important;
  border: 2px solid #388e3c !important;
  box-shadow: 0 0 16px 4px rgba(76, 175, 80, 0.6), 0 4px 24px 0 rgba(76, 175, 80, 0.3) !important;
  animation: pulse-green 1.5s infinite !important;
  cursor: pointer !important;
}

#center-info.confirm-btn-active:hover {
  background: linear-gradient(145deg, #5cb85c, #449d44) !important;
  border-color: #449d44 !important;
}
/* Стилі для показу ходу комп'ютера */
#center-info.computer-move-display {
  background: linear-gradient(145deg, #ff9800, #f57c00) !important;
  color: #ffffff !important;
  border: 2px solid #f57c00 !important;
  box-shadow: 0 0 16px 4px rgba(255, 152, 0, 0.6), 0 4px 24px 0 rgba(255, 152, 0, 0.3) !important;
  animation: none !important;
  cursor: default !important;
}

/* Стилі для стану вибору напрямку/відстані */
#center-info.direction-distance-state {
  background: rgba(255, 255, 255, 0.13) !important;
  color: #222 !important;
  border: 2.5px solid #43a047 !important;
  box-shadow: 0 0 0 0 #43a047 !important;
  animation: none !important;
  cursor: default !important;
}
@keyframes pulse-green {
  0% { box-shadow: 0 0 0 0 rgba(76, 175, 80, 0.6), 0 4px 24px 0 rgba(76, 175, 80, 0.3); }
  100% { box-shadow: 0 0 24px 8px rgba(76, 175, 80, 0), 0 4px 24px 0 rgba(76, 175, 80, 0.3); }
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
  flex-wrap: wrap;
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
	flex-direction: column; /* ЗАВЖДА стовпчик */
	gap: 14px; /* Оптимальна відстань для стовпчика */
	width: 100%;
	margin-top: 18px;
	align-items: center; /* Центруємо кнопки по горизонталі */
	background: rgba(255, 255, 255, 0.1);
	border-radius: 16px;
	box-shadow: 0 4px 24px 0 rgba(80, 0, 80, 0.1);
	backdrop-filter: blur(8px);
	padding: 14px 10px 10px;
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
	min-width: 0px;
	width: 100%; /* Додано */
	max-width: 280px; /* Додано */
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
.checkbox-label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}
.ios-switch-label {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
}
.settings-icon-btn {
  position: absolute; /* Вириваємо з потоку */
  right: 0; /* Притискаємо до правого краю */
  top: 50%; /* Центруємо по вертикалі */
  transform: translateY(-50%); /* Точне вертикальне центрування */
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  width: 24px;
  height: 24px;
  color: var(--text-primary);
  transition: color 0.2s, transform 0.2s;
}
.settings-icon-btn:hover {
  color: var(--text-accent);
  transform: scale(1.1) rotate(15deg);
}
.settings-expander {
  width: 100%;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  margin-bottom: 8px;
}

.settings-summary {
  padding: 12px 16px;
  font-weight: 600;
  font-size: 1.1em;
  cursor: pointer;
  outline: none;
  list-style: none;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: background 0.2s;
}

.settings-summary::-webkit-details-marker {
  display: none;
}

.settings-summary:hover {
  background: rgba(255, 255, 255, 0.1);
}

.settings-summary::after {
  content: '+';
  font-size: 1.4em;
  font-weight: 300;
  transition: transform 0.2s ease-in-out;
}

.settings-expander[open] > .settings-summary::after {
  transform: rotate(45deg);
}

.settings-expander[open] > .toggles {
  padding: 0 16px 16px 16px;
}
.ios-switch-label.disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}
</style> 