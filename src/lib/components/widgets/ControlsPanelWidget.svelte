<script lang="ts">
  import { gameState } from '$lib/stores/gameState.js';
  import { playerInputStore } from '$lib/stores/playerInputStore.js';
  import { setDirection, setDistance } from '$lib/stores/gameActions.js';
  import { confirmPlayerMove, claimNoMoves } from '$lib/gameOrchestrator.js';
  import { derived } from 'svelte/store';
  import { _ } from 'svelte-i18n';
  import { settingsStore } from '$lib/stores/settingsStore.js';
  import SvgIcons from '../SvgIcons.svelte';
  import { get } from 'svelte/store';
  import { computerLastMoveDisplayStore } from '$lib/gameOrchestrator.js';
  import { modalStore } from '$lib/stores/modalStore.js';

  $: isPlayerTurn = $gameState.players[$gameState.currentPlayerIndex]?.type === 'human';
  const directionArrows = { 'up-left': '↖', 'up': '↑', 'up-right': '↗', 'left': '←', 'right': '→', 'down-left': '↙', 'down': '↓', 'down-right': '↘' } as const;
  type DirectionKey = keyof typeof directionArrows;

  $: selectedDirection = $playerInputStore.selectedDirection;
  $: selectedDistance = $playerInputStore.selectedDistance;

  const availableDistances = derived(gameState, $gameState => 
    Array.from({ length: $gameState.boardSize - 1 }, (_, i) => i + 1)
  );

  function isDirectionKey(val: any): val is DirectionKey {
    return typeof val === 'string' && val in directionArrows;
  }

  $: centerInfoState = (() => {
    const computerMove = $computerLastMoveDisplayStore;

    if (computerMove) {
      const dir = isDirectionKey(computerMove.direction) ? directionArrows[computerMove.direction] : '';
      const dist = computerMove.distance || '';
      return { class: 'computer-move-display', content: `${dir}${dist}`, clickable: false, aria: `Хід комп'ютера: ${dir}${dist}` };
    }

    if (selectedDirection && selectedDistance) {
      const dir = isDirectionKey(selectedDirection) ? directionArrows[selectedDirection] : '';
      return { class: 'confirm-btn-active', content: `${dir}${selectedDistance}`, clickable: isPlayerTurn, aria: `Підтвердити хід: ${dir}${selectedDistance}` };
    }

    if (selectedDirection) {
      const dir = isDirectionKey(selectedDirection) ? directionArrows[selectedDirection] : '';
      return { class: 'direction-distance-state', content: dir, clickable: false, aria: `Вибрано напрямок: ${dir}` };
    }

    return { class: '', content: '', clickable: false, aria: 'Порожньо' };
  })();

  function onCentralClick() { if (selectedDirection && selectedDistance && isPlayerTurn) confirmPlayerMove(); }
  function onDirectionClick(dir: DirectionKey) { setDirection(dir); }
  function onDistanceClick(dist: number) { setDistance(dist); }
  
  $: buttonDisabled = !selectedDirection || !selectedDistance;

  $: numColumns = ((count) => {
    if (count <= 4) return count;
    if (count === 5 || count === 6) return 3;
    return 4;
  })($availableDistances.length);

  /**
   * Розбиває масив на підмасиви по n елементів
   * @param {any[]} arr
   * @param {number} n
   */
  function chunk(arr: any[], n: number) {
    const res = [];
    for (let i = 0; i < arr.length; i += n) res.push(arr.slice(i, i + n));
    return res;
  }

  $: distanceRows = (() => {
    const dists = $availableDistances;
    if (dists.length <= 4) return [dists];
    if (dists.length === 5 || dists.length === 6) return chunk(dists, 3);
    return chunk(dists, 4);
  })();

  function onConfirmClick() {
    if (buttonDisabled) {
      modalStore.showModal({
        titleKey: 'modal.confirmMoveHintTitle',
        contentKey: 'modal.confirmMoveHintContent',
        buttons: [{ textKey: 'modal.ok', primary: true, isHot: true }]
      });
      return;
    }
    confirmPlayerMove();
  }
