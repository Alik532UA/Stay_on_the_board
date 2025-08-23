<script>
  import Settings from '$lib/components/Settings.svelte';
  import FloatingBackButton from '$lib/components/FloatingBackButton.svelte';
  import { _ } from 'svelte-i18n';
</script>

<div class="page-container">
  <div class="header-container">
    <FloatingBackButton />
    <h1 data-testid="settings-title">{$_('settings.title')}</h1>
  </div>

  <Settings />
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
</style>