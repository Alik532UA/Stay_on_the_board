<script lang="ts">
  import { gameState } from '$lib/stores/gameState.js';
  import { gameOrchestrator } from '$lib/gameOrchestrator.js';
  import { modalStore } from '$lib/stores/modalStore.js';
  import { _ } from 'svelte-i18n';
  import { openVoiceSettingsModal } from '$lib/stores/uiStore.js';
  import { settingsStore } from '$lib/stores/settingsStore.js';
  import SvgIcons from '../SvgIcons.svelte';
  import { get } from 'svelte/store';
  import { onMount, tick } from 'svelte';
  import { columnStyleMode } from '$lib/stores/columnStyleStore.js';
  import VoiceSettingsModalWrapper from '$lib/components/VoiceSettingsModalWrapper.svelte';
  import { slide } from 'svelte/transition';
  import { layoutStore } from '$lib/stores/layoutStore.js';
  let expanderRef: HTMLDetailsElement;
  let summaryRef: HTMLElement;
  let isOpen = true;
  let contentRef: HTMLDivElement;
  let contentHeight = 0;
  async function toggleExpander() {
    isOpen = !isOpen;
    await tick();
    if (contentRef) {
      contentHeight = contentRef.scrollHeight;
    }
  }
  let isHorizontalLayout = true;

  function updateLayoutMode() {
    isHorizontalLayout = window.innerWidth > 1270;
  }

  onMount(() => {
    if (contentRef) {
      contentHeight = contentRef.scrollHeight;
    }
    updateLayoutMode();
    window.addEventListener('resize', updateLayoutMode);
    return () => window.removeEventListener('resize', updateLayoutMode);
  });

  $: showMoves = $settingsStore.showMoves;
  $: showBoard = $settingsStore.showBoard;
  $: speechEnabled = $settingsStore.speechEnabled;

  /**
   * @param {number} increment
   */
  function changeBoardSize(increment: number) {
    const currentSize = get(gameState).boardSize;
    const newSize = currentSize + increment;
    if (newSize >= 2 && newSize <= 9) {
      gameOrchestrator.setBoardSize(newSize);
    }
  }

  /**
   * @param {number} count
   */
  function selectBlockCount(count: number) {
    // Видаляю localStorage.hasSeenExpertModeWarning
    if (count > 0 && $settingsStore.showGameModeModal) {
      modalStore.showModal({
        titleKey: 'modal.expertModeTitle',
        contentKey: 'modal.expertModeContent',
        buttons: [
          { textKey: 'modal.expertModeConfirm', primary: true, isHot: true, onClick: () => { settingsStore.updateSettings({ blockOnVisitCount: count }); modalStore.closeModal(); } },
          { textKey: 'modal.expertModeCancel', onClick: modalStore.closeModal }
        ]
      });
    } else {
      settingsStore.updateSettings({ blockOnVisitCount: count });
    }
  }

  /**
   * @param {Event} event
   */
  function handleToggleAutoHideBoard(event: Event) {
    settingsStore.toggleAutoHideBoard();
  }
</script>

