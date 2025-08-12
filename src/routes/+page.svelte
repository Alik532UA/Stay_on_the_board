<script lang="ts">
  import MainMenu from '$lib/components/MainMenu.svelte';
  import DevClearCacheButton from '$lib/components/widgets/DevClearCacheButton.svelte';
  import { settingsStore } from '$lib/stores/settingsStore';
  import { onMount } from 'svelte';

  let testMode = false;

  onMount(() => {
    const unsubscribe = settingsStore.subscribe(settings => {
      testMode = settings.testMode;
    });
    return unsubscribe;
  });

  function handleTestModeChange() {
    settingsStore.updateSettings({ testMode: !testMode });
  }
</script>

<MainMenu />
<DevClearCacheButton />

{#if import.meta.env.DEV}
  <div class="test-mode-toggle">
    <button on:click={handleTestModeChange} class:active={testMode}>
      Test Mode: {testMode ? 'ON' : 'OFF'}
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
