<script>
  import { _ } from 'svelte-i18n';
  import { settingsStore } from '$lib/stores/settingsStore.js';
  import { modalStore } from '$lib/stores/modalStore.js';
  import { goto } from '$app/navigation';
  import { base } from '$app/paths';
  import { setBoardSize } from '$lib/stores/gameStore.js';

  /**
   * @param {'beginner' | 'experienced' | 'pro'} mode
   */
  function selectMode(mode) {
    const shouldShowFaq = settingsStore.applyGameModePreset(mode);
    setBoardSize(4);
    if (shouldShowFaq) {
      setTimeout(() => {
        modalStore.showModal({
          titleKey: 'faq.title',
          content: { isFaq: true },
          buttons: [
            { textKey: 'rulesPage.title', onClick: () => { goto(`${base}/rules`); modalStore.closeModal(); }, customClass: 'blue-btn' },
            { textKey: 'modal.ok', primary: true, isHot: true, onClick: modalStore.closeModal }
          ]
        });
      }, 100);
    }
  }
</script>

<div class="modal-buttons">
  <button class="modal-btn-generic green-btn" on:click={() => selectMode('beginner')}>
    {$_('gameModes.beginner')}
  </button>
  <button class="modal-btn-generic blue-btn" on:click={() => selectMode('experienced')}>
    {$_('gameModes.experienced')}
  </button>
  <button class="modal-btn-generic danger-btn" on:click={() => selectMode('pro')}>
    {$_('gameModes.pro')}
  </button>
</div>

<style>
  .modal-buttons {
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding-top: 16px;
  }
</style> 