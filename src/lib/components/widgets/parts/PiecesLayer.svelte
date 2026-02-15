<script lang="ts">
  import PlayerPiece from "../PlayerPiece.svelte";

  export let row: number | null;
  export let col: number | null;
  export let boardSize: number;
  export let showPiece: boolean;
</script>

<div class="pieces-layer" style="--board-size: {boardSize}">
  {#if showPiece && row !== null && col !== null}
    <PlayerPiece
      {row}
      {col}
      {boardSize}
    />
  {/if}
</div>

<style>
  .pieces-layer {
    width: 100%;
    height: 100%;
    position: absolute;
    top: 0;
    left: 0;
    z-index: 4;
    pointer-events: none;
  }
</style>
