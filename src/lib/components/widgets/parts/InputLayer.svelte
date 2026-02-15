<script lang="ts">
  import { createEventDispatcher } from "svelte";

  export let boardSize: number;

  const dispatch = createEventDispatcher();

  function onCellRightClick(event: MouseEvent, row: number, col: number) {
    dispatch("cellRightClick", { event, row, col });
  }
</script>

<div class="input-layer" style="--board-size: {boardSize}">
  {#each Array(boardSize) as _, rowIdx}
    {#each Array(boardSize) as _, colIdx}
      <div 
        class="input-cell" 
        on:contextmenu|preventDefault={(e) => onCellRightClick(e, rowIdx, colIdx)}
        role="gridcell"
        aria-label="Cell {rowIdx + 1}, {colIdx + 1}"
        tabindex="-1"
      ></div>
    {/each}
  {/each}
</div>

<style>
  .input-layer {
    display: grid;
    grid-template-columns: repeat(var(--board-size), 1fr);
    grid-template-rows: repeat(var(--board-size), 1fr);
    width: 100%;
    height: 100%;
    position: absolute;
    top: 0;
    left: 0;
    z-index: 5;
  }

  .input-cell {
    width: 100%;
    height: 100%;
    cursor: pointer;
  }
</style>
