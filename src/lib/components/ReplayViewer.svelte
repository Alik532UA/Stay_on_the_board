<script lang="ts">
  import { writable, derived } from 'svelte/store';
  import SvgIcons from './SvgIcons.svelte';
  import ReplayControls from './ReplayControls.svelte';
  import { 
    replayPosition as calculateReplayPosition, 
    replayCellVisitCounts as calculateReplayCellVisitCounts, 
    replaySegments as calculateReplaySegments 
  } from '$lib/utils/replay.js';
  import { settingsStore } from '$lib/stores/settingsStore.js';
  import { isCellBlocked, getDamageClass } from '$lib/utils/boardUtils.js';
  import { get } from 'svelte/store';
  import { onMount } from 'svelte';

  let { moveHistory, boardSize, autoPlayForward = false } = $props<{ moveHistory: any[]; boardSize: number; autoPlayForward?: boolean }>();

  onMount(() => {
    if (autoPlayForward) {
      setTimeout(() => toggleAutoPlay('forward'), 1000);
    }
  });

  const replayState = writable({
    isReplayMode: true,
    moveHistory,
    boardSize,
    replayCurrentStep: 0,
    autoPlayDirection: 'paused' as 'paused' | 'forward' | 'backward',
    limitReplayPath: true,
  });

  const replayPosition = calculateReplayPosition(replayState);
  const replayCellVisitCounts = calculateReplayCellVisitCounts(replayState);
  const replaySegments = calculateReplaySegments(replayState);

  function goToStep(step: number) {
    replayState.update(s => ({ ...s, replayCurrentStep: Math.max(0, Math.min(step, s.moveHistory.length - 1)) }));
  }

  let autoPlayInterval: ReturnType<typeof setInterval> | null = null;

  function toggleAutoPlay(direction: 'forward' | 'backward') {
    if (autoPlayInterval) clearInterval(autoPlayInterval);
    const currentDirection = $replayState.autoPlayDirection;
    const s = $replayState;
    // Якщо play вперед і вже на останньому кроці — почати з початку
    if (direction === 'forward' && s.replayCurrentStep >= s.moveHistory.length - 1) {
      goToStep(0);
    }
    if (currentDirection === direction) {
      replayState.update(s => ({ ...s, autoPlayDirection: 'paused' }));
      return;
    }
    replayState.update(s => ({ ...s, autoPlayDirection: direction }));
    autoPlayInterval = setInterval(() => {
      const s = $replayState;
      const nextStep = s.replayCurrentStep + (direction === 'forward' ? 1 : -1);
      if (nextStep >= 0 && nextStep < s.moveHistory.length) {
        goToStep(nextStep);
      } else {
        if (autoPlayInterval) clearInterval(autoPlayInterval);
        replayState.update(st => ({ ...st, autoPlayDirection: 'paused' }));
      }
    }, 1000);
  }

  function toggleLimitPath() {
    replayState.update(s => ({ ...s, limitReplayPath: !s.limitReplayPath }));
  }
</script>

<div class="replay-viewer">
  <div class="board-bg-wrapper game-content-block" style="--board-size: {boardSize}">
    <div class="game-board" style="--board-size: {boardSize}">
      {#each Array(boardSize) as _, rowIdx}
        {#each Array(boardSize) as _, colIdx}
          <div
            class="board-cell {getDamageClass(rowIdx, colIdx, $replayCellVisitCounts, $settingsStore)}"
            class:light={(rowIdx + colIdx) % 2 === 0}
            class:dark={(rowIdx + colIdx) % 2 !== 0}
            class:blocked-cell={isCellBlocked(rowIdx, colIdx, $replayCellVisitCounts, $settingsStore)}
          >
            {#if isCellBlocked(rowIdx, colIdx, $replayCellVisitCounts, $settingsStore)}
              <!-- Хрест тепер рендериться через CSS, як і в основній грі -->
            {/if}
          </div>
        {/each}
      {/each}

      <svg class="replay-path-svg" viewBox="0 0 100 100">
        {#each $replaySegments as segment, i (i)}
          <line x1={segment.x1} y1={segment.y1} x2={segment.x2} y2={segment.y2} stroke={segment.color} stroke-opacity={segment.opacity}/>
        {/each}
      </svg>

      {#if $replayPosition}
        <div 
          class="player-piece"
          style="top: {$replayPosition.row * (100 / boardSize)}%; left: {$replayPosition.col * (100 / boardSize)}%; z-index: 10;">
          <div class="piece-container"><SvgIcons name="queen" /></div>
        </div>
      {/if}
    </div>
  </div>

  <ReplayControls 
    limitReplayPath={$replayState.limitReplayPath}
    on:toggleLimitPath={toggleLimitPath}
    on:goToStep={(e) => goToStep(e.detail)}
    on:toggleAutoPlay={(e) => toggleAutoPlay(e.detail as 'forward' | 'backward')}
    currentStep={$replayState.replayCurrentStep}
    totalSteps={moveHistory.length}
    autoPlayDirection={$replayState.autoPlayDirection}
  />
</div>

<style>
  .replay-viewer {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.5rem;
    width: 100%;
    max-width: 500px;
  }

  .board-bg-wrapper {
    overflow: visible;
  }

  .player-piece {
    position: absolute;
    width: calc(100% / var(--board-size, 4));
    height: calc(100% / var(--board-size, 4));
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10;
    pointer-events: none;
    transition: top 0.4s cubic-bezier(0.4, 0, 0.2, 1), left 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .piece-container {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    animation: crown-pop 0.5s ease-out forwards;
  }

  @keyframes crown-pop {
    0% { transform: scale(0.5) rotate(-20deg); opacity: 0; }
    60% { transform: scale(1.2) rotate(8deg); opacity: 1; }
    100% { transform: scale(1) rotate(0); opacity: 1; }
  }
</style> 