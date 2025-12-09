<script lang="ts">
  import { _ } from 'svelte-i18n';
  import { onMount } from 'svelte';
  import hotkeyService from '$lib/services/hotkeyService';
  import { modalStore } from '$lib/stores/modalStore';
  import { goto } from '$app/navigation';
  import { base } from '$app/paths';
  import { get } from 'svelte/store';
  import DontShowAgainCheckbox from './DontShowAgainCheckbox.svelte';
  import { userActionService } from '$lib/services/userActionService';
  import { logService } from '$lib/services/logService';
  import { uiStateStore } from '$lib/stores/uiStateStore';
  import type { GameModePreset } from '$lib/stores/gameSettingsStore';

  let showWipNotice = false; // Add this line

  function openWipNotice() {
    logService.action('Click: "Play Online (WIP)" (GameModeModal)');
    showWipNotice = true;
  }

  function closeWipNotice() {
    logService.action('Click: "Закрити WIP notice" (GameModeModal)');
    showWipNotice = false;
  }

  function handleLocalGame() {
    logService.action('Click: "Локальна гра" (GameModeModal)');
    uiStateStore.update(s => ({ ...s, intendedGameType: 'local' })); // Set intended game type
    modalStore.closeModal(); // Close the modal
    goto(`${base}/local-setup`); // Navigate to local-setup
  }

  export let scope: string;
  export let extended = false;
  let buttonsNode: HTMLElement;

  onMount(() => {
    if (buttonsNode) {
        const buttons = Array.from(buttonsNode.querySelectorAll('button'));
        buttons.forEach((btn, index) => {
            const key = `Digit${index + 1}`;
            hotkeyService.register(scope, key, () => btn.click());
        });
    }
  });

  function selectMode(mode: GameModePreset) {
    logService.modal(`[GameModeModal] selectMode called with: ${mode}`);
    userActionService.setGameModePreset(mode);

    if (extended) {
        uiStateStore.update(s => ({ ...s, intendedGameType: 'virtual-player' }));
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
            userActionService.navigateToGame();
            modalStore.closeModal();
        }
        return;
    }

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

<div class="game-mode-buttons" bind:this={buttonsNode}>
  <button class="modal-btn-generic green-btn" onclick={() => selectMode('beginner')} data-testid="beginner-mode-btn">
    {$_('gameModes.beginner')}
  </button>
  <button class="modal-btn-generic blue-btn" onclick={() => selectMode('experienced')} data-testid="experienced-mode-btn">
    {$_('gameModes.experienced')}
  </button>
  <button class="modal-btn-generic danger-btn" onclick={() => selectMode('pro')} data-testid="pro-mode-btn">
    {$_('gameModes.pro')}
  </button>
  {#if extended}
    <hr class="divider" />
    <button class="modal-btn-generic" onclick={() => selectMode('timed')} data-testid="timed-game-btn">
      {$_('mainMenu.timedGame')}
    </button>
    <button
      class="modal-btn-generic"
      class:locked-setting={!import.meta.env.DEV}
      onclick={import.meta.env.DEV ? handleLocalGame : openWipNotice}
      data-testid="local-game-btn"
    >
      {$_('mainMenu.localGame')}
    </button>
    <button class="modal-btn-generic" class:locked-setting={true} onclick={openWipNotice} data-testid="online-game-btn">
      {$_('mainMenu.playOnline')}
    </button>
  {/if}
</div>

{#if showWipNotice}
  <div class="wip-notice-overlay" role="dialog" tabindex="0" onclick={(e) => { e.stopPropagation(); }} onkeydown={(e) => (e.key === 'Escape') && closeWipNotice()}>
    <div class="wip-notice-content">
      <button class="wip-close-btn" onclick={closeWipNotice} data-testid="wip-notice-close-btn">×</button>
      <h3>{$_('mainMenu.wipNotice.title')}</h3>
      <p>{$_('mainMenu.wipNotice.description')}</p>
      <button class="wip-donate-btn" onclick={() => { /* handleDonate logic here if needed */ closeWipNotice(); }} data-testid="wip-notice-donate-btn">
        {$_('mainMenu.donate')}
      </button>
    </div>
  </div>
{/if}

{#if !extended}
  <DontShowAgainCheckbox tid="game-mode-modal-dont-show-again-switch" {scope} />
{/if}

<style>
  .game-mode-buttons {
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding-top: 16px;
  }
  .divider {
    border: none;
    border-top: 1px solid var(--border-color);
    margin: 0;
  }

  .wip-notice-overlay {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 10000; /* Ensure it's above other modals */
    width: 90vw;
    max-width: 400px;
  }
  .wip-notice-content {
    position: relative;
    background: var(--bg-secondary);
    color: var(--text-primary);
    padding: 28px 32px;
    border-radius: 18px;
    text-align: center;
    box-shadow: 0 8px 32px rgba(0,0,0,0.3);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }
  .wip-notice-content h3 {
    font-size: 1.4em;
    margin: 0 0 12px 0;
    color: var(--text-accent);
  }
  .wip-notice-content p {
    margin: 0 0 24px 0;
    line-height: 1.5;
    font-size: 1.05em;
  }
  .wip-donate-btn {
    background: var(--warning-action-bg);
    color: var(--warning-action-text);
    border: none;
    border-radius: 10px;
    padding: 12px 32px;
    font-weight: bold;
    cursor: pointer;
    font-size: 1.1em;
    transition: all 0.2s ease;
  }
  .wip-donate-btn:hover {
    transform: scale(1.05);
    box-shadow: 0 4px 16px var(--warning-action-bg);
  }
  .wip-close-btn {
    position: absolute;
    top: 10px;
    right: 10px;
    background: none;
    border: none;
    font-size: 2em;
    color: var(--text-primary);
    cursor: pointer;
    opacity: 0.7;
    transition: opacity 0.2s;
  }
  .wip-close-btn:hover {
    opacity: 1;
  }

  .locked-setting {
    opacity: 0.2;
    cursor: help;
  }
</style>

