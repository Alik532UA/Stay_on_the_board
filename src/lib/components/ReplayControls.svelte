<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { _ } from 'svelte-i18n';

  export let limitReplayPath: boolean;
  export let currentStep: number;
  export let totalSteps: number;
  export let autoPlayDirection: 'paused' | 'forward' | 'backward';

  const dispatch = createEventDispatcher();
</script>

<div class="replay-ui-container">
  <label class="limit-path-toggle">
    <input 
      type="checkbox" 
      bind:checked={limitReplayPath} 
      on:change={() => dispatch('toggleLimitPath')} 
    />
    <span>{$_('replay.limitPath')}</span>
  </label>

  <div class="replay-controls">
    <button class="control-btn" on:click={() => dispatch('goToStep', currentStep - 1)} disabled={currentStep === 0} title={$_('replay.prev')}>«</button>
    <button class="control-btn play-pause" class:active={autoPlayDirection === 'backward'} on:click={() => dispatch('toggleAutoPlay', 'backward')} title={autoPlayDirection === 'backward' ? $_('replay.pause') : $_('replay.playBackward')}>
      {#if autoPlayDirection === 'backward'}❚❚{:else}◀{/if}
    </button>
    <button class="control-btn play-pause" class:active={autoPlayDirection === 'forward'} on:click={() => dispatch('toggleAutoPlay', 'forward')} title={autoPlayDirection === 'forward' ? $_('replay.pause') : $_('replay.play')}>
      {#if autoPlayDirection === 'forward'}❚❚{:else}▶{/if}
    </button>
    <button class="control-btn" on:click={() => dispatch('goToStep', currentStep + 1)} disabled={currentStep >= totalSteps - 1} title={$_('replay.next')}>»</button>
    <div class="step-counter">
      {$_('replay.step', { values: { current: currentStep + 1, total: totalSteps } })}
    </div>
  </div>
</div>

<style>
.replay-ui-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  margin-top: 16px;
}

.limit-path-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9em;
  cursor: pointer;
  color: var(--text-secondary);
  padding: 6px 12px;
  border-radius: 8px;
  background: rgba(0,0,0,0.1);
  transition: background 0.2s;
}
.limit-path-toggle:hover {
  background: rgba(0,0,0,0.2);
}
.limit-path-toggle input {
  accent-color: var(--text-accent, #ff9800);
}

.replay-controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  background: var(--bg-secondary);
  padding: 12px;
  border-radius: 16px;
  box-shadow: var(--unified-shadow);
  width: 100%;
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
  background: var(--control-bg);
  color: var(--text-primary);
}
.play-pause.active {
  background: var(--confirm-btn-bg);
  color: #fff;
}
.step-counter {
  font-weight: bold;
  min-width: 80px;
  text-align: center;
}
</style> 