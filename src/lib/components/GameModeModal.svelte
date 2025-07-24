<script>
  import { _ } from 'svelte-i18n';
  import { settingsStore } from '$lib/stores/settingsStore.js';
  import { modalStore } from '$lib/stores/modalStore.js';
  import { goto } from '$app/navigation';
  import { base } from '$app/paths';
  import { setBoardSize } from '$lib/stores/gameActions.js';
  import { get } from 'svelte/store';
  import { gameState } from '$lib/stores/gameState';

  /**
   * @param {'beginner' | 'experienced' | 'pro'} mode
   */
  function selectMode(mode) {
    const shouldShowFaq = settingsStore.applyGameModePreset(mode);
    const { score, penaltyPoints, boardSize } = get(gameState);
    if (score === 0 && penaltyPoints === 0 && boardSize !== 4) {
      setBoardSize(4);
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
              setBoardSize(4);
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

<div class="show-again-checkbox">
  <label class="ios-switch-label">
    <div class="switch-content-wrapper">
      <div class="ios-switch">
        <input 
          type="checkbox"
          bind:checked={dontShowAgain}
          on:change={handleCheckboxChange}
        />
        <span class="slider"></span>
      </div>
      <span>{$_('gameModes.dontShowAgain')}</span>
    </div>
  </label>
</div>

<style>
  .modal-buttons {
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding-top: 16px;
  }
  .show-again-checkbox {
    margin-top: 24px;
    padding-top: 16px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    display: flex;
    justify-content: center;
  }
  .ios-switch-label {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 1.08em;
    min-height: 40px;
    gap: 12px;
    cursor: pointer;
  }
  .switch-content-wrapper {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .ios-switch {
    position: relative;
    width: 44px;
    height: 24px;
    min-width: 44px;
    min-height: 24px;
  }
  .ios-switch input { display: none; }
  .slider {
    position: absolute;
    cursor: pointer;
    inset: 0;
    background: var(--toggle-off-bg, #555);
    border-radius: 12px;
    transition: background 0.2s;
  }
  .slider:before {
    content: '';
    position: absolute;
    left: 2px;
    top: 2px;
    width: 20px;
    height: 20px;
    background: #fff;
    border-radius: 50%;
    transition: transform 0.2s;
  }
  input:checked + .slider { background: var(--control-selected, #4caf50); }
  input:checked + .slider:before { transform: translateX(20px); }
  .show-again-checkbox .ios-switch {
    position: relative;
    width: 44px !important;
    height: 24px !important;
    min-width: 44px !important;
    min-height: 24px !important;
    display: inline-block;
  }
  .show-again-checkbox .ios-switch input { display: none; }
  .show-again-checkbox .slider {
    position: absolute;
    cursor: pointer;
    inset: 0;
    background: var(--toggle-off-bg, #555);
    border-radius: 12px;
    transition: background 0.2s;
    width: 44px !important;
    height: 24px !important;
  }
  .show-again-checkbox .slider:before {
    content: '';
    position: absolute;
    left: 2px;
    top: 2px;
    width: 20px !important;
    height: 20px !important;
    background: #fff;
    border-radius: 50%;
    transition: transform 0.2s;
  }
  .show-again-checkbox input:checked + .slider { background: var(--control-selected, #4caf50); }
  .show-again-checkbox input:checked + .slider:before { transform: translateX(20px); }
</style> 