<style>
  .settings-expander {
    width: 100%;
    background: linear-gradient(120deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.04) 100%);
    border-radius: 16px;
    border: 1.5px solid rgba(255,255,255,0.18);
    box-shadow: 0 8px 32px 0 rgba(0,0,0,0.13);
    transition: background 0.25s, box-shadow 0.25s;
    margin-bottom: 16px;
  }
  .settings-expander:hover {
    background: linear-gradient(120deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.08) 100%);
    box-shadow: 0 12px 40px 0 rgba(0,0,0,0.18);
  }
  .settings-summary {
    position: relative;
    padding: 16px 20px;
    font-weight: 700;
    font-size: 1.18em;
    letter-spacing: 0.02em;
    color: #fff;
    background: none;
    border-radius: 16px;
    cursor: pointer;
    user-select: none;
    transition: background 0.2s, margin-bottom 0.4s ease-out;
    display: flex;
    align-items: center;
    min-height: 44px;
    outline: none;
  }
  .settings-summary:focus {
    outline: none;
    box-shadow: none;
  }
  .settings-expander.open > .settings-summary {
    border-radius: 16px 16px 0 0;
  }
  .expander-arrow {
    position: absolute;
    right: 16px;
    top: 50%;
    transform: translateY(-50%) rotate(0deg);
    transition: transform 0.4s cubic-bezier(0.4,0,0.2,1);
  }
  .settings-expander.open .expander-arrow {
    transform: translateY(-50%) rotate(180deg);
  }
  .expander-content {
    overflow: hidden;
    max-height: 0;
    opacity: 0;
    transition: max-height 0.5s cubic-bezier(0.4,0,0.2,1), opacity 0.3s cubic-bezier(0.4,0,0.2,1), padding 0.5s cubic-bezier(0.4,0,0.2,1);
    padding: 0 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .settings-expander.open > .expander-content {
    max-height: 1200px;
    opacity: 1;
    padding: 0 16px 16px 16px;
  }
  .setting-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 1.08em;
    padding: 0;
    min-height: 40px;
    gap: 12px;
  }
  .board-size-control {
    gap: 18px;
  }
  .size-adjuster {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .adjust-btn {
    background: var(--control-bg);
    color: var(--text-primary);
    border: 1.5px solid #888;
    border-radius: 8px;
    width: 40px;
    height: 40px;
    font-size: 1.2em;
    font-weight: bold;
    cursor: pointer;
    transition: background 0.18s, color 0.18s, border 0.18s;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
  }
  .adjust-btn:hover, .adjust-btn:focus {
    background: var(--control-selected);
    color: var(--control-selected-text);
    border-color: var(--control-selected);
    outline: none;
  }
  .count-selector-btn {
    background: var(--control-bg);
    color: var(--text-primary);
    border: 1.5px solid #888;
    border-radius: 8px;
    width: 40px;
    height: 40px;
    font-size: 1em;
    font-weight: bold;
    cursor: pointer;
    transition: background 0.18s, color 0.18s, border 0.18s;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
  }
  .count-selector-btn.active, .count-selector-btn:hover, .count-selector-btn:focus {
    background: var(--control-selected);
    color: var(--control-selected-text);
    border-color: var(--control-selected);
    outline: none;
  }
  .menu-style-btn, .settings-icon-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    aspect-ratio: 1/1;
    border-radius: 8px;
    border: 1.5px solid #888;
    background: none;
    cursor: pointer;
    padding: 0;
    box-sizing: border-box;
    transition: background 0.18s, border 0.18s;
  }
  .menu-style-btn.active, .menu-style-btn:focus, .menu-style-btn:hover,
  .settings-icon-btn:focus, .settings-icon-btn:hover {
    background: var(--control-selected);
    border-color: var(--control-selected);
    outline: none;
  }
  .ios-switch-label {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 1.08em;
    min-height: 40px;
    gap: 12px;
  }
  .switch-content-wrapper {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .ios-switch {
    position: relative;
    width: 44px;
    height: 24px;
    min-width: 44px;
    min-height: 24px;
  }
  .ios-switch input { display: none; }
  .slider {
    position: absolute;
    cursor: pointer;
    inset: 0;
    background: var(--toggle-off-bg);
    border-radius: 12px;
    transition: background 0.2s;
  }
  .slider:before {
    content: '';
    position: absolute;
    left: 2px;
    top: 2px;
    width: 20px;
    height: 20px;
    background: #fff;
    border-radius: 50%;
    transition: transform 0.2s;
  }
  input:checked + .slider { background: var(--control-selected); }
  input:checked + .slider:before { transform: translateX(20px); }
  .ios-switch-label.disabled {
    opacity: 0.5;
    cursor: not-allowed;
    pointer-events: none;
  }
  .block-mode-options {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 0 8px 50px;
    gap: 10px;
  }
  .game-mode-row {
    display: flex;
    gap: 14px;
    margin-bottom: 0;
    justify-content: flex-start;
    align-items: center;
    margin-top: 8px;
  }
  .game-mode-btn {
    background: var(--control-bg);
    color: var(--text-primary);
    border: 1.5px solid #888;
    border-radius: 8px;
    padding: 0 18px;
    height: 40px;
    min-width: 40px;
    font-size: 1em;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.18s, color 0.18s, border 0.18s;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .game-mode-btn:hover, .game-mode-btn:focus {
    background: var(--control-selected);
    color: var(--control-selected-text);
    border-color: var(--control-selected);
    outline: none;
  }
  .game-mode-btn.active {
    background: var(--control-selected);
    color: var(--control-selected-text);
    border-color: var(--control-selected);
    box-shadow: 0 0 8px var(--control-selected, #4caf50);
    transform: scale(1.07);
    z-index: 1;
  }
  .game-mode-divider {
    border: none;
    border-top: 1.5px solid var(--border-color, #444);
    margin: 0;
    width: 100%;
  }
  .options-values {
    display: flex;
    flex-direction: row;
    gap: 8px;
  }
</style>

<div class="settings-expander {isOpen ? 'open' : ''}">
  <div class="settings-summary" role="button" aria-label={$_('gameControls.settings')} on:click={toggleExpander} on:keydown={(e) => (e.key === 'Enter' || e.key === ' ') && toggleExpander()} bind:this={summaryRef} tabindex="0">
    {$_('gameControls.settings')}
    <span class="expander-arrow" aria-hidden="true"><svg viewBox="0 0 24 24" width="24" height="24"><polyline points="6 9 12 15 18 9" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
  </div>
  <div class="expander-content" bind:this={contentRef} style="max-height: {isOpen ? contentRef ? contentRef.scrollHeight + 'px' : '1200px' : '0px'}; opacity: {isOpen ? 1 : 0};">
    <!-- Весь існуючий контент toggles переносимо сюди -->
    <div class="game-mode-row">
      <button class="game-mode-btn" class:active={$settingsStore.gameMode === 'beginner'} on:click={() => settingsStore.applyGameModePreset('beginner')}>{$_('gameModes.beginner')}</button>
      <button class="game-mode-btn" class:active={$settingsStore.gameMode === 'experienced'} on:click={() => settingsStore.applyGameModePreset('experienced')}>{$_('gameModes.experienced')}</button>
      <button class="game-mode-btn" class:active={$settingsStore.gameMode === 'pro'} on:click={() => settingsStore.applyGameModePreset('pro')}>{$_('gameModes.pro')}</button>
    </div>
    <hr class="game-mode-divider" />
    <div class="setting-item board-size-control">
      <span>{$_('settings.boardSize')}</span>
      <div class="size-adjuster">
        <button 
          class="adjust-btn" 
          on:click={() => changeBoardSize(-1)}
          disabled={$gameState.boardSize <= 2}
        >-</button>
        <span class="current-size">{$gameState.boardSize}x{$gameState.boardSize}</span>
        <button 
          class="adjust-btn" 
          on:click={() => changeBoardSize(1)}
          disabled={$gameState.boardSize >= 9}
        >+</button>
      </div>
    </div>
    <label class="ios-switch-label">
      <div class="switch-content-wrapper">
        <div class="ios-switch">
          <input type="checkbox" checked={$settingsStore.showBoard} on:change={() => settingsStore.toggleShowBoard()} />
          <span class="slider"></span>
        </div>
        <span>{$_('gameControls.showBoard')}</span>
      </div>
    </label>
    <label class="ios-switch-label" class:disabled={!$settingsStore.showBoard}>
      <div class="switch-content-wrapper">
        <div class="ios-switch">
          <input type="checkbox" checked={$settingsStore.showQueen} on:change={settingsStore.toggleShowQueen} disabled={!$settingsStore.showBoard} />
          <span class="slider"></span>
        </div>
        <span>{$_('gameControls.showQueen')}</span>
      </div>
    </label>
    <label class="ios-switch-label" class:disabled={!$settingsStore.showBoard || !$settingsStore.showQueen}>
      <div class="switch-content-wrapper">
        <div class="ios-switch">
          <input type="checkbox" checked={$settingsStore.showMoves} on:change={settingsStore.toggleShowMoves} disabled={!$settingsStore.showBoard || !$settingsStore.showQueen} />
          <span class="slider"></span>
        </div>
        <span>{$_('gameControls.showMoves')}</span>
      </div>
    </label>
    <label class="ios-switch-label">
      <div class="switch-content-wrapper">
        <div class="ios-switch">
          <input 
            type="checkbox" 
            checked={$settingsStore.blockModeEnabled} 
            on:change={settingsStore.toggleBlockMode} 
          />
          <span class="slider"></span>
        </div>
        <span>{$_('gameControls.blockMode')}</span>
      </div>
    </label>
    {#if $settingsStore.blockModeEnabled}
      <div class="block-mode-options">
        <span class="options-label">{$_('gameControls.blockAfter')}</span>
        <div class="options-values" role="radiogroup">
          {#each [0, 1, 2, 3] as count}
            <button class="count-selector-btn" class:active={$settingsStore.blockOnVisitCount === count} on:click={() => selectBlockCount(count)}>{count}</button>
          {/each}
        </div>
      </div>
    {/if}
    <label class="ios-switch-label">
      <div class="switch-content-wrapper"><div class="ios-switch"><input type="checkbox" bind:checked={speechEnabled} on:change={() => settingsStore.toggleSpeech()} /><span class="slider"></span></div><span>{$_('gameControls.speech')}</span></div>
      <button class="menu-style-btn settings-icon-btn" title={$_('gameControls.voiceSettingsTitle')} on:click|stopPropagation={openVoiceSettingsModal}>
        <SvgIcons name="voice-settings" />
      </button>
    </label>
    <label class="ios-switch-label">
      <div class="switch-content-wrapper"><div class="ios-switch"><input type="checkbox" checked={$settingsStore.autoHideBoard} on:change={handleToggleAutoHideBoard} /><span class="slider"></span></div><span>{$_('gameModes.autoHideBoard')}</span></div>
    </label>
    <hr class="game-mode-divider" />
    {#if isHorizontalLayout}
    <div class="setting-item">
      <span>{$_('ui.moveMenuItems')}</span>
      <div style="display: flex; gap: 8px;">
        <button
          class="menu-style-btn"
          aria-label="Fixed mode"
          on:click={() => columnStyleMode.set('fixed')}
          class:active={$columnStyleMode === 'fixed'}
        >
          <SvgIcons name="fixed" />
        </button>
        <button
          class="menu-style-btn"
          aria-label="Editing mode"
          on:click={() => columnStyleMode.set('editing')}
          class:active={$columnStyleMode === 'editing'}
        >
          <SvgIcons name="editing" />
        </button>
        <button
          class="menu-style-btn"
          aria-label="Скинути положення меню"
          title={$_('ui.resetMenuLayout') || 'Скинути положення елементів меню'}
          on:click={() => layoutStore.resetLayout()}
        >
          <span style="width:50%;height:50%;display:flex;align-items:center;justify-content:center;">
            <SvgIcons name="clear-cache" />
          </span>
        </button>
      </div>
    </div>
    {/if}
  </div>
</div> 