<script lang="ts">
  import { gameTime, turnTime } from '$lib/services/timeService';
  import { gameModeService } from '$lib/services/gameModeService';
  import { readable } from 'svelte/store';

  const currentGameMode = readable(gameModeService.getCurrentGameMode(), set => {
    // This is a simple way to create a readable store that doesn't need to update.
    // For a more reactive approach, gameModeService would need to become a writable store
    // or expose an event emitter to notify of changes.
    return () => {};
  });

  function formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
</script>

<div class="timer-widget">
  {#if $currentGameMode?.gameDuration > 0}
    <div class="game-timer">
      <span>Game Time:</span>
      <span>{formatTime($gameTime)}</span>
    </div>
  {/if}
  {#if $currentGameMode?.turnDuration > 0}
    <div class="turn-timer">
      <span>Turn Time:</span>
      <span>{formatTime($turnTime)}</span>
    </div>
  {/if}
</div>

<style>
  .timer-widget {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 1rem;
    background-color: #f0f0f0;
    border-radius: 8px;
  }
  .game-timer, .turn-timer {
    font-size: 1.2rem;
    margin: 0.5rem 0;
  }
</style>