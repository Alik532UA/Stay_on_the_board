<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let label: string;
  export let checked: boolean;
  export let disabled: boolean = false;
  export let dataTestId: string | undefined = undefined;

  const dispatch = createEventDispatcher();

  function handleClick() {
    if (!disabled) {
      dispatch('toggle');
    }
  }
</script>

<button 
  class="settings-expander__toggle-btn"
  class:active={checked}
  on:click={handleClick}
  disabled={disabled}
  data-testid={dataTestId}
>
  {label}
</button>

<style>
  .settings-expander__toggle-btn {
    background: var(--control-bg);
    color: var(--text-primary);
    border: var(--button-border-width, 1.5px) solid #888;
    border-radius: var(--button-border-radius, 8px);
    padding: 0;
    height: var(--button-height);
    min-height: var(--button-height);
    box-sizing: border-box;
    font-size: calc(var(--button-height) * 0.4);
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease-in-out;
    width: 100%;
    text-align: center;
  }

  .settings-expander__toggle-btn:hover {
    border-color: var(--control-selected);
    color: var(--text-primary);
  }

  .settings-expander__toggle-btn.active {
    background: var(--control-selected);
    color: var(--control-selected-text);
    border-color: var(--control-selected);
  }

  .settings-expander__toggle-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    background: var(--control-bg);
    color: var(--text-primary);
    border-color: #888;
    box-shadow: none;
  }
</style>
