<script>
  import { _ } from 'svelte-i18n';
  import { modalStore } from '$lib/stores/modalStore.js';
  import { logService } from '$lib/services/logService.js';
  import { clearCache } from '$lib/utils/cacheManager.js';

  function handleClearAll() {
    logService.action('Повне очищення кешу');
    clearCache({ keepAppearance: false });
    modalStore.closeModal();
  }

  function handleKeepAppearance() {
    logService.action('Очищення кешу зі збереженням вигляду');
    clearCache({ keepAppearance: true });
    modalStore.closeModal();
  }
</script>

<div class="clear-cache-options">
  <p class="description">{$_('mainMenu.clearCacheModal.content')}</p>
  <div class="button-group">
    <button class="modal-btn-generic danger-btn" on:click={handleClearAll}>
      {$_('mainMenu.clearCacheModal.fullClear')}
    </button>
    <button class="modal-btn-generic primary" on:click={handleKeepAppearance}>
      {$_('mainMenu.clearCacheModal.keepAppearance')}
    </button>
  </div>
</div>

<style>
  .clear-cache-options {
    text-align: center;
  }
  .description {
    margin-bottom: 24px;
    font-size: 1.1em;
    color: var(--text-secondary);
  }
  .button-group {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
</style> 