</script>

<style>
  .game-controls-panel {
    background: var(--bg-secondary);
    box-shadow: 0 8px 32px 0 var(--shadow-color);
    border-radius: 24px;
    padding: 24px 18px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 18px;
    width: 100%;
    box-sizing: border-box;
    backdrop-filter: blur(12px);
    border: 1.5px solid rgba(255,255,255,0.18);
  }
  .directions-3x3 {
    display: grid;
    grid-template-columns: repeat(3, var(--control-btn-size, 70px));
    grid-template-rows: repeat(3, var(--control-btn-size, 70px));
    gap: 14px;
    margin: 18px 0 10px 0;
    justify-content: center;
  }
  .dir-btn, .dist-btn, .control-btn {
    font-family: 'M PLUS Rounded 1c', sans-serif !important;
    border-radius: 16px;
    border: 1.5px solid var(--border-color);
    background: var(--control-bg);
    color: var(--text-primary);
    cursor: pointer;
    transition: background 0.25s, box-shadow 0.25s, color 0.2s, transform 0.15s, border-color 0.25s;
    box-shadow: 0 2px 16px 0 var(--shadow-color);
    backdrop-filter: blur(6px);
    outline: none;
    position: relative;
    z-index: 1;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .dir-btn, .control-btn {
    width: var(--control-btn-size, 70px);
    height: var(--control-btn-size, 70px);
    font-size: 2em;
  }
  .dist-btn {
    width: 50px;
    height: 50px;
    font-size: 1.5em;
  }
  
  /* --- ВИПРАВЛЕННЯ 1: Активний стан = стан ховеру --- */
  .dir-btn:hover, .dist-btn:hover,
  .dir-btn.active, .dist-btn.active {
    background: var(--control-hover);
    color: var(--control-selected-text);
    border-color: var(--control-selected);
    transform: scale(1.10);
    box-shadow: 0 4px 24px 0 var(--shadow-color);
  }

  /* --- ВИПРАВЛЕННЯ 2: Стилі для центральної кнопки --- */
  #center-info {
    border-style: solid; /* Завжди є обводка, але колір змінюється */
  }
  #center-info:not(.confirm-btn-active):not(.computer-move-display):not(.direction-distance-state) {
    border-color: transparent; /* Робимо обводку прозорою в початковому стані */
    background: transparent;
  }
  #center-info.confirm-btn-active {
    background: var(--confirm-action-bg) !important;
    color: var(--confirm-action-text) !important;
    border-color: var(--confirm-action-bg) !important;
    animation: pulse-green 1.5s infinite !important;
    cursor: pointer !important;
  }
  @keyframes pulse-green {
    0% { box-shadow: 0 0 0 0 color-mix(in srgb, var(--confirm-action-bg) 60%, transparent); }
    100% { box-shadow: 0 0 24px 8px transparent; }
  }
  #center-info.computer-move-display {
    color: #fff !important;
    font-size: 2em !important;
    background: orange !important;
  }

  .distance-select {
    width: 100%;
    text-align: center;
    margin-top: 18px;
  }
  .distance-btns {
    display: flex;
    flex-wrap: wrap;
    gap: 18px;
    justify-content: center;
    margin-top: 10px;
  }
  .action-btns {
    display: flex;
    flex-direction: column;
    gap: 14px;
    width: 100%;
    margin-top: 18px;
    align-items: center;
  }
  .confirm-btn, .no-moves-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.18em;
    font-weight: 700;
    border: none;
    border-radius: 12px;
    min-height: 54px;
    width: 100%;
    max-width: 280px;
    padding: 0 0.5em;
    box-shadow: 0 2px 16px 0 var(--shadow-color);
    transition: all 0.22s;
    cursor: pointer;
  }
  .confirm-btn {
    background: var(--confirm-action-bg);
    color: var(--confirm-action-text);
  }
  .confirm-btn.disabled {
    background: var(--disabled-bg);
    color: var(--disabled-text);
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
    pointer-events: auto;
    opacity: 0.6;
  }
  .no-moves-btn {
    background: var(--warning-action-bg);
    color: var(--warning-action-text);
  }
  .select-direction-label {
    width: 100%;
    text-align: center;
    font-size: 1.13em;
    font-weight: 500;
    margin-bottom: 6px;
    color: var(--text-primary);
  }
