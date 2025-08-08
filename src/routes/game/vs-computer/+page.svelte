<script lang="ts">
  // НАВІЩО: Ця сторінка тепер відповідає ТІЛЬКИ за відображення ігрових віджетів
  // у потрібному порядку для режиму "гра проти комп'ютера".
  // Вся спільна логіка (модальні вікна, гарячі клавіші) винесена в layout.

  import '$lib/css/components/game-board.css';
  import '$lib/css/components/controls.css';
  import DraggableColumns from '$lib/components/DraggableColumns.svelte';
  import { layoutStore, WIDGETS } from '$lib/stores/layoutStore.js';
  import TopRowWidget from '$lib/components/widgets/TopRowWidget.svelte';
  import ScorePanelWidget from '$lib/components/widgets/ScorePanelWidget.svelte';
  import BoardWrapperWidget from '$lib/components/widgets/BoardWrapperWidget.svelte';
  import ControlsPanelWidget from '$lib/components/widgets/ControlsPanelWidget.svelte';
  import SettingsExpanderWidget from '$lib/components/widgets/SettingsExpanderWidget.svelte';
  import GameInfoWidget from '$lib/components/widgets/GameInfoWidget.svelte';
  import DevClearCacheButton from '$lib/components/widgets/DevClearCacheButton.svelte';
  import { settingsStore } from '$lib/stores/settingsStore.js';
  import { onMount } from 'svelte';
  import { resetGame, calculateFinalScore } from '$lib/services/gameLogicService.js';
  import { animationStore } from '$lib/stores/animationStore.js';
  import { gameState } from '$lib/stores/gameState.js';
  import { modalStore } from '$lib/stores/modalStore.js';
  import { gameOverStore } from '$lib/stores/gameOverStore';
  import { gameOrchestrator } from '$lib/gameOrchestrator';
  import { get } from 'svelte/store';
  import { _ } from 'svelte-i18n';

  onMount(() => {
    settingsStore.init();
    // Ініціалізуємо гру саме для цього режиму при вході на сторінку
    resetGame(); 
    animationStore.initialize();
    
    // Перевіряємо, чи є збережений стан завершення гри
    const gameOverState = get(gameOverStore);
    if (gameOverState.isGameOver && gameOverState.gameResult) {
      // Відновлюємо модальне вікно з результатами гри
      const { gameResult } = gameOverState;
      const $t = get(_);
      
      let modalConfig = {};
      
      switch (gameResult.reasonKey) {
        case 'modal.playerNoMovesContent':
          modalConfig = {
            titleKey: 'modal.playerNoMovesTitle',
            content: { reason: $t(gameResult.reasonKey || ''), scoreDetails: gameResult.finalScoreDetails },
            buttons: [
              { textKey: 'modal.continueGame', customClass: 'green-btn', isHot: true, onClick: gameOrchestrator.continueAfterNoMoves },
              { 
                text: $t('modal.finishGameWithBonus', { values: { bonus: get(gameState).boardSize } }), 
                onClick: () => gameOrchestrator.finalizeGameWithBonus('modal.gameOverReasonBonus') 
              },
              { textKey: 'modal.watchReplay', customClass: 'blue-btn', onClick: gameOrchestrator.startReplay }
            ],
            closable: false
          };
          break;
        
        case 'modal.errorContent':
          modalConfig = {
            titleKey: 'modal.errorTitle',
            content: { reason: $t(gameResult.reasonKey || '', { values: gameResult.reasonValues }), scoreDetails: gameResult.finalScoreDetails },
            buttons: [
              { textKey: 'modal.playAgain', primary: true, onClick: () => { 
                resetGame(); 
                gameOverStore.resetGameOverState();
                modalStore.closeModal(); 
              }, isHot: true },
              { textKey: 'modal.watchReplay', customClass: 'blue-btn', onClick: gameOrchestrator.startReplay }
            ],
            closable: false
          };
          break;

        case 'modal.computerNoMovesContent':
          modalConfig = {
            titleKey: 'modal.computerNoMovesTitle',
            content: { reason: $t('modal.computerNoMovesContent'), scoreDetails: gameResult.finalScoreDetails },
            buttons: [
              { textKey: 'modal.continueGame', customClass: 'green-btn', isHot: true, onClick: gameOrchestrator.continueAfterNoMoves },
              { 
                text: $t('modal.finishGameWithBonus', { values: { bonus: get(gameState).boardSize } }), 
                onClick: () => gameOrchestrator.finalizeGameWithBonus('modal.gameOverReasonBonus') 
              },
              { textKey: 'modal.watchReplay', customClass: 'blue-btn', onClick: gameOrchestrator.startReplay }
            ],
            closable: false
          };
          break;

        default:
          modalConfig = {
            titleKey: 'modal.gameOverTitle',
            content: { reason: $t(gameResult.reasonKey || '', { values: gameResult.reasonValues }), scoreDetails: gameResult.finalScoreDetails },
            buttons: [
              { textKey: 'modal.playAgain', primary: true, onClick: () => { 
                resetGame(); 
                gameOverStore.resetGameOverState();
                modalStore.closeModal(); 
              }, isHot: true },
              { textKey: 'modal.watchReplay', customClass: 'blue-btn', onClick: gameOrchestrator.startReplay }
            ]
          };
          break;
      }
      
      modalStore.showModal(modalConfig);
    }
  });

  const widgetMap = {
    [WIDGETS.TOP_ROW]: TopRowWidget,
    [WIDGETS.SCORE_PANEL]: ScorePanelWidget,
    [WIDGETS.BOARD_WRAPPER]: BoardWrapperWidget,
    [WIDGETS.CONTROLS_PANEL]: ControlsPanelWidget,
    [WIDGETS.SETTINGS_EXPANDER]: SettingsExpanderWidget,
    [WIDGETS.GAME_INFO]: GameInfoWidget,
  };

  $: columns = $layoutStore.map(col => ({
    id: col.id,
    label: col.id,
    items: col.widgets.map(id => ({ id, label: id }))
  }));

  // НАВІЩО: Логіка модальних вікон залишається тут, оскільки вона специфічна
  // для ігрового процесу, а не для layout
  $: if ($gameState.isGameOver && $gameState.gameOverReasonKey) {
    setTimeout(() => {
      const reasonKey = $gameState.gameOverReasonKey;
      const $t = get(_);
      const reasonValues = $gameState.gameOverReasonValues || {};

      let modalConfig = {};

      switch (reasonKey) {
        case 'modal.playerNoMovesContent':
          modalConfig = {
            titleKey: 'modal.playerNoMovesTitle',
            content: { reason: $t(reasonKey || ''), scoreDetails: calculateFinalScore($gameState as any) },
            buttons: [
              { textKey: 'modal.continueGame', customClass: 'green-btn', isHot: true, onClick: gameOrchestrator.continueAfterNoMoves },
              { 
                text: $t('modal.finishGameWithBonus', { values: { bonus: $gameState.boardSize } }), 
                onClick: () => gameOrchestrator.finalizeGameWithBonus('modal.gameOverReasonBonus') 
              },
              { textKey: 'modal.watchReplay', customClass: 'blue-btn', onClick: gameOrchestrator.startReplay }
            ],
            closable: false
          };
          break;
        
        case 'modal.errorContent':
          modalConfig = {
            titleKey: 'modal.errorTitle',
            content: { reason: $t(reasonKey || '', { values: reasonValues }), scoreDetails: calculateFinalScore($gameState as any) },
            buttons: [
              { textKey: 'modal.playAgain', primary: true, onClick: () => { resetGame(); modalStore.closeModal(); }, isHot: true },
              { textKey: 'modal.watchReplay', customClass: 'blue-btn', onClick: gameOrchestrator.startReplay }
            ],
            closable: false
          };
          break;

        case 'modal.computerNoMovesContent':
          modalConfig = {
            titleKey: 'modal.computerNoMovesTitle',
            content: { reason: $t('modal.computerNoMovesContent'), scoreDetails: calculateFinalScore($gameState as any) },
            buttons: [
              { textKey: 'modal.continueGame', customClass: 'green-btn', isHot: true, onClick: gameOrchestrator.continueAfterNoMoves },
              { 
                text: $t('modal.finishGameWithBonus', { values: { bonus: $gameState.boardSize } }), 
                onClick: () => gameOrchestrator.finalizeGameWithBonus('modal.gameOverReasonBonus') 
              },
              { textKey: 'modal.watchReplay', customClass: 'blue-btn', onClick: gameOrchestrator.startReplay }
            ],
            closable: false
          };
          break;

        default:
          modalConfig = {
            titleKey: 'modal.gameOverTitle',
            content: { reason: $t(reasonKey || '', { values: reasonValues }), scoreDetails: calculateFinalScore($gameState as any) },
            buttons: [
              { textKey: 'modal.playAgain', primary: true, onClick: () => { resetGame(); modalStore.closeModal(); }, isHot: true },
              { textKey: 'modal.watchReplay', customClass: 'blue-btn', onClick: gameOrchestrator.startReplay }
            ]
          };
          break;
      }
      
      modalStore.showModal(modalConfig);
    }, 600);
  }

  function itemContent(item: {id: string, label: string}) {
    const Comp = widgetMap[item.id];
    if (Comp) return Comp;
    return item.id;
  }

  function handleDrop(e: CustomEvent<{dragging: {id: string, label: string}, dragSourceCol: string, dropTargetCol: string, dropIndex: number}>) {
    const { dragging, dragSourceCol, dropTargetCol, dropIndex } = e.detail;
    layoutStore.update(cols => {
      let newCols = cols.map(col => ({
        ...col,
        widgets: col.widgets.filter(id => id !== dragging.id)
      }));
      return newCols.map(col => {
        if (col.id === dropTargetCol) {
          const widgets = [...col.widgets];
          widgets.splice(dropIndex, 0, dragging.id);
          return { ...col, widgets };
        }
        return col;
      });
    });
  }
</script>

<DraggableColumns {columns} itemContent={itemContent} on:drop={handleDrop} />
<DevClearCacheButton /> 