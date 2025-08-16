<script>
  import { onMount, onDestroy } from 'svelte';
  import { _ } from 'svelte-i18n';
  import SvgIcons from '../SvgIcons.svelte';
  import { clearCache } from '$lib/utils/cacheManager.js';
  import { customTooltip } from '$lib/actions/customTooltip.js';

  let isVisible = false;

  function handleClearCache() {
    clearCache({ keepAppearance: false });
  }

  function handleKeydown(/** @type {KeyboardEvent} */ event) {
    // R або К (українська К)
    if ((event.key === 'r' || event.key === 'к' || event.key === 'R' || event.key === 'К') && import.meta.env.DEV) {
      event.preventDefault();
      handleClearCache();
    }
  }

  onMount(() => {
    if (import.meta.env.DEV) {
      document.addEventListener('keydown', handleKeydown);
    }
  });

  onDestroy(() => {
    if (import.meta.env.DEV) {
      document.removeEventListener('keydown', handleKeydown);
    }
  });
</script>

<style>
  .dev-clear-cache-button {
    position: fixed;
    top: 16px;
    right: 16px;
    z-index: 1000;
    background: var(--bg-secondary, rgba(255, 255, 255, 0.1));
    border: 1px solid var(--border-color, rgba(255, 255, 255, 0.2));
    border-radius: 8px;
    padding: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
    backdrop-filter: blur(10px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .dev-clear-cache-button:hover {
    background: var(--bg-hover, rgba(255, 255, 255, 0.2));
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  .dev-clear-cache-button:active {
    transform: translateY(0);
  }
</style>

{#if import.meta.env.DEV}
  <button 
    class="dev-clear-cache-button" 
    use:customTooltip={`${$_('gameBoard.clearCache')} (R/К)`}
    on:click={handleClearCache}
  >
    <SvgIcons name="clear-cache" />
  </button>
{/if} 