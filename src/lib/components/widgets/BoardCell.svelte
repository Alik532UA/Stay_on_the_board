<script lang="ts">
  import { isCellBlocked, getDamageClass } from "$lib/utils/boardUtils";
  import { createEventDispatcher } from "svelte";
  import type { GameSettingsState } from "$lib/stores/gameSettingsStore";

  export let rowIdx: number;
  export let colIdx: number;
  export let visualCellVisitCounts: Record<string, number>;
  export let gameSettings: GameSettingsState;
  export let isAvailable: boolean;
  export let isPenalty = false;

  const dispatch = createEventDispatcher();

  function onCellRightClick(event: MouseEvent) {
    dispatch("cellRightClick", { event, row: rowIdx, col: colIdx });
  }

  $: blocked = isCellBlocked(
    rowIdx,
    colIdx,
    visualCellVisitCounts,
    gameSettings,
  );
  $: damageClass = getDamageClass(
    rowIdx,
    colIdx,
    visualCellVisitCounts,
    gameSettings,
  );
</script>

<div
  class="board-cell {damageClass}"
  class:light={(rowIdx + colIdx) % 2 === 0}
  class:dark={(rowIdx + colIdx) % 2 !== 0}
  class:blocked-cell={blocked}
  class:available={isAvailable}
  aria-label={`Cell ${rowIdx + 1}, ${colIdx + 1}`}
  on:contextmenu={onCellRightClick}
  role="gridcell"
  data-testid={`board-cell-${rowIdx}-${colIdx}`}
  tabindex="0"
>
  {#if blocked}
    <!-- Хрест рендериться через CSS -->
  {:else}
    <span class="move-dot" class:is-penalty={isPenalty}></span>
  {/if}
</div>

<style>
  .board-cell {
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .move-dot {
    width: 12px;
    height: 12px;
    background-color: #2ecc71 !important; /* Green */
    border-radius: 50%;
    position: absolute;
    top: 50%;
    left: 50%;
    z-index: 2;
    border: var(--global-border-width) solid rgba(0, 0, 0, 0.2);
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.5);
    transition:
      opacity 0.3s ease,
      transform 0.3s ease;
    pointer-events: none; /* Щоб не заважали клікам */
  }

  .available .move-dot {
    opacity: 0.5;
    transform: translate(-50%, -50%) scale(1);
  }

  .move-dot.is-penalty {
    background-color: #e74c3c !important; /* Red */
  }
</style>
