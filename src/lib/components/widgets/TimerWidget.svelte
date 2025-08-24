<script lang="ts">
  import { gameTime, turnTime } from '$lib/services/timeService.js';
  import { gameModeService } from '$lib/services/gameModeService.js';
  import { onMount } from 'svelte';
  import type { BaseGameMode } from '$lib/gameModes';

  let currentGameMode: BaseGameMode | null = null;
  onMount(() => {
    currentGameMode = gameModeService.getCurrentGameMode();
  });
  function formatTime(seconds: number) {
    return seconds;
  }
</script>

<div class="game-info-widget timer-widget" data-testid="timer-widget">
  {#if currentGameMode}
    {#if currentGameMode.gameDuration > 0}
      <div class="info-item">
        <span class="label">Час гри:</span>
        <span class="value">{formatTime($gameTime)}</span>
      </div>
    {/if}
    {#if currentGameMode.turnDuration > 0}
      <div class="info-item">
        <span class="label">Час ходу:</span>
        <span class="value">{formatTime($turnTime)}</span>
      </div>
    {/if}
  {/if}
</div>

<style>
  .timer-widget {
    padding: 12px 15px; /* Adjusted padding */
    border-radius: var(--unified-border-radius);
    background: var(--bg-secondary);
    color: var(--text-primary);
    display: flex;
    flex-direction: column;
    gap: 8px;
    font-size: 1em; /* Adjusted font size */
    box-shadow: var(--dynamic-widget-shadow) var(--current-player-shadow-color);
    backdrop-filter: var(--unified-backdrop-filter);
    border: var(--unified-border);
    min-height: 50px;
    justify-content: center;
  }
  .info-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
  }
  .label {
    font-weight: 500;
    color: var(--text-secondary);
    white-space: nowrap;
  }
  .value {
    font-family: 'M PLUS Rounded 1c', sans-serif;
    font-size: 1.2rem;
    color: var(--text-accent);
    font-weight: 700;
    background: rgba(0,0,0,0.1);
    padding: 2px 8px;
    border-radius: 6px;
  }
</style>