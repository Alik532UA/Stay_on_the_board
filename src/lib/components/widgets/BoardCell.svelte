<script lang="ts">
  export let rowIdx: number;
  export let colIdx: number;
  export let visualCellVisitCounts: Record<string, number>;
  export let settingsStore: any;
  export let isAvailable: boolean;
  export const visualPosition: { row: number|null, col: number|null } = { row: null, col: null };
  export const boardState: any = {};
  export const gameState: any = {};
  import { isCellBlocked, getDamageClass } from '$lib/utils/boardUtils.ts';
  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher();
  function onCellRightClick(event: MouseEvent) {
    dispatch('cellRightClick', { event, row: rowIdx, col: colIdx });
  }
  $: blocked = isCellBlocked(rowIdx, colIdx, visualCellVisitCounts, settingsStore);
  $: damageClass = getDamageClass(rowIdx, colIdx, visualCellVisitCounts, settingsStore);
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
  tabindex="0"
>
  {#if blocked}
    <!-- Хрест рендериться через CSS -->
  {:else}
    <span class="move-dot"></span>
  {/if}
</div> 