<script lang="ts">
  import { navigationService } from '$lib/services/navigationService.js';
  import { modalStore } from '$lib/stores/modalStore.js';
  import { gameOrchestrator } from '$lib/gameOrchestrator.ts';
  import { _ } from 'svelte-i18n';
  import { get } from 'svelte/store';
  import { gameState } from '$lib/stores/gameState.js';

  function handleBackClick() {
    console.log('FloatingBackButton: handleBackClick called');
    // Перевіряємо, чи є контекст модального вікна в sessionStorage
    const replayDataJSON = sessionStorage.getItem('replayData');
    console.log('FloatingBackButton: replayDataJSON from sessionStorage:', replayDataJSON);
    if (replayDataJSON) {
      try {
        const replayData = JSON.parse(replayDataJSON);
        console.log('FloatingBackButton: parsed replayData:', replayData);
        if (replayData.modalContext) {
          console.log('FloatingBackButton: modalContext found:', replayData.modalContext);
          // Відновлюємо модальне вікно з контексту
          const $t = get(_);
          const modalContext = replayData.modalContext;
          
          // Створюємо кнопки з правильними обробниками
          const buttons = modalContext.buttons.map((btn: any) => {
            const buttonConfig: any = {
              textKey: btn.textKey,
              customClass: btn.customClass,
              isHot: btn.isHot
            };

            // Додаємо обробники подій для кнопок
            if (btn.action === 'continueAfterNoMoves') {
              buttonConfig.onClick = gameOrchestrator.continueAfterNoMoves.bind(gameOrchestrator);
            } else if (btn.action === 'finalizeGameWithBonus') {
              buttonConfig.onClick = () => gameOrchestrator.finalizeGameWithBonus('modal.gameOverReasonBonus');
            } else if (btn.action === 'startReplay') {
              buttonConfig.onClick = gameOrchestrator.startReplay.bind(gameOrchestrator);
            } else if (btn.action === 'playAgain') {
              buttonConfig.onClick = () => {
                // Скидаємо гру і закриваємо модальне вікно
                gameOrchestrator.setBoardSize(get(gameState).boardSize);
                modalStore.closeModal();
              };
            }

            // Обробляємо спеціальний випадок для кнопки з бонусом
            if (btn.text === 'modal.finishGameWithBonus') {
              buttonConfig.text = $t('modal.finishGameWithBonus', { values: { bonus: btn.bonus } });
            }

            return buttonConfig;
          });

          console.log('FloatingBackButton: Restoring modal with config:', {
            titleKey: modalContext.titleKey,
            content: modalContext.content,
            buttons: buttons,
            closable: modalContext.closable
          });

          // Показуємо модальне вікно
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

          console.log('FloatingBackButton: Modal restored, navigating to /game');
          // Видаляємо дані replay з sessionStorage
          sessionStorage.removeItem('replayData');
          
          // Повертаємося на сторінку гри
          navigationService.goTo('/game');
          return;
        }
      } catch (error) {
        console.error('Failed to parse replay data for modal context:', error);
      }
    }
    
    console.log('FloatingBackButton: No modal context found, using goBack()');
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
    position: fixed;
    top: 20px;
    left: 20px;
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