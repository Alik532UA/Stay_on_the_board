<script>
  import { gameState } from '$lib/stores/gameState';
  import { localGameStore } from '$lib/stores/localGameStore';

  $: players = $localGameStore.players;
  $: currentPlayerIndex = $gameState.currentPlayerIndex;
</script>

<style>
  .indicator-wrapper {
    display: flex;
    gap: 12px;
    padding: 0 16px;
    margin-bottom: 4px;
  }

  .player-bar {
    flex-grow: 1;
    height: 16px;
    border-radius: 16px;
    transition: opacity 0.3s ease-in-out;
  }
</style>

<div class="indicator-wrapper">
  {#each players as player, i}
    <div 
      class="player-bar"
      style="background-color: {player.color}; opacity: {i === currentPlayerIndex ? 1 : 0.2};"
      title="{player.name}"
    ></div>
  {/each}
</div>