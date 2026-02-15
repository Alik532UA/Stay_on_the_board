<script lang="ts">
  export let boardSize: number;
</script>

<div class="static-grid" style="--board-size: {boardSize}">
  {#each Array(boardSize) as _, rowIdx}
    {#each Array(boardSize) as _, colIdx}
      <div
        class="board-cell"
        class:light={(rowIdx + colIdx) % 2 === 0}
        class:dark={(rowIdx + colIdx) % 2 !== 0}
        data-testid="board-cell-{rowIdx}-{colIdx}"
      ></div>
    {/each}
  {/each}
</div>

<style>
  .static-grid {
    display: grid;
    grid-template-columns: repeat(var(--board-size), 1fr);
    grid-template-rows: repeat(var(--board-size), 1fr);
    width: 100%;
    height: 100%;
    position: absolute;
    top: 0;
    left: 0;
    z-index: 1;
    pointer-events: none;
  }
</style>
