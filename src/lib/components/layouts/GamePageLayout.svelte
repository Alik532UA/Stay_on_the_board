<script lang="ts">
    import ReplayViewer from "$lib/components/ReplayViewer.svelte";
    import "$lib/css/components/game-board.css";
    import "$lib/css/components/controls.css";
    import DraggableColumns from "$lib/components/DraggableColumns.svelte";
    import { layoutStore, type WidgetId } from "$lib/stores/layoutStore";
    import { widgetRegistry } from "$lib/config/widgetRegistry"; // <-- Новий імпорт

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
     */
    export let widgetFilter: (widgetId: string) => boolean = () => true;

    /**
     * Кастомна логіка ініціалізації.
     */
    export let initLogic: (() => void) | undefined = undefined;

    onMount(() => {
        if (initLogic) {
            logService.init("[GamePageLayout] Running custom init logic.");
            initLogic();
        } else {
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
        // Використовуємо централізований реєстр
        return widgetRegistry[item.id] || item.id;
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
