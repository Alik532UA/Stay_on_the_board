<script lang="ts">
  import { _ } from 'svelte-i18n';
  import { onMount } from 'svelte';
  import hotkeyService from '$lib/services/hotkeyService';
  import { modalStore } from '$lib/stores/modalStore.js';
  import { goto } from '$app/navigation';
  import { base } from '$app/paths';
  import { get } from 'svelte/store';
  import DontShowAgainCheckbox from './DontShowAgainCheckbox.svelte';
  import { userActionService } from '$lib/services/userActionService';
  import { logService } from '$lib/services/logService';
  import { uiStateStore } from '$lib/stores/uiStateStore';
  import type { GameModePreset } from '$lib/stores/gameSettingsStore';

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
  <button class="modal-btn-generic green-btn" on:click={() => selectMode('beginner')} data-testid="beginner-mode-btn">
    {$_('gameModes.beginner')}
  </button>
  <button class="modal-btn-generic blue-btn" on:click={() => selectMode('experienced')} data-testid="experienced-mode-btn">
    {$_('gameModes.experienced')}
  </button>
  <button class="modal-btn-generic danger-btn" on:click={() => selectMode('pro')} data-testid="pro-mode-btn">
    {$_('gameModes.pro')}
  </button>
  {#if extended}
    <hr class="divider" />
    <button class="modal-btn-generic" on:click={() => selectMode('timed')} data-testid="timed-game-btn">
      {$_('mainMenu.timedGame')}
    </button>
    <button class="modal-btn-generic" on:click={() => { uiStateStore.update(s => ({ ...s, intendedGameType: 'local' })); goto(`${base}/local-setup`); modalStore.closeModal(); }} data-testid="local-game-btn">
      {$_('mainMenu.localGame')}
    </button>
    <button class="modal-btn-generic" disabled data-testid="online-game-btn">
      {$_('mainMenu.playOnline')}
    </button>
  {/if}
</div>

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
</style>
