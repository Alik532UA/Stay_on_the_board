<script>
  import { appState, goToReplayStep, toggleAutoPlay, stopReplay, toggleLimitReplayPath } from '$lib/stores/gameStore.js';
  import { _ } from 'svelte-i18n';
</script>

<div class="replay-controls">
  <button class="control-btn" onclick={stopReplay}>×</button>
  <button class="control-btn" onclick={() => goToReplayStep($appState.replayCurrentStep - 1)} disabled={$appState.replayCurrentStep === 0}>«</button>
  <button class="control-btn play-pause" onclick={toggleAutoPlay}>
    {#if $appState.isAutoPlaying}❚❚{:else}▶{/if}
  </button>
  <button class="control-btn" onclick={() => goToReplayStep($appState.replayCurrentStep + 1)} disabled={$appState.replayCurrentStep >= $appState.moveHistory.length - 1}>»</button>
  <div class="step-counter">
    {$_('replay.step', { values: { current: $appState.replayCurrentStep + 1, total: $appState.moveHistory.length } })}
  </div>
  <label class="limit-path-toggle">
    <input type="checkbox" bind:checked={$appState.limitReplayPath} onchange={toggleLimitReplayPath} />
    <span>{$_('replay.limitPath')}</span>
  </label>
</div>

<style>
  .replay-controls {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    background: var(--bg-secondary);
    padding: 12px;
    border-radius: 16px;
    box-shadow: var(--unified-shadow);
    margin-top: 16px;
  }
  .control-btn {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    border: none;
    background: var(--control-bg);
    color: var(--text-primary);
    font-size: 1.5em;
    cursor: pointer;
    transition: background 0.2s, transform 0.2s;
  }
  .control-btn:hover:not(:disabled) {
    background: var(--control-hover);
    color: #fff;
  }
  .control-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
  .play-pause {
    background: var(--confirm-btn-bg);
    color: #fff;
  }
  .step-counter {
    font-weight: bold;
    min-width: 80px;
    text-align: center;
  }
  .limit-path-toggle {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.8em;
    cursor: pointer;
    color: var(--text-secondary);
    white-space: nowrap;
  }
  .limit-path-toggle input {
    accent-color: var(--text-accent, #ff9800);
  }
</style> 