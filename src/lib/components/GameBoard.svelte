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
  import { setDirection, setDistance, endGame, resetGame, startReplay, continueAfterNoMoves, finalizeGameWithBonus, setBoardSize } from '$lib/stores/gameActions.js';
  import * as core from '$lib/gameCore.js';
  import { confirmPlayerMove, claimNoMoves } from '$lib/gameOrchestrator.js';
  import { settingsStore } from '$lib/stores/settingsStore.js';
  import { modalStore } from '$lib/stores/modalStore.js';
  import { get } from 'svelte/store';
  import { onMount } from 'svelte';
  import { _ } from 'svelte-i18n';
  import { goto } from '$app/navigation';
  import { base } from '$app/paths';
  import { gameState } from '$lib/stores/gameState.js';
  import { animationStore } from '$lib/stores/animationStore.js';

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

  $: columns = $layoutStore.map(col => ({
    id: col.id,
    label: col.id,
    items: col.widgets.map(id => ({ id, label: id }))
  }));

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
            content: { reason: $t(reasonKey || ''), scoreDetails: $gameState },
            buttons: [
              { textKey: 'modal.continueGame', customClass: 'green-btn', isHot: true, onClick: continueAfterNoMoves },
              { 
                text: $t('modal.finishGameWithBonus', { values: { bonus: $gameState.boardSize } }), 
                onClick: () => finalizeGameWithBonus('modal.gameOverReasonBonus') 
              },
              { textKey: 'modal.watchReplay', customClass: 'blue-btn', onClick: startReplay }
            ],
            closable: false
          };
          break;
        
        case 'modal.errorContent':
          modalConfig = {
            titleKey: 'modal.errorTitle',
            content: { reason: $t(reasonKey || '', { values: reasonValues }), scoreDetails: $gameState },
            buttons: [
              { textKey: 'modal.playAgain', primary: true, onClick: () => { resetGame(); modalStore.closeModal(); }, isHot: true },
              { textKey: 'modal.watchReplay', customClass: 'blue-btn', onClick: startReplay }
            ],
            closable: false
          };
          break;

        case 'modal.computerNoMovesContent':
          modalConfig = {
            titleKey: 'modal.computerNoMovesTitle',
            content: { reason: $t('modal.computerNoMovesContent'), scoreDetails: $gameState },
            buttons: [
              { textKey: 'modal.continueGame', customClass: 'green-btn', isHot: true, onClick: continueAfterNoMoves },
              { 
                text: $t('modal.finishGameWithBonus', { values: { bonus: $gameState.boardSize } }), 
                onClick: () => finalizeGameWithBonus('modal.gameOverReasonBonus') 
              },
              { textKey: 'modal.watchReplay', customClass: 'blue-btn', onClick: startReplay }
            ],
            closable: false
          };
          break;

        default:
          modalConfig = {
            titleKey: 'modal.gameOverTitle',
            content: { reason: $t(reasonKey || '', { values: reasonValues }), scoreDetails: $gameState },
            buttons: [
              { textKey: 'modal.playAgain', primary: true, onClick: () => { resetGame(); modalStore.closeModal(); }, isHot: true },
              { textKey: 'modal.watchReplay', customClass: 'blue-btn', onClick: startReplay }
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

  function changeBoardSize(increment: number) {
    const currentSize = get(gameState).boardSize;
    const newSize = currentSize + increment;
    if (newSize >= 2 && newSize <= 9) {
      setBoardSize(newSize);
    }
  }

  /**
   * @param {string} action
   */
  function executeAction(action: string) {
    switch (action) {
      case 'increase-board':
        changeBoardSize(1);
        break;
      case 'decrease-board':
        changeBoardSize(-1);
        break;
      case 'toggle-block-mode':
        settingsStore.toggleBlockMode();
        break;
      case 'toggle-board':
        settingsStore.toggleShowBoard();
        break;
    }
    switch (action) {
      case 'up-left': setDirection('up-left'); break;
      case 'up': setDirection('up'); break;
      case 'up-right': setDirection('up-right'); break;
      case 'left': setDirection('left'); break;
      case 'right': setDirection('right'); break;
      case 'down-left': setDirection('down-left'); break;
      case 'down': setDirection('down'); break;
      case 'down-right': setDirection('down-right'); break;
      case 'confirm': confirmPlayerMove(); break;
      case 'no-moves': claimNoMoves(); break;
      case 'distance-1': setDistance(1); break;
      case 'distance-2': setDistance(2); break;
      case 'distance-3': setDistance(3); break;
      case 'distance-4': setDistance(4); break;
      case 'distance-5': setDistance(5); break;
      case 'distance-6': setDistance(6); break;
      case 'distance-7': setDistance(7); break;
      case 'distance-8': setDistance(8); break;
    }
  }

  function handleHotkey(e: KeyboardEvent) {
    console.log('[HOTKEY]', { key: e.key, code: e.code, keyCode: e.keyCode });
    if (e.target && (e.target as HTMLElement).tagName !== 'BODY') return;
    
    const key = e.code;
    const currentSettings = get(settingsStore);
    const keybindings = currentSettings.keybindings;
    const resolutions = currentSettings.keyConflictResolution;

    // Додаю явну підтримку '=' та '-' для різних розкладок і браузерів
    if (e.key === '=' || e.key === '+' || e.code === 'Equal') {
      executeAction('increase-board');
      return;
    }
    if (e.key === '-' || e.key === '_' || e.code === 'Minus') {
      executeAction('decrease-board');
      return;
    }

    const matchingActions = Object.entries(keybindings)
      .filter(([, keys]) => keys.includes(key))
      .map(([action]) => action);

    if (matchingActions.length === 0) return;

    if (matchingActions.length === 1) {
      executeAction(matchingActions[0]);
      return;
    }

    // Конфлікт!
    if (resolutions[key]) {
      executeAction(resolutions[key]);
      return;
    }

    // Якщо вирішення немає, показуємо модальне вікно
    const $t = get(_);
    if (key === 'KeyS' && matchingActions.length > 1) {
      // Спеціальна логіка для KeyS/І: пропонуємо вибір і після вибору перепризначаємо KeyS лише на одну дію
      modalStore.showModal({
        titleKey: 'modal.keyConflictTitle',
        content: { key: key, actions: matchingActions },
        buttons: matchingActions.map(action => ({
          text: $t(`controlsPage.actions.${action}`),
          onClick: () => {
            // Видаляємо KeyS з усіх дій
            const newKeybindings = { ...keybindings };
            Object.keys(newKeybindings).forEach(act => {
              newKeybindings[act] = (newKeybindings[act] || []).filter(k => k !== 'KeyS');
            });
            // Додаємо KeyS лише до вибраної дії
            newKeybindings[action] = [...(newKeybindings[action] || []), 'KeyS'];
            settingsStore.updateSettings({ keybindings: newKeybindings });
            executeAction(action);
            modalStore.closeModal();
          }
        }))
      });
      return;
    }
    modalStore.showModal({
      titleKey: 'modal.keyConflictTitle',
      content: { key: key, actions: matchingActions },
      buttons: matchingActions.map(action => ({
        text: $t(`controlsPage.actions.${action}`),
        onClick: () => {
          settingsStore.resolveKeyConflict(key, action);
          executeAction(action);
          modalStore.closeModal();
        }
      }))
    });
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
    padding-bottom: 24px;
  }
</style> 