</style>

<div class="game-controls-panel">
  <div class="select-direction-label">{$_('gameControls.selectDirectionAndDistance')}</div>
  <div class="directions directions-3x3">
    <button class="dir-btn {selectedDirection === 'up-left' ? 'active' : ''}" on:click={() => onDirectionClick('up-left')} title={`${$_('tooltips.up-left')}
(${$settingsStore.keybindings['up-left'].join(', ')})`}>↖</button>
    <button class="dir-btn {selectedDirection === 'up' ? 'active' : ''}" on:click={() => onDirectionClick('up')} title={`${$_('tooltips.up')}
(${$settingsStore.keybindings['up'].join(', ')})`}>↑</button>
    <button class="dir-btn {selectedDirection === 'up-right' ? 'active' : ''}" on:click={() => onDirectionClick('up-right')} title={`${$_('tooltips.up-right')}
(${$settingsStore.keybindings['up-right'].join(', ')})`}>↗</button>
    <button class="dir-btn {selectedDirection === 'left' ? 'active' : ''}" on:click={() => onDirectionClick('left')} title={`${$_('tooltips.left')}
(${$settingsStore.keybindings['left'].join(', ')})`}>←</button>
    <button id="center-info" class="control-btn center-info {centerInfoState.class}" type="button" aria-label={centerInfoState.aria} on:click={onCentralClick} disabled={!centerInfoState.clickable}>
      {String(centerInfoState.content)}
    </button>
    <button class="dir-btn {selectedDirection === 'right' ? 'active' : ''}" on:click={() => onDirectionClick('right')} title={`${$_('tooltips.right')}
(${$settingsStore.keybindings['right'].join(', ')})`}>→</button>
    <button class="dir-btn {selectedDirection === 'down-left' ? 'active' : ''}" on:click={() => onDirectionClick('down-left')} title={`${$_('tooltips.down-left')}
(${$settingsStore.keybindings['down-left'].join(', ')})`}>↙</button>
    <button class="dir-btn {selectedDirection === 'down' ? 'active' : ''}" on:click={() => onDirectionClick('down')} title={`${$_('tooltips.down')}
(${$settingsStore.keybindings['down'].join(', ')})`}>↓</button>
    <button class="dir-btn {selectedDirection === 'down-right' ? 'active' : ''}" on:click={() => onDirectionClick('down-right')} title={`${$_('tooltips.down-right')}
(${$settingsStore.keybindings['down-right'].join(', ')})`}>↘</button>
  </div>
  <div class="distance-select">
    <div class="distance-btns" style="--num-columns: {numColumns};">
      {#each $availableDistances as dist}
        <button class="dist-btn {selectedDistance === dist ? 'active' : ''}" on:click={() => onDistanceClick(dist)}>{dist}</button>
      {/each}
    </div>
  </div>
  <div class="action-btns">
    <button
      class="confirm-btn{buttonDisabled ? ' disabled' : ''}"
      on:click={onConfirmClick}
      aria-disabled={buttonDisabled}
      title={`${$_('tooltips.confirm')}
(${$settingsStore.keybindings['confirm']})`}
    >
      <SvgIcons name="confirm" />
      {$_('gameControls.confirm')}
    </button>
    {#if $settingsStore.blockModeEnabled}
      <button class="no-moves-btn" on:click={claimNoMoves} title={`${$_('tooltips.no-moves')}
(${$settingsStore.keybindings['no-moves']})`}>
        <SvgIcons name="no-moves" />
        {$_('gameControls.noMovesTitle')}
      </button>
    {/if}
  </div>
</div> 