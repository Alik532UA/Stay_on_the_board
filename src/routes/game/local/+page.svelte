<script lang="ts">
  // НАВІЩО: Ця сторінка буде відповідати за відображення локальної гри.
  // Зараз вона використовує ті ж віджети, що й гра проти AI, але в майбутньому
  // її вміст може бути змінено (наприклад, інша панель керування).

  import '$lib/css/components/game-board.css';
  import '$lib/css/components/controls.css';
  import DraggableColumns from '$lib/components/DraggableColumns.svelte';
  import { layoutStore, WIDGETS } from '$lib/stores/layoutStore.js';
  import TopRowWidget from '$lib/components/widgets/TopRowWidget.svelte';
  import ScorePanelWidget from '$lib/components/widgets/ScorePanelWidget.svelte';
  import BoardWrapperWidget from '$lib/components/widgets/BoardWrapperWidget.svelte';
  import ControlsPanelWidget from '$lib/components/widgets/ControlsPanelWidget.svelte';
  import { logService } from '$lib/services/logService.js';
  import SettingsExpanderWidget from '$lib/components/widgets/SettingsExpanderWidget.svelte';
  import GameInfoWidget from '$lib/components/widgets/GameInfoWidget.svelte';
  import PlayerTurnIndicator from '$lib/components/widgets/PlayerTurnIndicator.svelte';
  import DevClearCacheButton from '$lib/components/widgets/DevClearCacheButton.svelte';
  import { settingsStore } from '$lib/stores/settingsStore.js';
  import { onMount, onDestroy } from 'svelte';
  import { afterNavigate } from '$app/navigation';
  import { animationStore } from '$lib/stores/animationStore.js';
  import { gameOverStore } from '$lib/stores/gameOverStore';
  import { modalStore } from '$lib/stores/modalStore.js';
  import { gameOrchestrator } from '$lib/gameOrchestrator';
  import { get } from 'svelte/store';
  import { _ } from 'svelte-i18n';
  import { i18nReady } from '$lib/i18n/init.js';
  import { gameState } from '$lib/stores/gameState.js';
  import { localGameStore } from '$lib/stores/localGameStore.js';
  import { LocalGameMode } from '$lib/gameModes/LocalGameMode';
  import { gameStore } from '$lib/stores/gameStore';
  
  // Примітка: onMount та ініціалізація гри тут не потрібні,
  // оскільки вони відбуваються на сторінці /local-setup

  /**
   * Показує модальне вікно завершення гри, якщо це необхідно.
   */
  function showGameOverModalIfNeeded() {
    const gameOverState = get(gameOverStore);
    if (gameOverState.isGameOver && gameOverState.gameResult && gameOverState.gameResult.gameType === 'local') {
      const { reasonKey, reasonValues } = gameOverState.gameResult;
      if (!get(gameStore).mode) {
        gameOrchestrator.initializeGameMode();
      }
      gameOrchestrator.endGame(reasonKey, reasonValues);
    }
  }

  onMount(() => {
    // Ініціалізуємо режим гри та анімації
    gameOrchestrator.setCurrentGameMode('local');
    animationStore.initialize();
  });

  onDestroy(() => {
    // localGameStore.reset(); // Ця логіка більше не потрібна
  });

  afterNavigate(() => {
    // При поверненні з replay, FloatingBackButton вже відновив стан.
    // Для інших випадків (наприклад, оновлення сторінки) може знадобитися
    // логіка відновлення, але поточна реалізація конфліктує.
    // showGameOverModalIfNeeded();
  });


  const widgetMap = {
    [WIDGETS.TOP_ROW]: TopRowWidget,
    [WIDGETS.SCORE_PANEL]: ScorePanelWidget,
    [WIDGETS.BOARD_WRAPPER]: BoardWrapperWidget,
    [WIDGETS.CONTROLS_PANEL]: ControlsPanelWidget,
    [WIDGETS.SETTINGS_EXPANDER]: SettingsExpanderWidget,
    [WIDGETS.GAME_INFO]: GameInfoWidget,
    [WIDGETS.PLAYER_TURN_INDICATOR]: PlayerTurnIndicator
  };

  $: columns = $i18nReady ? $layoutStore.map(col => ({
    id: col.id,
    label: col.id,
    items: col.widgets.map(id => {
      const item: { id: string, label: string, props?: any } = { id, label: id };
      return item;
    })
  })) : [];

  function itemContent(item: {id: string, label: string}) {
    return widgetMap[item.id] || item.id;
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

<DraggableColumns {columns} itemContent={itemContent} on:drop={handleDrop} class_name="game-layout" />
<DevClearCacheButton /> 