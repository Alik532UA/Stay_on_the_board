<script lang="ts">
  import { playerStore } from '$lib/stores/playerStore';
  import { customTooltip } from '$lib/actions/customTooltip.js';

  $: players = $playerStore?.players;
  $: currentPlayerIndex = $playerStore?.currentPlayerIndex;
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

{#if players}
<div class="indicator-wrapper">
  {#each players as player, i}
    <div 
      class="player-bar"
      style="background-color: {player.color}; opacity: {i === currentPlayerIndex ? 1 : 0.2};"
      use:customTooltip={player.name}
    ></div>
  {/each}
</div>
{/if}
