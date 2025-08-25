<script lang="ts">
  import { gameState } from '$lib/stores/gameState.js';
  import { userActionService } from '$lib/services/userActionService';
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
  import { logService } from '$lib/services/logService.js';
  import ToggleButton from '../ToggleButton.svelte';
  import { blurOnClick } from '$lib/utils/actions';
  import { customTooltip } from '$lib/actions/customTooltip.js';
  import { gameModeService } from '$lib/services/gameModeService';

  let expanderRef: HTMLDetailsElement;
  let summaryRef: HTMLElement;
  let isOpen = true;
  let contentRef: HTMLDivElement;
  let contentHeight = 0;
  async function toggleExpander() {
    logService.action('Click: "Розгорнути/Згорнути налаштування" (SettingsExpanderWidget)');
    if ($settingsStore.lockSettings) {
      return;
    }
    isOpen = !isOpen;
  }
  let isHorizontalLayout = true;

  function updateLayoutMode() {
    isHorizontalLayout = window.innerWidth > 1270;
  }

  function fitTextAction(node: HTMLElement, dependency: any) {
    const buttons = Array.from(node.querySelectorAll('.settings-expander__row-btn')) as HTMLElement[];

    const fit = () => {
      if (buttons.length === 0) return;

      buttons.forEach(btn => btn.style.fontSize = '');

      tick().then(() => {
        const initialFontSize = parseFloat(getComputedStyle(buttons[0]).fontSize);
        let currentFontSize = initialFontSize;

        const fontSizeStep = 0.5;
        while (node.scrollWidth > node.clientWidth && currentFontSize > 12) {
          currentFontSize -= fontSizeStep;
          buttons.forEach(btn => btn.style.fontSize = `${currentFontSize}px`);
        }
      });
    };

    const observer = new ResizeObserver(fit);
    observer.observe(node);
    
    tick().then(fit);

    return {
      update(newDependency: any) {
        tick().then(fit);
      },
      destroy() {
        observer.disconnect();
      }
    };
  }

  onMount(() => {
    updateLayoutMode();
    window.addEventListener('resize', updateLayoutMode);
    return () => {
      window.removeEventListener('resize', updateLayoutMode);
    };
  });

  $: {
    const blockModeDependency = $settingsStore.blockModeEnabled;

    if (isOpen && contentRef) {
      tick().then(() => {
        contentHeight = contentRef.scrollHeight;
      });
    } else {
      contentHeight = 0;
    }
  }


  $: speechEnabled = $settingsStore.speechEnabled;

  function changeBoardSize(increment: number) {
    logService.action(`Click: "Змінити розмір дошки: ${increment > 0 ? '+' : ''}${increment}" (SettingsExpanderWidget)`);
    const currentSize = get(gameState).boardSize;
    const newSize = currentSize + increment;
    if (newSize >= 2 && newSize <= 9) {
      userActionService.changeBoardSize(newSize);
    }
  }

  function selectBlockCount(count: number) {
    logService.action(`Click: "Вибір кількості блоків: ${count}" (SettingsExpanderWidget)`);
    if (count > 0 && get(settingsStore).showDifficultyWarningModal) {
      modalStore.showModal({
        titleKey: 'modal.expertModeTitle',
        dataTestId: 'expert-mode-modal',
        contentKey: 'modal.expertModeContent',
        buttons: [
          { textKey: 'modal.expertModeConfirm', primary: true, isHot: true, onClick: () => { settingsStore.updateSettings({ blockOnVisitCount: count }); modalStore.closeModal(); } },
          { textKey: 'modal.expertModeCancel', onClick: modalStore.closeModal }
        ],
        closeOnOverlayClick: true,
        props: {
          showDontShowAgain: true,
          dontShowAgainBinding: () => settingsStore.updateSettings({ showDifficultyWarningModal: false })
        }
      });
    } else {
      settingsStore.updateSettings({ blockOnVisitCount: count });
    }
  }

  function handleToggleAutoHideBoard(event: Event) {
    logService.action('Click: "Автоматично приховувати дошку" (SettingsExpanderWidget)');
    settingsStore.toggleAutoHideBoard();
  }

  const icons = ['visibility_off', 'grid_on', 'view_in_ar', 'rule'];

  const toggleFunctions = [
    () => settingsStore.updateSettings({ showBoard: false, showPiece: false, showMoves: false }),
    () => {
      const current = get(settingsStore).showBoard;
      if (!current) {
        settingsStore.updateSettings({ showBoard: true });
      }
    },
    () => {
      const current = get(settingsStore).showPiece;
      if (current) {
        settingsStore.updateSettings({ showPiece: false, showMoves: false });
      } else {
        settingsStore.updateSettings({ showBoard: true, showPiece: true });
      }
    },
    () => {
      const current = get(settingsStore).showMoves;
      if (current) {
        settingsStore.updateSettings({ showMoves: false });
      } else {
        settingsStore.updateSettings({ showBoard: true, showPiece: true, showMoves: true });
      }
    }
  ];

  function getIsActive(i: number) {
    switch (i) {
      case 0: return !$settingsStore.showBoard;
      case 1: return $settingsStore.showBoard;
      case 2: return $settingsStore.showPiece;
      case 3: return $settingsStore.showMoves;
      default: return false;
    }
  }
