<script lang="ts">
    import ReplayViewer from "$lib/components/ReplayViewer.svelte";
    import "$lib/css/components/game-board.css";
    import "$lib/css/components/controls.css";
    import DraggableColumns from "$lib/components/DraggableColumns.svelte";
    import {
        layoutStore,
        WIDGETS,
        type WidgetId,
    } from "$lib/stores/layoutStore";

    // Widgets
    import TopRowWidget from "$lib/components/widgets/TopRowWidget.svelte";
    import ScorePanelWidget from "$lib/components/widgets/ScorePanelWidget.svelte";
    import BoardWrapperWidget from "$lib/components/widgets/BoardWrapperWidget.svelte";
    import ControlsPanelWidget from "$lib/components/widgets/ControlsPanelWidget.svelte";
    import SettingsExpanderWidget from "$lib/components/widgets/SettingsExpanderWidget.svelte";
    import GameInfoWidget from "$lib/components/widgets/GameInfoWidget.svelte";
    import PlayerTurnIndicator from "$lib/components/widgets/PlayerTurnIndicator.svelte";
    import TimerWidget from "$lib/components/widgets/TimerWidget.svelte";
    import GameModeWidget from "$lib/components/widgets/GameModeWidget.svelte";

    import { onMount } from "svelte";
    import { animationService } from "$lib/services/animationService.js";
    import { get } from "svelte/store";
    import { boardStore } from "$lib/stores/boardStore";
    import { replayStore } from "$lib/stores/replayStore";
    import { i18nReady } from "$lib/i18n/init.js";
    import { logService } from "$lib/services/logService";

    /**
     * Функція фільтрації віджетів.
     * Дозволяє кожній сторінці (режиму) вирішувати, які віджети показувати.
     * Наприклад, Online режим може приховати налаштування.
     */
    export let widgetFilter: (widgetId: string) => boolean = () => true;

    /**
     * Кастомна логіка ініціалізації.
     * Якщо передана, викликається замість стандартної перевірки boardStore.
     * Це критично для Online режиму (підключення) та Local (збереження пресетів).
     */
    export let initLogic: (() => void) | undefined = undefined;

    // Централізована мапа віджетів.
    // Це полегшує додавання нових віджетів (наприклад, OnlineChatWidget) у майбутньому.
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

    onMount(() => {
        if (initLogic) {
            logService.init("[GamePageLayout] Running custom init logic.");
            initLogic();
        } else {
            // Стандартна логіка: якщо гри немає, нічого не робимо (або можна додати дефолтний старт)
            // Зазвичай initLogic передається завжди, але це fallback.
            const boardState = get(boardStore);
            if (!boardState || boardState.moveHistory.length <= 1) {
                logService.init(
                    "[GamePageLayout] No active game found and no custom init logic provided.",
                );
            }
        }
        animationService.initialize();
    });

    // Реактивне формування колонок на основі стору та фільтру
    $: columns = $i18nReady
        ? $layoutStore.map((col) => ({
              id: col.id,
              label: col.id,
              items: col.widgets.filter(widgetFilter).map((id) => ({
                  id,
                  label: id,
              })),
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
{/if}
