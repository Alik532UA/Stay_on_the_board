<script lang="ts">
  // НАВІЩО: Ця сторінка відповідає ТІЛЬКИ за відображення ігрових віджетів
  // у потрібному порядку для режиму "гра на час".
  // Вся спільна логіка (модальні вікна, гарячі клавіші) винесена в layout.
  
  import '$lib/css/components/game-board.css';
  import '$lib/css/components/controls.css';
  import DraggableColumns from '$lib/components/DraggableColumns.svelte';
  import { layoutStore, WIDGETS } from '$lib/stores/layoutStore';
  import TopRowWidget from '$lib/components/widgets/TopRowWidget.svelte';
  import ScorePanelWidget from '$lib/components/widgets/ScorePanelWidget.svelte';
  import BoardWrapperWidget from '$lib/components/widgets/BoardWrapperWidget.svelte';
  import ControlsPanelWidget from '$lib/components/widgets/ControlsPanelWidget.svelte';
  import SettingsExpanderWidget from '$lib/components/widgets/SettingsExpanderWidget.svelte';
  import GameInfoWidget from '$lib/components/widgets/GameInfoWidget.svelte';
  import DevClearCacheButton from '$lib/components/widgets/DevClearCacheButton.svelte';
  import TimerWidget from '$lib/components/widgets/TimerWidget.svelte';
  import { onMount } from 'svelte';
  import { animationService } from '$lib/services/animationService.js';
  import { gameModeService } from '$lib/services/gameModeService';
  import { get } from 'svelte/store';
  import { boardStore } from '$lib/stores/boardStore';
  import { logService } from '$lib/services/logService';

  onMount(() => {
    const boardState = get(boardStore);
    if (!boardState || boardState.moveHistory.length <= 1) {
        logService.init('[TimedGamePage] onMount: No active game found, initializing "timed" mode.');
        gameModeService.initializeGameMode('timed');
    } else {
        logService.init('[TimedGamePage] onMount: Active game found, not re-initializing.');
    }
    animationService.initialize();
  });

  const widgetMap = {
    [WIDGETS.TOP_ROW]: TopRowWidget,
    [WIDGETS.SCORE_PANEL]: ScorePanelWidget,
    [WIDGETS.BOARD_WRAPPER]: BoardWrapperWidget,
    [WIDGETS.CONTROLS_PANEL]: ControlsPanelWidget,
    [WIDGETS.SETTINGS_EXPANDER]: SettingsExpanderWidget,
    [WIDGETS.GAME_INFO]: GameInfoWidget,
    [WIDGETS.TIMER]: TimerWidget,
  };

  $: columns = $layoutStore.map(col => ({
    id: col.id,
    label: col.id,
    items: col.widgets
      .filter(id => id !== WIDGETS.PLAYER_TURN_INDICATOR)
      .map(id => ({ id, label: id }))
  }));

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