</script>

<style>
  .settings-expander {
    --button-height: 36px;
    --summary-height: 64px;
    --button-padding: 4px 8px;
    --button-border-width: 1.5px;
    --button-border-radius: 8px;
    --button-font-size: 1em;
    background: var(--bg-secondary);
    border-radius: var(--unified-border-radius);
    border: var(--unified-border);
    box-shadow: var(--dynamic-widget-shadow) var(--current-player-shadow-color);
    transition: background 0.25s, box-shadow 0.25s;
    backdrop-filter: var(--unified-backdrop-filter);
  }
  .settings-expander:hover {
    box-shadow: var(--unified-shadow-hover);
  }
  .settings-expander.disabled {
    opacity: 0.6;
    pointer-events: none;
    cursor: not-allowed;
  }
  .settings-expander__summary {
    position: relative;
    padding: 0 20px;
    font-weight: 700;
    font-size: 1.18em;
    letter-spacing: 0.02em;
    color: #fff;
    background: none;
    border-radius: var(--unified-border-radius);
    cursor: pointer;
    user-select: none;
    transition: background 0.2s, margin-bottom 0.4s ease-out;
    display: flex;
    align-items: center;
    height: var(--summary-height);
    min-height: var(--summary-height);
    box-sizing: border-box;
    outline: none;
  }
  .settings-expander__summary.disabled {
    cursor: not-allowed;
  }
  .settings-expander__summary:focus {
    outline: none;
    box-shadow: none;
  }
  .settings-expander.open > .settings-expander__summary {
    border-radius: var(--unified-border-radius) var(--unified-border-radius) 0 0;
  }
  .settings-expander__arrow {
    position: absolute;
    right: 16px;
    top: 50%;
    transform: translateY(-50%) rotate(0deg);
    transition: transform 0.4s cubic-bezier(0.4,0,0.2,1);
  }
  .settings-expander.open .settings-expander__arrow {
    transform: translateY(-50%) rotate(180deg);
  }
  .settings-expander__content {
    overflow: hidden;
    max-height: 0;
    opacity: 0;
    transition: max-height 0.5s cubic-bezier(0.4,0,0.2,1), opacity 0.3s cubic-bezier(0.4,0,0.2,1), padding 0.5s cubic-bezier(0.4,0,0.2,1);
    padding: 0 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .settings-expander.open > .settings-expander__content {
    max-height: 1200px;
    opacity: 1;
    padding: 0 16px 16px 16px;
  }
  .settings-expander__setting-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 1.08em;
    padding: 0;
    gap: 12px;
  }
  .settings-expander__label {
    font-weight: 700;
    font-size: 1em;
    text-align: center;
    flex-grow: 1;
  }
  .settings-expander__button-group {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
    margin-top: 8px;
  }
  .settings-expander__button-group--three {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
  }
  .settings-expander__size-adjuster {
    display: flex;
    align-items: center;
    gap: 16px;
  }
  .settings-expander__square-btn {
    background: var(--control-bg);
    color: var(--text-primary);
    border: var(--button-border-width) solid #888;
    border-radius: var(--button-border-radius);
    width: var(--button-height);
    min-width: var(--button-height);
    height: var(--button-height);
    min-height: var(--button-height);
    box-sizing: border-box;
    font-size: calc(var(--button-height) * 0.5);
    font-weight: bold;
    cursor: pointer;
    transition: background 0.18s, color 0.18s, border 0.18s;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
  }
  .settings-expander__square-btn:hover, .settings-expander__square-btn.active {
    background: var(--control-selected);
    color: var(--control-selected-text);
    border-color: var(--control-selected);
    outline: none;
  }
  .settings-expander__current-size {
    font-weight: 500;
  }
  .settings-expander__options-group {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 0 0 12px;
    gap: 12px;
  }
  .settings-expander__game-mode-row {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
    margin-top: 8px;
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
  }
  .settings-expander__row-btn:hover, .settings-expander__row-btn:focus {
    border-color: var(--control-selected);
    color: var(--text-primary);
    outline: none;
  }
  .settings-expander__row-btn.active {
    background: var(--control-selected);
    color: var(--control-selected-text);
    border-color: var(--control-selected);
    box-shadow: 0 0 8px var(--control-selected, #4caf50);
    transform: scale(1.07);
    z-index: 1;
  }
  .settings-expander__divider {
    border: none;
    border-top: 1.5px solid var(--border-color, #444);
    margin: 0;
    width: 100%;
  }
  .settings-expander__section-title {
    font-weight: 700;
    color: var(--text-primary);
    margin: 0;
    text-align: center;
    font-size: 1.1em;
  }
</style>

{#if $gameState}
<div class="settings-expander {isOpen ? 'open' : ''}" class:disabled={$settingsStore.lockSettings}>
  <div
    class="settings-expander__summary"
    class:disabled={$settingsStore.lockSettings}
    role="button"
    aria-label={$_('gameControls.settings')}
    on:click={toggleExpander}
    on:keydown={(e) => (e.key === 'Enter' || e.key === ' ') && toggleExpander()}
    bind:this={summaryRef}
    tabindex={$settingsStore.lockSettings ? -1 : 0}
  >
    {$_('gameControls.settings')}
    <span class="settings-expander__arrow" aria-hidden="true"><svg viewBox="0 0 24 24" width="24" height="24"><polyline points="6 9 12 15 18 9" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
  </div>
  <div class="settings-expander__content" bind:this={contentRef} style="max-height: {contentHeight}px; opacity: {isOpen ? 1 : 0};">
    <div class="settings-expander__game-mode-row" use:fitTextAction={$_('gameModes.beginner')}>
      <button data-testid="settings-expander-game-mode-beginner-btn" class="settings-expander__row-btn" class:active={$settingsStore.gameMode === 'beginner'} on:click={() => gameModeService.applyGameModePreset('beginner')}>{$_('gameModes.beginner')}</button>
      <button data-testid="settings-expander-game-mode-experienced-btn" class="settings-expander__row-btn" class:active={$settingsStore.gameMode === 'experienced'} on:click={() => gameModeService.applyGameModePreset('experienced')}>{$_('gameModes.experienced')}</button>
      <button data-testid="settings-expander-game-mode-pro-btn" class="settings-expander__row-btn" class:active={$settingsStore.gameMode === 'pro'} on:click={() => gameModeService.applyGameModePreset('pro')}>{$_('gameModes.pro')}</button>
    </div>
    <hr class="settings-expander__divider" />
    <div class="settings-expander__setting-item">
      <span class="settings-expander__label">{$_('settings.boardSize')}</span>
      <div class="settings-expander__size-adjuster">
        <button
          class="settings-expander__square-btn"
          use:blurOnClick
          on:click={() => changeBoardSize(-1)}
          disabled={$gameState.boardSize <= 2}
          data-testid="decrease-board-size-btn"
        >-</button>
        <span class="settings-expander__current-size">{$gameState.boardSize}x{$gameState.boardSize}</span>
        <button
          class="settings-expander__square-btn"
          use:blurOnClick
          on:click={() => changeBoardSize(1)}
          disabled={$gameState.boardSize >= 9}
          data-testid="increase-board-size-btn"
        >+</button>
      </div>
    </div>
    <div class="settings-expander__button-group" use:fitTextAction={$_('settings.visibility.hidden')}>
      {#each [$_('settings.visibility.hidden'), $_('settings.visibility.boardOnly'), $_('settings.visibility.withPiece'), $_('settings.visibility.withMoves')] as label, i}
        <button
          data-testid="settings-expander-visibility-btn-{$_('settings.visibility.hidden') === label ? 'hidden' : $_('settings.visibility.boardOnly') === label ? 'boardOnly' : $_('settings.visibility.withPiece') === label ? 'withPiece' : 'withMoves'}"
          class="settings-expander__row-btn"
          class:active={getIsActive(i)}
          on:click={toggleFunctions[i]}
        >
          <SvgIcons name={icons[i]} />
          {label}
        </button>
      {/each}
    </div>
    <hr class="settings-expander__divider" />
    <h3 class="settings-expander__section-title">{$_('settings.gameInfoWidget.title')}</h3>
    <div class="settings-expander__button-group settings-expander__button-group--three" use:fitTextAction={$_('settings.gameInfoWidget.hidden')}>
      <button
        data-testid="settings-expander-game-info-widget-hidden-btn"
        class="settings-expander__row-btn"
        class:active={$settingsStore.showGameInfoWidget === 'hidden'}
        on:click={() => settingsStore.setGameInfoWidgetState('hidden')}
      >
        {$_('settings.gameInfoWidget.hidden')}
      </button>
      <button
        data-testid="settings-expander-game-info-widget-shown-btn"
        class="settings-expander__row-btn"
        class:active={$settingsStore.showGameInfoWidget === 'shown'}
        on:click={() => settingsStore.setGameInfoWidgetState('shown')}
      >
        {$_('settings.gameInfoWidget.shown')}
      </button>
      <button
        data-testid="settings-expander-game-info-widget-compact-btn"
        class="settings-expander__row-btn"
        class:active={$settingsStore.showGameInfoWidget === 'compact'}
        on:click={() => settingsStore.setGameInfoWidgetState('compact')}
      >
        {$_('settings.gameInfoWidget.compact')}
      </button>
    </div>
    <hr class="settings-expander__divider" />
    <ToggleButton
      label={$_('gameModes.autoHideBoard')}
      checked={$settingsStore.autoHideBoard}
      on:toggle={handleToggleAutoHideBoard}
      dataTestId="auto-hide-board-toggle"
    />
    <ToggleButton
      label={$_('gameControls.blockMode')}
      checked={$settingsStore.blockModeEnabled}
      on:toggle={settingsStore.toggleBlockMode}
      dataTestId="block-mode-toggle"
    />
    {#if $settingsStore.blockModeEnabled}
      <div class="settings-expander__options-group">
        <span class="settings-expander__label">{$_('gameControls.blockAfter')}</span>
        <div class="settings-expander__button-group" use:fitTextAction={$settingsStore.blockOnVisitCount}>
          {#each [0, 1, 2, 3] as count}
            <button data-testid="settings-expander-block-count-btn-{count}" class="settings-expander__square-btn" class:active={$settingsStore.blockOnVisitCount === count} on:click={() => selectBlockCount(count)}>{count}</button>
          {/each}
        </div>
      </div>
    {/if}
    <div class="settings-expander__setting-item">
      <ToggleButton
        label={$_('gameControls.speech')}
        checked={speechEnabled}
        on:toggle={() => userActionService.toggleSpeech()}
        dataTestId="speech-toggle"
      />
      <button data-testid="settings-expander-voice-settings-btn" class="settings-expander__square-btn" use:blurOnClick use:customTooltip={$_('gameControls.voiceSettingsTitle')} on:click|stopPropagation={openVoiceSettingsModal}>
        <SvgIcons name="voice-settings" />
      </button>
    </div>
    <hr class="settings-expander__divider" />
    {#if isHorizontalLayout}
    <div class="settings-expander__setting-item">
      <span class="settings-expander__label">{$_('ui.moveMenuItems')}</span>
      <div style="display: flex; gap: 12px;">
        <button
          data-testid="settings-expander-column-style-fixed-btn"
          class="settings-expander__square-btn"
          aria-label="Fixed mode"
          on:click={() => columnStyleMode.set('fixed')}
          class:active={$columnStyleMode === 'fixed'}
        >
          <SvgIcons name="fixed" />
        </button>
        <button
          data-testid="settings-expander-column-style-editing-btn"
          class="settings-expander__square-btn"
          aria-label="Editing mode"
          on:click={() => columnStyleMode.set('editing')}
          class:active={$columnStyleMode === 'editing'}
        >
          <SvgIcons name="editing" />
        </button>
        <button
          data-testid="settings-expander-reset-layout-btn"
          class="settings-expander__square-btn"
          use:blurOnClick
          aria-label="Скинути положення меню"
          use:customTooltip={$_('ui.resetMenuLayout') || 'Скинути положення елементів меню'}
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
{/if}