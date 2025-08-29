<script lang="ts">
  import MainMenu from '$lib/components/MainMenu.svelte';
  import DevClearCacheButton from '$lib/components/widgets/DevClearCacheButton.svelte';
  import { testModeStore, toggleTestMode } from '$lib/stores/testModeStore';
  import { onMount } from 'svelte';
  import { get } from 'svelte/store';
  
  let testModeEnabled = false;
  
  onMount(() => {
    const unsubscribe = testModeStore.subscribe(state => {
      testModeEnabled = state.isEnabled;
    });
    return unsubscribe;
  });
  
  function handleTestModeChange() {
    toggleTestMode();
  }
</script>

<MainMenu />
<DevClearCacheButton />

{#if import.meta.env.DEV}
  <div class="test-mode-toggle">
    <button on:click={handleTestModeChange} class:active={testModeEnabled} data-testid="test-mode-btn">
      Test Mode: {testModeEnabled ? 'ON' : 'OFF'}
    </button>
  </div>
{/if}

<style>
  .test-mode-toggle {
    position: fixed;
    bottom: 10px;
    right: 10px;
    z-index: 1000;
  }
  .test-mode-toggle button {
    background: #555;
    color: white;
    border: 2px solid #777;
    padding: 8px 12px;
    border-radius: 8px;
    cursor: pointer;
    transition: background-color 0.2s, border-color 0.2s;
  }
  .test-mode-toggle button.active {
    background: #4CAF50;
    border-color: #81C784;
  }
</style>