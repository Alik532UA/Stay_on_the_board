<script lang="ts">
  export let row: number;
  export let col: number;
  export let boardSize: number;
  import SvgIcons from '../SvgIcons.svelte';
</script>
<div
  class="player-piece"
  style="top: {row * (100 / boardSize)}%; left: {col * (100 / boardSize)}%; z-index: 10;"
>
  <div class="piece-container">
    <SvgIcons name="queen" />
  </div>
</div>

<style>
.player-piece {
  position: absolute;
  width: calc(100% / var(--board-size, 4));
  height: calc(100% / var(--board-size, 4));
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  pointer-events: none;
  transition: top 0.5s cubic-bezier(0.4,0,0.2,1), left 0.5s cubic-bezier(0.4,0,0.2,1);
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