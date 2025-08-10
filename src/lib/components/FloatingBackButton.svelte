<script lang="ts">
  import { navigationService } from '$lib/services/navigationService.js';
  import { modalStore } from '$lib/stores/modalStore.js';
  import { gameOrchestrator } from '$lib/gameOrchestrator.ts';
  import { _ } from 'svelte-i18n';
  import { get } from 'svelte/store';
  import { gameState } from '$lib/stores/gameState.js';
  import { localGameStore } from '$lib/stores/localGameStore.js';
  import { logService } from '$lib/services/logService.js';
  import { gameOverStore } from '$lib/stores/gameOverStore.js';
  import { replayService } from '$lib/services/replayService';

  function handleBackClick() {
    logService.ui('FloatingBackButton: handleBackClick called');
    const replayData = replayService.loadReplayData();
    if (replayData) {
      // The replayService has already restored the game state.
      // We just need to handle the UI aspects here.
      if (replayData.modalContext) {
        const $t = get(_);
        const modalContext = replayData.modalContext;
        const buttons = modalContext.buttons.map((btn: any) => {
          const buttonConfig: any = {
            textKey: btn.textKey,
            customClass: btn.customClass,
            isHot: btn.isHot
          };
          if (btn.action === 'continueAfterNoMoves') {
            buttonConfig.onClick = gameOrchestrator.continueAfterNoMoves.bind(gameOrchestrator);
          } else if (btn.action === 'finalizeGameWithBonus') {
            buttonConfig.onClick = () => gameOrchestrator.finalizeGameWithBonus('modal.gameOverReasonBonus');
          } else if (btn.action === 'startReplay') {
            buttonConfig.onClick = gameOrchestrator.startReplay.bind(gameOrchestrator);
          } else if (btn.action === 'playAgain') {
            buttonConfig.onClick = () => {
              const gameType = replayData.gameType || 'vs-computer';
              if (gameType === 'local') {
                gameOrchestrator.restartGame();
              } else {
                gameOrchestrator.setBoardSize(get(gameState).boardSize);
                modalStore.closeModal();
              }
            };
          }
          if (btn.text === 'modal.finishGameWithBonus') {
            buttonConfig.text = $t('modal.finishGameWithBonus', { values: { bonus: btn.bonus } });
          }
          return buttonConfig;
        });

        modalStore.showModal({
          titleKey: modalContext.titleKey,
          content: {
            reason: modalContext.content.reasonValues ?
              $t(modalContext.content.reason, { values: modalContext.content.reasonValues }) :
              $t(modalContext.content.reason),
            scoreDetails: modalContext.content.scoreDetails
          },
          buttons,
          closable: modalContext.closable
        });

        const gameType = replayData.gameType || 'vs-computer';
        if (gameType === 'local') {
          navigationService.goTo('/game/local');
        } else {
          navigationService.goTo('/game/vs-computer');
        }
        return;
      }
    }
    
    logService.ui('FloatingBackButton: No modal context found, using goBack()');
    // Якщо контексту немає, використовуємо звичайну навігацію назад
    navigationService.goBack();
  }
</script>

<button
  class="floating-back-btn"
  aria-label={$_('ui.goBack') || 'Повернутися назад'}
  title={$_('ui.goBack') || 'Повернутися назад'}
  onclick={handleBackClick}
>
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
    <line x1="19" y1="12" x2="5" y2="12"></line>
    <polyline points="12 19 5 12 12 5"></polyline>
  </svg>
</button>

<style>
  .floating-back-btn {
    width: 52px;
    height: 52px;
    border-radius: 50%;
    border: none;
    background: rgba(0, 0, 0, 0.2);
    color: white;
    cursor: pointer;
    z-index: 1010;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background-color 0.2s, transform 0.2s, box-shadow 0.2s;
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    margin-right: 1rem;
  }
  .floating-back-btn:hover {
    background: rgba(0, 0, 0, 0.4);
    transform: scale(1.05);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
  }
  .floating-back-btn svg {
    width: 200%;
    height: 200%;
    flex-shrink: 0; /* Забороняємо flex-контейнеру стискати іконку */
  }
</style> 