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
  import { afterNavigate } from '$app/navigation';
  import { resetGame, calculateFinalScore } from '$lib/services/gameLogicService.js';
  import { animationStore } from '$lib/stores/animationStore.js';
  import { gameState } from '$lib/stores/gameState.js';
  import { modalStore } from '$lib/stores/modalStore.js';
  import { gameOverStore } from '$lib/stores/gameOverStore';
  import { gameOrchestrator } from '$lib/gameOrchestrator';
  import { get } from 'svelte/store';
  import { _ } from 'svelte-i18n';
  import { gameStore } from '$lib/stores/gameStore';

  onMount(() => {
    // Залишаємо тільки первинну ініціалізацію гри, якщо це не відновлення
    const isRestoring = sessionStorage.getItem('replayGameOverState') !== null;
    if (!isRestoring) {
      resetGame({}, get(gameState));
    }
    gameOrchestrator.setCurrentGameMode('vs-computer');
    animationStore.initialize();
  });

  afterNavigate(() => {
    const savedGameOverState = sessionStorage.getItem('replayGameOverState');
    if (savedGameOverState) {
      try {
        const parsedState = JSON.parse(savedGameOverState);
        // @ts-ignore
        gameOverStore.restoreState(parsedState);
        sessionStorage.removeItem('replayGameOverState');

        const savedGameState = sessionStorage.getItem('replayGameState');
        if (savedGameState) {
          gameState.set(JSON.parse(savedGameState));
          sessionStorage.removeItem('replayGameState');
        }

        const gameOverState = get(gameOverStore);
        if (gameOverState.isGameOver && gameOverState.gameResult) {
          const { reasonKey, reasonValues } = gameOverState.gameResult;
          // Ініціалізуємо режим гри, якщо його ще немає
          const activeGameMode = get(gameStore).mode;
          if (!activeGameMode) {
            gameOrchestrator.initializeGameMode();
          }
          // Відновлюємо модальне вікно "немає ходів"
          if (reasonKey === 'modal.computerNoMovesContent' || reasonKey === 'modal.playerNoMovesContent') {
            const playerType = reasonKey === 'modal.computerNoMovesContent' ? 'computer' : 'human';
            activeGameMode?.handleNoMoves(playerType);
          } else {
            gameOrchestrator.endGame(reasonKey, reasonValues);
          }
        }
      } catch (e) {
        console.error('Не вдалося відновити gameOverStore з sessionStorage', e);
      }
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
    items: col.widgets
      .filter(id => id !== WIDGETS.PLAYER_TURN_INDICATOR)
      .map(id => ({ id, label: id }))
  }));

  // НАВІЩО: Логіка модальних вікон залишається тут, оскільки вона специфічна
  // для ігрового процесу, а не для layout
  // Ця логіка тепер обробляється в `endGame` відповідного режиму гри

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