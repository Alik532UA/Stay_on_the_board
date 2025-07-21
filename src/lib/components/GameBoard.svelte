<script lang="ts">
  import '../css/components/game-board.css';
  import '../css/components/controls.css';
  import DraggableColumns from './DraggableColumns.svelte';
  import Modal from '$lib/components/Modal.svelte';
  import VoiceSettingsModal from '$lib/components/VoiceSettingsModal.svelte';
  import { uiState, closeVoiceSettingsModal } from '$lib/stores/uiStore.js';
  import { layoutStore, WIDGETS } from '$lib/stores/layoutStore.js';
  import TopRowWidget from './widgets/TopRowWidget.svelte';
  import ScorePanelWidget from './widgets/ScorePanelWidget.svelte';
  import BoardWrapperWidget from './widgets/BoardWrapperWidget.svelte';
  import ControlsPanelWidget from './widgets/ControlsPanelWidget.svelte';
  import SettingsExpanderWidget from './widgets/SettingsExpanderWidget.svelte';
  import { setDirection, setDistance } from '$lib/stores/gameStore.js';
  import { confirmPlayerMove, claimNoMoves } from '$lib/gameOrchestrator.js';
  import { settingsStore } from '$lib/stores/settingsStore.js';
  import { get } from 'svelte/store';
  import { onMount } from 'svelte';

  onMount(() => {
    settingsStore.init();
  });

  const widgetMap = {
    [WIDGETS.TOP_ROW]: TopRowWidget,
    [WIDGETS.SCORE_PANEL]: ScorePanelWidget,
    [WIDGETS.BOARD_WRAPPER]: BoardWrapperWidget,
    [WIDGETS.CONTROLS_PANEL]: ControlsPanelWidget,
    [WIDGETS.SETTINGS_EXPANDER]: SettingsExpanderWidget,
  };

  // Формуємо дані для DraggableColumns
  $: columns = $layoutStore.map(col => ({
    id: col.id,
    label: col.id,
    items: col.widgets.map(id => ({ id, label: id }))
  }));

  function itemContent(item: {id: string, label: string}) {
    const Comp = widgetMap[item.id];
    if (Comp) return Comp;
    return item.id;
  }

  function handleDrop(e: CustomEvent<{dragging: {id: string, label: string}, dragSourceCol: string, dropTargetCol: string, dropIndex: number}>) {
    const { dragging, dragSourceCol, dropTargetCol, dropIndex } = e.detail;
    layoutStore.update(cols => {
      // Видаляємо з попередньої колонки
      let newCols = cols.map(col => ({
        ...col,
        widgets: col.widgets.filter(id => id !== dragging.id)
      }));
      // Додаємо у нову колонку
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

  function handleHotkey(e: KeyboardEvent) {
    if (e.target && (e.target as HTMLElement).tagName === 'INPUT') return;
    const key = e.code;
    const keybindings = get(settingsStore).keybindings;
    // Напрямки
    if (keybindings['up-left']?.includes(key)) return setDirection('up-left');
    if (keybindings['up']?.includes(key)) return setDirection('up');
    if (keybindings['up-right']?.includes(key)) return setDirection('up-right');
    if (keybindings['left']?.includes(key)) return setDirection('left');
    if (keybindings['right']?.includes(key)) return setDirection('right');
    if (keybindings['down-left']?.includes(key)) return setDirection('down-left');
    if (keybindings['down']?.includes(key)) return setDirection('down');
    if (keybindings['down-right']?.includes(key)) return setDirection('down-right');
    // Відстані
    for (let i = 1; i <= 8; i++) {
      if (keybindings[`distance-${i}`]?.includes(key)) return setDistance(i);
    }
    // Підтвердження ходу
    if (keybindings['confirm']?.includes(key)) return confirmPlayerMove();
    // Немає ходів
    if (keybindings['no-moves']?.includes(key)) return claimNoMoves();
    // TODO: Додати інші дії (toggle-block-mode, toggle-board, increase-board, decrease-board, toggle-speech) за потреби
  }
</script>

<div class="game-board-container">
  <DraggableColumns {columns} itemContent={itemContent} on:drop={handleDrop} />
</div>

<Modal />
{#if $uiState.isVoiceSettingsModalOpen}
  <VoiceSettingsModal close={closeVoiceSettingsModal} />
{/if}

<svelte:window on:keydown={handleHotkey} />

<style>
  .game-board-container {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
  }
</style> 