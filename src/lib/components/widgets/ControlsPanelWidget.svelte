<script lang="ts">
  import { gameState } from '$lib/stores/gameState.js';
  import { playerInputStore } from '$lib/stores/playerInputStore.js';
  import { setDirection, setDistance } from '$lib/services/gameLogicService.js';
  import { gameOrchestrator } from '$lib/gameOrchestrator.js';
  import { _ } from 'svelte-i18n';
  import { settingsStore } from '$lib/stores/settingsStore.js';
  import SvgIcons from '../SvgIcons.svelte';
  import { get } from 'svelte/store';
  import { centerInfo, isConfirmButtonDisabled, availableDistances, distanceRows } from '$lib/stores/derivedState.js';
  import { modalStore } from '$lib/stores/modalStore.js';

  $: isPlayerTurn = $gameState.players[$gameState.currentPlayerIndex]?.type === 'human';

  $: selectedDirection = $playerInputStore.selectedDirection;
  $: selectedDistance = $playerInputStore.selectedDistance;

  function onCentralClick() { if (selectedDirection && selectedDistance && isPlayerTurn) gameOrchestrator.confirmPlayerMove(); }
  function onDirectionClick(dir: any) { setDirection(dir); }
  function onDistanceClick(dist: number) { setDistance(dist); }
  
  function onConfirmClick() {
    if ($isConfirmButtonDisabled) {
      modalStore.showModal({
        titleKey: 'modal.confirmMoveHintTitle',
        contentKey: 'modal.confirmMoveHintContent',
        buttons: [{ textKey: 'modal.ok', primary: true, isHot: true }]
      });
      return;
    }
    gameOrchestrator.confirmPlayerMove();
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
    flex-direction: column;
    gap: 18px;
    justify-content: center;
    margin-top: 10px;
  }
  .distance-row {
    display: flex;
    gap: 18px;
    justify-content: center;
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
    <button
      id="center-info"
      class="control-btn center-info {$centerInfo.class}"
      type="button"
      aria-label={$centerInfo.aria}
      on:click={$centerInfo.clickable ? onCentralClick : undefined}
      tabindex="0"
      disabled={!$centerInfo.clickable}
    >
      {String($centerInfo.content)}
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
    <div class="distance-btns">
      {#each $distanceRows as distRow}
        <div class="distance-row">
          {#each distRow as dist}
            <button class="dist-btn {selectedDistance === dist ? 'active' : ''}" on:click={() => onDistanceClick(dist)}>{dist}</button>
          {/each}
        </div>
      {/each}
    </div>
  </div>
  <div class="action-btns">
    <button
      class="confirm-btn{$isConfirmButtonDisabled ? ' disabled' : ''}"
      on:click={onConfirmClick}
      aria-disabled={$isConfirmButtonDisabled}
      title={`${$_('tooltips.confirm')}
(${$settingsStore.keybindings['confirm']})`}
    >
      <SvgIcons name="confirm" />
      {$_('gameControls.confirm')}
    </button>
    {#if $settingsStore.blockModeEnabled}
      <button class="no-moves-btn" on:click={gameOrchestrator.claimNoMoves} title={`${$_('tooltips.no-moves')}
(${$settingsStore.keybindings['no-moves']})`}>
        <SvgIcons name="no-moves" />
        {$_('gameControls.noMovesTitle')}
      </button>
    {/if}
  </div>
</div> 