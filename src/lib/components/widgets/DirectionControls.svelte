<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import SvgIcons from '../SvgIcons.svelte';
  import { _ } from 'svelte-i18n';
  import { getCenterInfoState } from '$lib/utils/centerInfoUtil';
  import { logService } from '$lib/services/logService.js';
  import { hotkeyTooltip } from '$lib/actions/hotkeyTooltip.js';
  import { customTooltip } from '$lib/actions/customTooltip.js';

  export let selectedDirection: string | null = null;
  export let selectedDistance: number | null = null;
  export const availableDirections: string[] = [
    'up-left', 'up', 'up-right',
    'left', null, 'right',
    'down-left', 'down', 'down-right'
  ];
  export let distanceRows: number[][] = [];
  export const isPlayerTurn: boolean = false;
  export const isMoveInProgress: boolean = false;
  export let blockModeEnabled: boolean = false;
  export let confirmButtonBlocked: boolean = false;
  export let centerInfoProps: any = {};

  const dispatch = createEventDispatcher();

  /**
   * @param {number} dist
   * @returns {import('$lib/stores/settingsStore').KeybindingAction}
   */
  function getActionForDistance(dist: number) {
    return `distance-${dist}` as import('$lib/stores/settingsStore').KeybindingAction;
  }
 
  function handleDirection(dir: string) {
    logService.action(`Click: "Напрямок: ${dir}" (DirectionControls)`);
    dispatch('direction', dir);
  }
  function handleDistance(dist: number) {
    logService.action(`Click: "Відстань: ${dist}" (DirectionControls)`);
    dispatch('distance', dist);
  }
  function handleCentral() {
    logService.action('Click: "Центральна кнопка" (DirectionControls)');
    dispatch('central');
  }
  function handleConfirm() {
    logService.action('Click: "Підтвердити хід" (DirectionControls)');
    dispatch('confirm');
  }
  function handleNoMoves() {
    logService.action('Click: "Ходів немає" (DirectionControls)');
    dispatch('noMoves');
  }
</script>

