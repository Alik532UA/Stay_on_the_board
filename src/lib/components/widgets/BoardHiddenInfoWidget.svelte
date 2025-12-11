<script lang="ts">
  import { modalStore } from '$lib/stores/modalStore';
  import BoardHiddenExplanationModal from '../modals/BoardHiddenExplanationModal.svelte';
  import { uiStateStore } from '$lib/stores/uiStateStore';
  import { _ } from 'svelte-i18n';

  function showExplanation() {
    modalStore.showModal({
      component: BoardHiddenExplanationModal,
      titleKey: 'modal.boardHiddenExplanationTitle',
      dataTestId: 'board-hidden-explanation-modal',
      buttons: [{ textKey: 'modal.ok', primary: true, isHot: true }],
    });
  }

  function dismissWidget() {
    uiStateStore.update(s => ({ ...s, showBoardHiddenInfo: false }));
  }
</script>

<div class="hidden-board-info">
  <button class="settings-expander__row-btn" on:click={showExplanation} data-testid="why-board-hidden-btn">{$_('newWidget.whyBoardHidden')}</button>
  <button class="settings-expander__row-btn" on:click={dismissWidget} data-testid="i-know-why-btn">{$_('newWidget.iKnowWhy')}</button>
</div>

<style>
  .hidden-board-info {
    --button-height: 36px;
    --button-padding: 4px 8px;
    --button-border-width: 1.5px;
    --button-border-radius: 8px;
    --button-font-size: 1em;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 1rem;
    background: var(--bg-secondary);
    border-radius: var(--unified-border-radius);
    border: var(--unified-border);
    box-shadow: var(--dynamic-widget-shadow) var(--current-player-shadow-color);
    align-items: center;
  }
  .settings-expander__row-btn {
    background: var(--control-bg);
    color: var(--text-primary);
    border: var(--button-border-width) solid #888;
    border-radius: var(--button-border-radius);
    padding: 0 calc(var(--button-height) * 0.3);
    height: var(--button-height);
    min-height: var(--button-height);
    box-sizing: border-box;
    font-size: calc(var(--button-height) * 0.4);
    font-weight: 600;
    cursor: pointer;
    transition: background 0.18s, color 0.18s, border 0.18s;
    display: flex;
    align-items: center;
    justify-content: center;
    white-space: nowrap;
    width: 100%;
  }
  .settings-expander__row-btn:hover, .settings-expander__row-btn:focus {
    border-color: var(--control-selected);
    color: var(--text-primary);
    outline: none;
  }
  
</style>
