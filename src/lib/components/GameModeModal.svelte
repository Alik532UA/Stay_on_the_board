<script lang="ts">
  import { _ } from 'svelte-i18n';
  
  import { modalStore } from '$lib/stores/modalStore.js';
  import { goto } from '$app/navigation';
  import { base } from '$app/paths';
  import { get } from 'svelte/store';
  import DontShowAgainCheckbox from './DontShowAgainCheckbox.svelte';
  import { hotkeysAndTooltips } from '$lib/actions/hotkeysAndTooltips.js';
  import { userActionService } from '$lib/services/userActionService';
  import { logService } from '$lib/services/logService';

  function selectMode(mode: 'beginner' | 'experienced' | 'pro') {
    logService.modal(`[GameModeModal] selectMode called with: ${mode}`);
    userActionService.setGameModePreset(mode);

    if (mode === 'beginner') {
      logService.modal('[GameModeModal] Beginner mode selected. Showing FAQ modal.');
      modalStore.showModal({
        titleKey: 'faq.title',
        dataTestId: 'faq-modal',
        content: { isFaq: true },
        buttons: [
          { textKey: 'rulesPage.title', onClick: () => { goto(`${base}/rules`); modalStore.closeModal(); }, customClass: 'blue-btn' },
          {
            textKey: 'modal.ok',
            primary: true,
            isHot: true,
            onClick: () => {
              logService.modal('[FAQModal] OK button clicked. Closing modal and navigating to game.');
              modalStore.closeModal();
              userActionService.navigateToGame();
            }
          }
        ]
      });
    } else {
      logService.modal(`[GameModeModal] ${mode} mode selected. Closing current modal and navigating.`);
      modalStore.closeModal();
      userActionService.navigateToGame();
    }
  }
</script>

<div class="game-mode-buttons" use:hotkeysAndTooltips>
  <button class="modal-btn-generic green-btn" on:click={() => selectMode('beginner')} data-testid="beginner-mode-btn">
    {$_('gameModes.beginner')}
  </button>
  <button class="modal-btn-generic blue-btn" on:click={() => selectMode('experienced')} data-testid="experienced-mode-btn">
    {$_('gameModes.experienced')}
  </button>
  <button class="modal-btn-generic danger-btn" on:click={() => selectMode('pro')} data-testid="pro-mode-btn">
    {$_('gameModes.pro')}
  </button>
</div>
<DontShowAgainCheckbox dataTestId="game-mode-modal-dont-show-again-switch" />

<style>
  .game-mode-buttons {
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding-top: 16px;
  }
</style>