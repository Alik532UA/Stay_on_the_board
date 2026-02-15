<script lang="ts">
  import type { MoveDirectionType } from "$lib/models/Piece";

  export let boardSize: number;
  export let availableMoves: Array<{ row: number; col: number; isPenalty: boolean }>;
  export let showMoves: boolean;

  $: movesMap = showMoves 
    ? availableMoves.reduce((acc, move) => {
        acc[`${move.row}-${move.col}`] = move;
        return acc;
      }, {} as Record<string, { isPenalty: boolean }>)
    : {};
</script>

<div class="interaction-layer" style="--board-size: {boardSize}">
  {#each Array(boardSize) as _, rowIdx}
    {#each Array(boardSize) as _, colIdx}
      {@const move = movesMap[`${rowIdx}-${colIdx}`]}
      <div class="cell-interaction">
        {#if move}
          <span class="move-dot" class:is-penalty={move.isPenalty}></span>
        {/if}
      </div>
    {/each}
  {/each}
</div>

<style>
  .interaction-layer {
    display: grid;
    grid-template-columns: repeat(var(--board-size), 1fr);
    grid-template-rows: repeat(var(--board-size), 1fr);
    width: 100%;
    height: 100%;
    position: absolute;
    top: 0;
    left: 0;
    z-index: 3;
    pointer-events: none;
  }

  .cell-interaction {
    display: flex;
    justify-content: center;
    align-items: center;
    position: relative;
  }

  .move-dot {
    width: 12px;
    height: 12px;
    background-color: #2ecc71 !important; /* Green */
    border-radius: 50%;
    border: var(--global-border-width) solid rgba(0, 0, 0, 0.2);
    opacity: 0.5;
    transform: scale(1);
    transition: opacity 0.3s ease, transform 0.3s ease;
  }

  .move-dot.is-penalty {
    background-color: #e74c3c !important; /* Red */
  }
</style>
