<script lang="ts">
  import { replayStore } from '$lib/stores/replayStore.js';
  import ReplayViewer from '$lib/components/ReplayViewer.svelte';
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
  import { calculateFinalScore } from '$lib/services/scoreService.js';
  import { animationService } from '$lib/services/animationService.js';
  import { gameState } from '$lib/stores/gameState.js';
  import { modalStore } from '$lib/stores/modalStore.js';
  import { gameOverStore } from '$lib/stores/gameOverStore';
  import { gameModeService } from '$lib/services/gameModeService';
  import { get } from 'svelte/store';
  import { _ } from 'svelte-i18n';
  import { gameStore } from '$lib/stores/gameStore';

  onMount(() => {
    gameModeService.setCurrentGameMode('vs-computer');
    animationService.initialize();
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