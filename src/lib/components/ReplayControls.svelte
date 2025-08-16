<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { _ } from 'svelte-i18n';
  import ToggleButton from './ToggleButton.svelte';
  import { hotkeysAndTooltips } from '$lib/actions/hotkeysAndTooltips.js';

  export let limitReplayPath: boolean;
  export let currentStep: number;
  export let totalSteps: number;
  export let autoPlayDirection: 'paused' | 'forward' | 'backward';

  const dispatch = createEventDispatcher();
</script>

<div class="replay-ui-container">
  <div class="limit-path-container">
    <ToggleButton
      label={$_('replay.limitPath')}
      checked={limitReplayPath}
      on:toggle={() => dispatch('toggleLimitPath')}
      dataTestId="limit-path-toggle"
    />
  </div>

  <div class="replay-controls" use:hotkeysAndTooltips>
    <button class="control-btn" data-testid="replay-prev-step-btn" on:click={() => dispatch('goToStep', currentStep - 1)} disabled={currentStep === 0}>«</button>
    <button class="control-btn play-pause" data-testid="replay-play-backward-btn" class:active={autoPlayDirection === 'backward'} on:click={() => dispatch('toggleAutoPlay', 'backward')}>
      {#if autoPlayDirection === 'backward'}❚❚{:else}◀{/if}
    </button>
    <button class="control-btn play-pause" data-testid="replay-play-forward-btn" class:active={autoPlayDirection === 'forward'} on:click={() => dispatch('toggleAutoPlay', 'forward')}>
      {#if autoPlayDirection === 'forward'}❚❚{:else}▶{/if}
    </button>
    <button class="control-btn" data-testid="replay-next-step-btn" on:click={() => dispatch('goToStep', currentStep + 1)} disabled={currentStep >= totalSteps - 1}>»</button>
    <div class="step-counter" data-testid="replay-step-counter">
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
  width: 100%;
}

.limit-path-container {
  width: 100%;
  max-width: 250px; /* Or adjust as needed */
  --button-height: 40px; /* Example height */
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