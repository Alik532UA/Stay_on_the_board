<script>
  import { _ } from 'svelte-i18n';
  import { settingsStore } from '$lib/stores/settingsStore.js';
  import { modalStore } from '$lib/stores/modalStore.js';
  import { goto } from '$app/navigation';
  import { base } from '$app/paths';
  import { gameOrchestrator } from '$lib/gameOrchestrator.js';
  import { get } from 'svelte/store';
  import { gameState } from '$lib/stores/gameState';
  import DontShowAgainCheckbox from './DontShowAgainCheckbox.svelte';

  /**
   * @param {'beginner' | 'experienced' | 'pro'} mode
   */
  function selectMode(mode) {
    const shouldShowFaq = settingsStore.applyGameModePreset(mode);
    const { score, penaltyPoints, boardSize } = get(gameState);
    if (score === 0 && penaltyPoints === 0 && boardSize !== 4) {
      gameOrchestrator.setBoardSize(4);
      gotoAfterFaq();
    } else if (boardSize !== 4) {
      modalStore.showModal({
        titleKey: 'modal.resetScoreTitle',
        contentKey: 'modal.resetScoreContent',
        buttons: [
          {
            textKey: 'modal.resetScoreConfirm',
            customClass: 'green-btn',
            isHot: true,
            onClick: () => {
              gameOrchestrator.setBoardSize(4);
              modalStore.closeModal();
              gotoAfterFaq();
            }
          },
          { textKey: 'modal.resetScoreCancel', onClick: modalStore.closeModal }
        ]
      });
    } else {
      gotoAfterFaq();
    }

    function gotoAfterFaq() {
      if (shouldShowFaq) {
        setTimeout(() => {
          modalStore.showModal({
            titleKey: 'faq.title',
            content: { isFaq: true },
            buttons: [
              { textKey: 'rulesPage.title', onClick: () => { goto(`${base}/rules`); modalStore.closeModal(); }, customClass: 'blue-btn' },
              { textKey: 'modal.ok', primary: true, isHot: true, onClick: () => { modalStore.closeModal(); goto(`${base}/game`); } }
            ]
          });
        }, 100);
      } else {
        goto(`${base}/game`);
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

<div class="game-mode-buttons">
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
  .game-mode-buttons {
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding-top: 16px;
  }
</style> 