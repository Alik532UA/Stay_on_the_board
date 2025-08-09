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

  function handleBackClick() {
    logService.ui('FloatingBackButton: handleBackClick called');
    // Перевіряємо, чи є контекст модального вікна в sessionStorage
    const replayDataJSON = sessionStorage.getItem('replayData');
    logService.ui('FloatingBackButton: replayDataJSON from sessionStorage:', replayDataJSON);
    if (replayDataJSON) {
      try {
        const replayData = JSON.parse(replayDataJSON);
        logService.ui('FloatingBackButton: parsed replayData:', replayData);
        
        // Відновлення gameState якщо є replayGameState
        const replayGameStateJSON = sessionStorage.getItem('replayGameState');
        let replayGameState = null;
        if (replayGameStateJSON) {
          try {
            replayGameState = JSON.parse(replayGameStateJSON);
            gameState.set(replayGameState);
            sessionStorage.removeItem('replayGameState');
            logService.ui('FloatingBackButton: gameState відновлено з sessionStorage');
          } catch (e) {
            logService.ui('FloatingBackButton: не вдалося відновити gameState з sessionStorage', e);
          }
        }
        
        // Відновлення localGameStore якщо є replayLocalGameState
        const replayLocalGameStateJSON = sessionStorage.getItem('replayLocalGameState');
        if (replayLocalGameStateJSON) {
          try {
            const replayLocalGameState = JSON.parse(replayLocalGameStateJSON);
            localGameStore.restoreState(replayLocalGameState);
            sessionStorage.removeItem('replayLocalGameState');
            logService.ui('FloatingBackButton: localGameStore відновлено з sessionStorage');
          } catch (e) {
            logService.ui('FloatingBackButton: не вдалося відновити localGameStore з sessionStorage', e);
          }
        }
        
        if (replayData.modalContext) {
          logService.ui('FloatingBackButton: modalContext found:', replayData.modalContext);
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
                // Використовуємо збережений тип гри з replayData замість перевірки localGameStore
                const gameType = replayData.gameType || 'vs-computer';
                
                if (gameType === 'local') {
                  // Для локальної гри використовуємо спеціальну функцію
                  gameOrchestrator.restartGame();
                } else {
                  // Для гри проти комп'ютера використовуємо звичайний скид
                  gameOrchestrator.setBoardSize(get(gameState).boardSize);
                  modalStore.closeModal();
                }
              };
            }

            // Обробляємо спеціальний випадок для кнопки з бонусом
            if (btn.text === 'modal.finishGameWithBonus') {
              buttonConfig.text = $t('modal.finishGameWithBonus', { values: { bonus: btn.bonus } });
            }

            return buttonConfig;
          });

          logService.ui('FloatingBackButton: Restoring modal with config:', {
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

          // Відновлення gameOverStore для vs-computer
          if (replayData.gameType === 'vs-computer' && replayGameState) {
            // Відновлюємо gameOverStore для коректного відображення модального вікна та рахунку
            gameOverStore.setGameOver({
              scores: [{ playerId: 0, score: replayGameState.score || 0 }],
              winners: null, // для vs-computer winner не використовується
              reasonKey: replayGameState.gameOverReasonKey || null,
              reasonValues: replayGameState.gameOverReasonValues || null,
              finalScoreDetails: {
                baseScore: replayGameState.baseScore || 0,
                sizeBonus: replayGameState.sizeBonus || 0,
                blockModeBonus: replayGameState.blockModeBonus || 0,
                jumpBonus: replayGameState.jumpBonus || 0,
                finishBonus: replayGameState.finishBonus || 0,
                noMovesBonus: replayGameState.noMovesBonus || 0,
                totalPenalty: replayGameState.totalPenalty || 0,
                totalScore: replayGameState.totalScore || 0,
              },
              gameType: 'vs-computer',
            });
          }

          logService.ui('FloatingBackButton: Modal restored, navigating to /game');
          // Видаляємо дані replay з sessionStorage
          sessionStorage.removeItem('replayData');
          
          // Визначаємо, на яку сторінку повертатися на основі збереженого типу гри
          const gameType = replayData.gameType || 'vs-computer'; // За замовчуванням vs-computer
          
          if (gameType === 'local') {
            navigationService.goTo('/game/local');
          } else {
            navigationService.goTo('/game/vs-computer');
          }
          return;
        }
      } catch (error) {
        logService.ui('Failed to parse replay data for modal context:', error);
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