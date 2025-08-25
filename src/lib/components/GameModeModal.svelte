<script>
  import { _ } from 'svelte-i18n';
  import { settingsStore } from '$lib/stores/settingsStore.js';
  import { modalStore } from '$lib/stores/modalStore.js';
  import { goto } from '$app/navigation';
  import { base } from '$app/paths';
  import { get } from 'svelte/store';
  import { gameState } from '$lib/stores/gameState';
  import DontShowAgainCheckbox from './DontShowAgainCheckbox.svelte';
  import { hotkeysAndTooltips } from '$lib/actions/hotkeysAndTooltips.js';
  import { enableAllGameCheckboxesIfNeeded } from '$lib/utils/uiUtils.js';
  import { userActionService } from '$lib/services/userActionService';

  /**
   * @param {'beginner' | 'experienced' | 'pro'} mode
   */
  function selectMode(mode) {
    // НАВІЩО: Викликаємо метод з правильного сервісу (SoC).
    userActionService.applyGameModePreset(mode);
    const shouldShowFaq = mode === 'beginner';
    enableAllGameCheckboxesIfNeeded();
    gotoAfterFaq();

    function gotoAfterFaq() {
      if (shouldShowFaq) {
        setTimeout(() => {
          modalStore.showModal({
            titleKey: 'faq.title',
            dataTestId: 'faq-modal',
            content: { isFaq: true },
            buttons: [
              { textKey: 'rulesPage.title', onClick: () => { goto(`${base}/rules`); modalStore.closeModal(); }, customClass: 'blue-btn' },
              { textKey: 'modal.ok', primary: true, isHot: true, onClick: () => { modalStore.closeModal(); goto(`${base}/game/training`); } }
            ]
          });
        }, 100);
      } else {
        goto(`${base}/game/training`);
      }
    }
  }

  let dontShowAgain = false;
  $: dontShowAgain = !$settingsStore.showGameModeModal;

  /** @param {Event} event */
  function handleCheckboxChange(event) {
    const input = /** @type {HTMLInputElement|null} */ (event.currentTarget);
    if (input && typeof input.checked === 'boolean') {
      settingsStore.updateSettings({ showGameModeModal: !input.checked });
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