<script lang="ts">
  import { writable, type Writable, get } from 'svelte/store';
  import SvgIcons from './SvgIcons.svelte';
  import ReplayControls from './ReplayControls.svelte';
  import { replayPosition as calculateReplayPosition, replayCellVisitCounts as calculateReplayCellVisitCounts, replaySegments as calculateReplaySegments } from '$lib/utils/replay.js';

  export let moveHistory: any[];
  export let boardSize: number;

  interface ReplayState {
    isReplayMode: boolean;
    moveHistory: any[];
    boardSize: number;
    replayCurrentStep: number;
    autoPlayDirection: 'paused' | 'forward' | 'backward';
    limitReplayPath: boolean;
  }

  const replayState: Writable<ReplayState> = writable({
    isReplayMode: true,
    moveHistory,
    boardSize,
    replayCurrentStep: 0,
    autoPlayDirection: 'paused',
    limitReplayPath: true,
  });

  // derived stores (НЕ викликаємо як функції)
  const replayPosition = calculateReplayPosition(replayState);
  const replayCellVisitCounts = calculateReplayCellVisitCounts(replayState);
  const replaySegments = calculateReplaySegments(replayState);

  function goToStep(step: number) {
    replayState.update(s => ({ ...s, replayCurrentStep: Math.max(0, Math.min(step, s.moveHistory.length - 1)) }));
  }

  let autoPlayInterval: ReturnType<typeof setInterval> | null = null;

  function toggleAutoPlay(direction: 'forward' | 'backward') {
    if (autoPlayInterval) clearInterval(autoPlayInterval);
    const currentDirection = get(replayState).autoPlayDirection;
    if (currentDirection === direction) {
      replayState.update(s => ({ ...s, autoPlayDirection: 'paused' }));
      return;
    }
    replayState.update(s => ({ ...s, autoPlayDirection: direction }));
    autoPlayInterval = setInterval(() => {
      const s = get(replayState);
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
            class="board-cell"
            class:light={(rowIdx + colIdx) % 2 === 0}
            class:dark={(rowIdx + colIdx) % 2 !== 0}
          ></div>
        {/each}
      {/each}

      <svg class="replay-path-svg" viewBox="0 0 100 100" overflow="visible">
        {#each $replaySegments as segment, i (i)}
          <line x1={segment.x1} y1={segment.y1} x2={segment.x2} y2={segment.y2} stroke={segment.color} stroke-opacity={segment.opacity}/>
        {/each}
      </svg>

      {#if $replayPosition}
        <div class="player-piece" style="top: {$replayPosition.row * (100 / boardSize)}%; left: {$replayPosition.col * (100 / boardSize)}%; z-index: 10;">
          <div class="piece-container"><SvgIcons name="queen" /></div>
        </div>
      {/if}
    </div>
  </div>

  <ReplayControls 
    limitReplayPath={$replayState.limitReplayPath}
    on:toggleLimitPath={toggleLimitPath}
    on:goToStep={(e) => goToStep(e.detail)}
    on:toggleAutoPlay={(e) => toggleAutoPlay(e.detail)}
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
</style> 