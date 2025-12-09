<script lang="ts">
  import ReplayViewer from "$lib/components/ReplayViewer.svelte";
  import "$lib/css/components/game-board.css";
  import "$lib/css/components/controls.css";
  import DraggableColumns from "$lib/components/DraggableColumns.svelte";
  import { layoutStore, WIDGETS, type WidgetId } from "$lib/stores/layoutStore";
  import TopRowWidget from "$lib/components/widgets/TopRowWidget.svelte";
  import ScorePanelWidget from "$lib/components/widgets/ScorePanelWidget.svelte";
  import BoardWrapperWidget from "$lib/components/widgets/BoardWrapperWidget.svelte";
  import ControlsPanelWidget from "$lib/components/widgets/ControlsPanelWidget.svelte";
  import SettingsExpanderWidget from "$lib/components/widgets/SettingsExpanderWidget.svelte";
  import GameInfoWidget from "$lib/components/widgets/GameInfoWidget.svelte";
  import PlayerTurnIndicator from "$lib/components/widgets/PlayerTurnIndicator.svelte";
  import DevClearCacheButton from "$lib/components/widgets/DevClearCacheButton.svelte";
  import TimerWidget from "$lib/components/widgets/TimerWidget.svelte";
  import GameModeWidget from "$lib/components/widgets/GameModeWidget.svelte";
  import { onMount, onDestroy } from "svelte";
  import { animationService } from "$lib/services/animationService.js";
  import { gameModeService } from "$lib/services/gameModeService";
  import { get } from "svelte/store";
  import { boardStore } from "$lib/stores/boardStore";
  import { logService } from "$lib/services/logService";
  import { _ } from "svelte-i18n";
  import { i18nReady } from "$lib/i18n/init.js";

  import { replayStore } from "$lib/stores/replayStore";
  import { gameSettingsStore } from "$lib/stores/gameSettingsStore";

  onMount(() => {
    const boardState = get(boardStore);
    if (!boardState || boardState.moveHistory.length <= 1) {
      const currentSettings = get(gameSettingsStore);
      const preservedPresets = ["observer", "beginner", "experienced", "pro"];

      if (
        currentSettings.gameMode &&
        preservedPresets.includes(currentSettings.gameMode)
      ) {
        logService.init(
          `[LocalGamePage] onMount: Preserving existing preset "${currentSettings.gameMode}" for local game.`,
        );
        // Initialize 'local' mode logic, but DO NOT apply default 'local' settings
        // This keeps the settings selected in Local Setup (Observer/Robber/etc.)
        gameModeService.initializeGameMode("local", false);
      } else {
        logService.init(
          '[LocalGamePage] onMount: No specific preset found, initializing default "local" mode.',
        );
        gameModeService.initializeGameMode("local");
      }
    } else {
      logService.init(
        "[LocalGamePage] onMount: Active game found, not re-initializing.",
      );
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
    [WIDGETS.PLAYER_TURN_INDICATOR]: PlayerTurnIndicator,
    [WIDGETS.TIMER]: TimerWidget,
    [WIDGETS.GAME_MODE]: GameModeWidget,
  };

  $: columns = $i18nReady
    ? get(layoutStore).map((col) => ({
        id: col.id,
        label: col.id,
        items: col.widgets.map((id) => {
          const item: { id: string; label: string; props?: any } = {
            id,
            label: id,
          };
          return item;
        }),
      }))
    : [];

  function itemContent(item: { id: string; label: string }) {
    return widgetMap[item.id as keyof typeof widgetMap] || item.id;
  }

  function handleDrop(
    e: CustomEvent<{
      dragging: { id: string; label: string };
      dragSourceCol: string;
      dropTargetCol: string;
      dropIndex: number;
    }>,
  ) {
    const { dragging, dragSourceCol, dropTargetCol, dropIndex } = e.detail;
    layoutStore.update((cols) => {
      let newCols = cols.map((col) => ({
        ...col,
        widgets: col.widgets.filter((id) => id !== dragging.id),
      }));
      return newCols.map((col) => {
        if (col.id === dropTargetCol) {
          const widgets = [...col.widgets];
          widgets.splice(dropIndex, 0, dragging.id as WidgetId);
          return { ...col, widgets };
        }
        return col;
      });
    });
  }
</script>

{#if get(replayStore).isReplayMode}
  <ReplayViewer
    moveHistory={get(replayStore).moveHistory}
    boardSize={get(replayStore).boardSize}
    autoPlayForward={true}
  />
{:else}
  <DraggableColumns
    {columns}
    {itemContent}
    on:drop={handleDrop}
    class_name="game-layout"
  />
  <DevClearCacheButton />
{/if}