<div class="direction-controls-panel">
  <div class="directions-3x3">
    <button class="dir-btn {selectedDirection === 'up-left' ? 'active' : ''}" use:hotkeyTooltip={'up-left'} on:click={() => handleDirection('up-left')} data-testid="dir-btn-up-left">↖</button>
    <button class="dir-btn {selectedDirection === 'up' ? 'active' : ''}" use:hotkeyTooltip={'up'} on:click={() => handleDirection('up')} data-testid="dir-btn-up">↑</button>
    <button class="dir-btn {selectedDirection === 'up-right' ? 'active' : ''}" use:hotkeyTooltip={'up-right'} on:click={() => handleDirection('up-right')} data-testid="dir-btn-up-right">↗</button>
    <button class="dir-btn {selectedDirection === 'left' ? 'active' : ''}" use:hotkeyTooltip={'left'} on:click={() => handleDirection('left')} data-testid="dir-btn-left">←</button>
    <button id="center-info"
      class="control-btn center-info {centerInfoProps.class}"
      type="button"
      aria-label={centerInfoProps.aria}
      on:click={centerInfoProps.clickable ? handleCentral : undefined}
      tabindex="0"
      disabled={!centerInfoProps.clickable}
      style={centerInfoProps.backgroundColor ? `background-color: ${centerInfoProps.backgroundColor} !important` : ''}
      data-testid="center-info-btn"
    >
      {centerInfoProps.content}
    </button>
    <button class="dir-btn {selectedDirection === 'right' ? 'active' : ''}" use:hotkeyTooltip={'right'} on:click={() => handleDirection('right')} data-testid="dir-btn-right">→</button>
    <button class="dir-btn {selectedDirection === 'down-left' ? 'active' : ''}" use:hotkeyTooltip={'down-left'} on:click={() => handleDirection('down-left')} data-testid="dir-btn-down-left">↙</button>
    <button class="dir-btn {selectedDirection === 'down' ? 'active' : ''}" use:hotkeyTooltip={'down'} on:click={() => handleDirection('down')} data-testid="dir-btn-down">↓</button>
    <button class="dir-btn {selectedDirection === 'down-right' ? 'active' : ''}" use:hotkeyTooltip={'down-right'} on:click={() => handleDirection('down-right')} data-testid="dir-btn-down-right">↘</button>
  </div>
  <div class="distance-select">
    <div class="distance-btns">
      {#each distanceRows as row}
        <div class="distance-row">
          {#each row as dist}
            <button class="dist-btn {selectedDistance === dist ? 'active' : ''}" use:hotkeyTooltip={getActionForDistance(dist)} on:click={() => handleDistance(dist)} data-testid={`dist-btn-${dist}`}>{dist}</button>
          {/each}
        </div>
      {/each}
    </div>
  </div>
  <div class="action-btns">
    <button class="confirm-btn {confirmButtonBlocked ? 'disabled' : ''}" use:hotkeyTooltip={'confirm'} on:click={handleConfirm} use:customTooltip={$_('gameControls.confirm')} data-testid="confirm-move-btn">
      <SvgIcons name="confirm" />
      {$_('gameControls.confirm')}
    </button>
    {#if blockModeEnabled}
      <button class="no-moves-btn" use:hotkeyTooltip={'no-moves'} on:click={handleNoMoves} use:customTooltip={$_('gameControls.noMovesTitle')} data-testid="no-moves-btn">
        <SvgIcons name="no-moves" />
        {$_('gameControls.noMovesTitle')}
      </button>
    {/if}
  </div>
</div>

<style>
.direction-controls-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 18px;
  width: 100%;
}
.directions-3x3 {
  display: grid;
  grid-template-columns: repeat(3, 70px);
  grid-template-rows: repeat(3, 70px);
  gap: 14px;
  margin: 18px 0 10px 0;
  justify-content: center;
}
.dir-btn, .dist-btn, .control-btn {
  border-radius: 16px;
  border: 1.5px solid var(--border-color, #444);
  background: var(--control-bg, #222);
  color: var(--text-primary, #fff);
  cursor: pointer;
  transition: background 0.25s, box-shadow 0.25s, color 0.2s, transform 0.15s, border-color 0.25s;
  box-shadow: 0 2px 16px 0 var(--shadow-color, #0002);
  backdrop-filter: blur(6px);
  outline: none;
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2em;
  width: 70px;
  height: 70px;
  font-family: 'M PLUS Rounded 1c', sans-serif !important;
}
.dir-btn.active {
  background: var(--control-hover, #ff9800);
  color: var(--control-selected-text, #fff);
  border-color: var(--control-selected, #ff9800);
  transform: scale(1.10);
  box-shadow: 0 4px 24px 0 var(--shadow-color, #0004);
}
.control-btn.center-info.confirm-btn-active {
  background: #43a047 !important;
  color: #fff !important;
}
#center-info {
  border: none !important;
  font-family: 'M PLUS Rounded 1c', sans-serif !important;
}
#center-info:not(.confirm-btn-active):not(.computer-move-display):not(.direction-distance-state) {
  background: transparent !important;
}
#center-info.confirm-btn-active {
  background: #43a047 !important;
  color: #fff !important;
  border-color: #43a047 !important;
  animation: pulse-green 1.5s infinite !important;
  cursor: pointer !important;
}
@keyframes pulse-green {
  0% { box-shadow: 0 0 0 0 #43a047; }
  70% { box-shadow: 0 0 0 10px rgba(67,160,71,0.2); }
  100% { box-shadow: 0 0 0 0 #43a047; }
}
#center-info.confirm-btn-active:hover {
  background: #2e7d32 !important;
  border-color: #2e7d32 !important;
  transform: scale(1.02);
}
#center-info.computer-move-display {
  background: orange !important;
  color: #fff !important;
  font-weight: bold !important;
  border: none !important;
  cursor: default !important;
}
.distance-select {
  width: 100%;
  text-align: center;
  margin-top: 18px;
}
.distance-btns {
  display: flex;
  flex-direction: column;
  gap: 10px;
  justify-content: center;
  margin-top: 10px;
}
.distance-row {
  display: flex;
  gap: 18px;
  justify-content: center;
}
.dist-btn {
  width: 50px;
  height: 50px;
  font-size: 1.5em;
  border-radius: 16px;
  border: 1.5px solid var(--border-color, #444);
  background: var(--control-bg, #222);
  color: var(--text-primary, #fff);
  cursor: pointer;
  transition: background 0.25s, color 0.2s, transform 0.15s;
}
.dist-btn.active {
  background: var(--control-hover, #ff9800);
  color: var(--control-selected-text, #fff);
  border-color: var(--control-selected, #ff9800);
  transform: scale(1.10);
}
.action-btns {
  display: flex;
  flex-direction: column;
  gap: 14px;
  width: 100%;
  align-items: center;
  margin-top: 18px;
}
.confirm-btn, .no-moves-btn {
  background: #43a047cc;
  color: #fff;
  border: none;
  border-radius: 12px;
  min-height: 52px; /* Збільшена висота */
  width: 90%; /* Змінено на 90% */
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: background 0.25s, transform 0.15s;
}
.confirm-btn.disabled {
  background: rgba(85, 85, 85, 0.3);
  color: #999;
  cursor: pointer;
}
.confirm-btn:not(.disabled):hover {
  background: #2e7d32;
  transform: scale(1.02);
}
.no-moves-btn {
  background: #ffb300;
  color: #222;
}
.no-moves-btn:hover {
  background: #f57c00;
  transform: scale(1.02);
}
</style> 