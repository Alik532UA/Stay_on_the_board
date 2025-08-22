<script>
  import FloatingBackButton from '$lib/components/FloatingBackButton.svelte';
  import PlayerManager from '$lib/components/local-setup/PlayerManager.svelte';
  import LocalGameSettings from '$lib/components/local-setup/LocalGameSettings.svelte';
  import DevClearCacheButton from '$lib/components/widgets/DevClearCacheButton.svelte';
  import { _ } from 'svelte-i18n';
  import { onMount } from 'svelte';
  import { gameState } from '$lib/stores/gameState.js';
  import { get } from 'svelte/store';

  onMount(() => {
    if (!get(gameState)) {
      gameState.reset();
    }
  });
</script>

<DevClearCacheButton />

<div class="page-container">
  <div class="header-container">
    <FloatingBackButton />
    <h1 data-testid="local-setup-title">{$_('localGame.title')}</h1>
  </div>

  <div class="setup-grid">
    <div class="grid-column">
      <PlayerManager />
    </div>
    <div class="grid-column">
      <LocalGameSettings />
    </div>
  </div>
</div>

<style>
  .page-container {
    width: 100%;
    max-width: 900px;
    margin: 0 auto;
    padding: 1rem;
  }

  .header-container {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 2rem;
  }

  h1 {
    text-align: center;
    color: var(--text-primary);
    margin: 0;
  }

  .setup-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
    align-items: start;
  }

  /* Адаптивність для мобільних пристроїв */
  @media (max-width: 800px) {
    .setup-grid {
      grid-template-columns: 1fr;
    }
  }
</style> 