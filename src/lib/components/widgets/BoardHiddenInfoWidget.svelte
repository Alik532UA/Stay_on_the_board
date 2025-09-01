<script lang="ts">
  import { modalStore } from '$lib/stores/modalStore';
  import BoardHiddenExplanationModal from '../modals/BoardHiddenExplanationModal.svelte';
  import { uiStateStore } from '$lib/stores/uiStateStore';
  import { _ } from 'svelte-i18n';

  function showExplanation() {
    modalStore.showModal({
      component: BoardHiddenExplanationModal,
      titleKey: 'modal.boardHiddenExplanationTitle',
      buttons: [{ textKey: 'modal.ok', primary: true, isHot: true }],
    });
  }

  function dismissWidget() {
    uiStateStore.update(s => ({ ...s, showBoardHiddenInfo: false }));
  }
</script>

<div class="hidden-board-info">
  <button class="btn" on:click={showExplanation}>{$_('newWidget.whyBoardHidden')}</button>
  <button class="btn" on:click={dismissWidget}>{$_('newWidget.iKnowWhy')}</button>
</div>

<style>
  .hidden-board-info {
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
  .btn {
    width: 100%;
    padding: 0.8rem;
    font-size: 1rem;
    background: var(--control-bg);
    color: var(--text-primary);
    border: 1px solid var(--border-color);
    border-radius: var(--button-border-radius);
    cursor: pointer;
  }
  .btn:hover {
    background: var(--control-selected);
  }
</style>