<script lang="ts">
  import '../css/layouts/main-menu.css';
  import { appSettingsStore } from '$lib/stores/appSettingsStore.js';
  import { gameSettingsStore } from '$lib/stores/gameSettingsStore.js';
  import { navigateToGame } from '$lib/services/uiService';
  import { navigationService } from '$lib/services/navigationService';
  import { logService } from '$lib/services/logService.js';
  import { gameModeService } from '$lib/services/gameModeService.js';
  import hotkeyService from '$lib/services/hotkeyService';
  
  import { goto } from '$app/navigation';
  import { base } from '$app/paths';
  import { _ , isLoading, locale } from 'svelte-i18n';
  import SvgIcons from './SvgIcons.svelte';
  import { appVersion } from '$lib/stores/versionStore.js';
  import { currentLanguageFlagSvg } from '$lib/stores/derivedState.ts';
  import { languages } from '$lib/constants';
  import { modalStore } from '$lib/stores/modalStore.js';
  import { onMount, onDestroy, tick } from 'svelte';
  import { get } from 'svelte/store';
  
  import { customTooltip } from '$lib/actions/customTooltip.js';
  import { uiStateStore } from '$lib/stores/uiStateStore';
  import { boardStore } from '$lib/stores/boardStore';

  let showLangDropdown = false;
  let showThemeDropdown = false;
  let showWipNotice = false;
  let showDevMenu = false;
  let mainMenuButtonsNode: HTMLElement;

  const CONTEXT_NAME = 'main-menu';

  onMount(() => {
    hotkeyService.pushContext(CONTEXT_NAME);

    const activeGameMode = gameModeService.getCurrentMode();
    if (activeGameMode) {
      activeGameMode.cleanup();
    }
    appSettingsStore.init();
  });

  onDestroy(() => {
    hotkeyService.popContext();
  });

  $: if (mainMenuButtonsNode) {
    const buttons = Array.from(mainMenuButtonsNode.querySelectorAll('button'));
    buttons.forEach((btn, index) => {
        if (index < 9) { // Only register for the first 9 buttons (1-9)
            const key = `Digit${index + 1}`;
            logService.action(`[MainMenu] Registering hotkey '${key}' for button`, btn);
            hotkeyService.register(CONTEXT_NAME, key, () => btn.click());
        }
    });
  }

  function selectLang(lang: string) {
    logService.action(`Click: "Мова: ${lang}" (MainMenu)`);
    appSettingsStore.updateSettings({ language: lang });
    showLangDropdown = false;
  }
  function toggleLangDropdown() {
    logService.action('Click: "Мова" (MainMenu)');
    showLangDropdown = !showLangDropdown;
  }
  function openWipNotice() {
    logService.action('Click: "Play Online (WIP)" (MainMenu)');
    showWipNotice = true;
  }
  $: settings = $appSettingsStore;

  function navigateTo(route: string) {
    logService.action(`Click: "Навігація: ${route}" (MainMenu)`);
    hotkeyService.popContext();
    goto(`${base}${route}`);
  }

  function selectTheme(style: string, theme: string) {
    logService.action(`Click: "Тема: ${style} ${theme}" (MainMenu)`);
    appSettingsStore.updateSettings({ style, theme });
    showThemeDropdown = false;
  }

  function closeDropdowns() {
    logService.action('Click: "Закрити дропдауни" (MainMenu)');
    showThemeDropdown = false;
    showLangDropdown = false;
    showWipNotice = false;
    showDevMenu = false;
  }
  
  function handleDevMenu() {
    logService.action('Click: "dev version" (MainMenu)');
    showDevMenu = !showDevMenu;
  }
  function handleDevMenuBtn() {
    logService.action('Click: "Drag and Drop Test" (MainMenu)');
    navigateTo('/drag-and-drop-test');
    showDevMenu = false;
  }
  function handlePlayVsComputer() {
    hotkeyService.popContext();
    logService.action(`Click: "Гра проти комп'ютера" (MainMenu)`);
    uiStateStore.update(s => ({ ...s, intendedGameType: 'training' })); // Set intended game type
    const uiState = get(uiStateStore);
    if (uiState && !uiState.isGameOver && get(boardStore)?.moveHistory.length > 1) {
      navigationService.resumeGame('/game/training');
    } else {
      const settings = get(gameSettingsStore);
      if (settings.showGameModeModal) {
        import('./GameModeModal.svelte').then(module => {
          const GameModeModal = module.default;
          modalStore.showModal({
            titleKey: 'mainMenu.gameModeModal.title',
            dataTestId: 'game-mode-modal',
            component: GameModeModal,
            buttons: [
              {
                textKey: 'modal.close',
                onClick: () => modalStore.closeModal(),
                dataTestId: 'modal-btn-modal.close',
                hotKey: 'ESC'
              }
            ]
          });
        });
      } else {
        navigateToGame();
      }
    }
  }
  function handleLocalGame() {
    hotkeyService.popContext();
    logService.action('Click: "Локальна гра" (MainMenu)');
    uiStateStore.update(s => ({ ...s, intendedGameType: 'local' })); // Set intended game type
    navigateTo('/local-setup');
  }
  function handleControls() {
    logService.action('Click: "Управління" (MainMenu)');
    navigateTo('/controls');
  }
  function handleRules() {
    logService.action('Click: "Правила" (MainMenu)');
    navigateTo('/rules');
  }
  function handleSupporters() {
    logService.action('Click: "Підтримати" (MainMenu)');
    navigateTo('/supporters');
  }
  function handleDonate() {
    logService.action('Click: "Donate" (MainMenu)');
    navigateTo('/supporters');
  }
  function handleOverlayClose() {
    logService.action('Click: "Закрити overlay" (MainMenu)');
    closeDropdowns();
  }
</script>

<main class="main-menu" data-testid="main-menu-container">
  {#if $isLoading}
    <div class="main-menu-loading">Завантаження перекладу...</div>
  {:else}
    <div class="main-menu-top-icons">
      <button class="main-menu-icon" use:customTooltip={$_('mainMenu.theme')} aria-label={$_('mainMenu.theme')} onclick={() => showThemeDropdown = !showThemeDropdown} data-testid="theme-btn">
        <span class="main-menu-icon-inner">
          <SvgIcons name="theme" />
        </span>
      </button>
      <button class="main-menu-icon" use:customTooltip={$_('mainMenu.language')} aria-label={$_('mainMenu.language')} onclick={toggleLangDropdown} data-testid="lang-btn">
        <span class="main-menu-icon-inner">
          {@html $currentLanguageFlagSvg}
        </span>
      </button>
      {#if showLangDropdown}
        <div class="lang-dropdown main-menu-lang-dropdown" role="dialog" aria-modal="true" tabindex="0" onclick={(e) => { e.stopPropagation(); }} onkeydown={(e) => (e.key === 'Escape') && (showLangDropdown = false)}>
          {#each languages as lang (lang.code)}
            <button class="lang-option" onclick={() => selectLang(lang.code)} aria-label={lang.code} data-testid={`lang-option-${lang.code}`}>
              {@html lang.svg}
            </button>
          {/each}
        </div>
      {/if}
      <button class="main-menu-icon" use:customTooltip={$_('mainMenu.donate')} aria-label={$_('mainMenu.donate')} onclick={() => navigateTo('/supporters')} data-testid="donate-btn">
        <span class="main-menu-icon-inner">
          <SvgIcons name="donate" />
        </span>
      </button>
    </div>

    {#if showThemeDropdown || showLangDropdown || showWipNotice || showDevMenu}
      <div class="screen-overlay-backdrop" role="button" tabindex="0" aria-label={$_('mainMenu.closeDropdowns')} onclick={closeDropdowns} onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && closeDropdowns()}>
      </div>
    {/if}

    {#if showDevMenu}
      <div class="dev-menu" role="dialog" tabindex="0" onclick={(e) => { e.stopPropagation(); }} onkeydown={(e) => (e.key === 'Escape') && (showDevMenu = false)}>
        <h3>dev</h3>
        <button class="modal-button secondary" onclick={handleDevMenuBtn} data-testid="dev-menu-dnd-btn">
          {$_('mainMenu.dragAndDropTest')}
        </button>
        <!-- Сюди можна додавати нові dev-кнопки -->
      </div>
    {/if}

    {#if showWipNotice}
      <div class="wip-notice-overlay" role="dialog" tabindex="0" onclick={(e) => { e.stopPropagation(); }} onkeydown={(e) => (e.key === 'Escape') && closeDropdowns()}>
        <div class="wip-notice-content">
                    <button class="wip-close-btn" onclick={closeDropdowns} data-testid="wip-notice-close-btn">×</button>
          <h3>{$_('mainMenu.wipNotice.title')}</h3>
          <p>{$_('mainMenu.wipNotice.description')}</p>
          <button class="wip-donate-btn" onclick={handleDonate} data-testid="wip-notice-donate-btn">
            {$_('mainMenu.donate')}
          </button>
        </div>
      </div>
    {/if}

    {#if showThemeDropdown}
      <div class="theme-dropdown" role="dialog" tabindex="0" aria-modal="true" aria-label={$_('mainMenu.themeDropdown')} onclick={(e) => { e.stopPropagation(); }} onkeydown={(e) => (e.key === 'Escape') && closeDropdowns()}>
        <div class="theme-style-row" data-style="purple">
          <button class="theme-btn" data-theme="light" onclick={() => selectTheme('purple', 'light')} data-testid="theme-purple-light-btn">☀️</button>
          <span class="theme-name">{$_('mainMenu.themeName.purple')}</span>
          <button class="theme-btn" data-theme="dark" onclick={() => selectTheme('purple', 'dark')} data-testid="theme-purple-dark-btn">🌙</button>
        </div>
        <div class="theme-style-row" data-style="green">
          <button class="theme-btn" data-theme="light" onclick={() => selectTheme('green', 'light')} data-testid="theme-green-light-btn">☀️</button>
          <span class="theme-name">{$_('mainMenu.themeName.green')}</span>
          <button class="theme-btn" data-theme="dark" onclick={() => selectTheme('green', 'dark')} data-testid="theme-green-dark-btn">🌙</button>
        </div>
        <div class="theme-style-row" data-style="blue">
          <button class="theme-btn" data-theme="light" onclick={() => selectTheme('blue', 'light')} data-testid="theme-blue-light-btn">☀️</button>
          <span class="theme-name">{$_('mainMenu.themeName.blue')}</span>
          <button class="theme-btn" data-theme="dark" onclick={() => selectTheme('blue', 'dark')} data-testid="theme-blue-dark-btn">🌙</button>
        </div>
        <div class="theme-style-row" data-style="gray">
          <button class="theme-btn" data-theme="light" onclick={() => selectTheme('gray', 'light')} data-testid="theme-gray-light-btn">☀️</button>
          <span class="theme-name">{$_('mainMenu.themeName.gray')}</span>
          <button class="theme-btn" data-theme="dark" onclick={() => selectTheme('gray', 'dark')} data-testid="theme-gray-dark-btn">🌙</button>
        </div>
        <div class="theme-style-row" data-style="orange">
          <button class="theme-btn" data-theme="light" onclick={() => selectTheme('orange', 'light')} data-testid="theme-orange-light-btn">☀️</button>
          <span class="theme-name">{$_('mainMenu.themeName.orange')}</span>
          <button class="theme-btn" data-theme="dark" onclick={() => selectTheme('orange', 'dark')} data-testid="theme-orange-dark-btn">🌙</button>
        </div>
        <div class="theme-style-row" data-style="wood">
          <button class="theme-btn" data-theme="light" onclick={() => selectTheme('wood', 'light')} data-testid="theme-wood-light-btn">☀️</button>
          <span class="theme-name">{$_('mainMenu.themeName.wood')}</span>
          <button class="theme-btn" data-theme="dark" onclick={() => selectTheme('wood', 'dark')} data-testid="theme-wood-dark-btn">🌙</button>
        </div>
      </div>
    {/if}

    <div class="main-menu-title" data-testid="main-menu-title">{$_('mainMenu.title')}</div>
    {#if import.meta.env.DEV}
      <div class="main-menu-subtitle" data-testid="main-menu-subtitle">
        {$_('mainMenu.menu')}
        <span
          class="dev-version"
          role="button"
          tabindex="0"
          onclick={handleDevMenu}
          onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && handleDevMenu()}
          data-testid="dev-version-span"
        >
          dev v.{$appVersion}
        </span>
      </div>
    {/if}
    <div id="main-menu-buttons" bind:this={mainMenuButtonsNode}>
      <button class="modal-button secondary" onclick={handlePlayVsComputer} data-testid="training-btn">{$_('mainMenu.training')}</button>
      <button class="modal-button secondary" onclick={() => { uiStateStore.update(s => ({ ...s, intendedGameType: 'timed' })); navigateTo('/game/timed'); }} data-testid="timed-game-btn">{$_('mainMenu.timedGame')}</button>
      <button
        class="modal-button secondary"
        class:pseudo-disabled={!import.meta.env.DEV}
        onclick={import.meta.env.DEV ? handleLocalGame : openWipNotice}
        data-testid="local-game-btn">{$_('mainMenu.localGame')}</button>
      <button class="modal-button secondary pseudo-disabled" onclick={openWipNotice} data-testid="online-game-btn">{$_('mainMenu.playOnline')}</button>
      <button class="modal-button secondary" onclick={() => navigateTo('/settings')} data-testid="settings-btn">{$_('mainMenu.settings')}</button>
      <button class="modal-button secondary" onclick={handleControls} data-testid="controls-btn">{$_('mainMenu.controls')}</button>
      <button class="modal-button secondary" onclick={handleRules} data-testid="rules-btn">{$_('mainMenu.rules')}</button>
      <button class="modal-button secondary" onclick={handleSupporters} data-testid="supporters-btn">{$_('mainMenu.supporters')}</button>
      <!-- <button class="modal-button danger" onclick={showClearCacheModal} data-testid="clear-cache-btn">{$_('mainMenu.clearCache')}</button> -->
    </div>
  {/if}
</main>

<style>
  .wip-close-btn {
    width: 32px;
    height: 32px;
    min-width: 32px;
    min-height: 32px;
    border-radius: 8px;
    background: rgba(0,0,0,0.2);
    color: white;
    border: none;
    font-size: 1.5em;
    line-height: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
  }
  .dev-version {
    font-size: 0.7em;
    opacity: 0.7;
    margin-left: 8px;
    font-weight: normal;
    color: var(--text-accent);
    cursor: pointer;
    user-select: none;
  }
  .dev-version:hover {
    text-decoration: underline;
  }
  .dev-menu {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 10000;
    background: var(--bg-secondary);
    color: var(--text-primary);
    padding: 24px;
    border-radius: 16px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.3);
    border: 1px solid rgba(255, 255, 255, 0.1);
    display: flex;
    flex-direction: column;
    gap: 16px;
    min-width: 280px;
  }
  .dev-menu h3 {
    margin: 0;
    text-align: center;
    font-size: 1.5em;
    color: var(--text-accent);
  }
  .wip-donate-btn {
    background: var(--warning-action-bg);
    color: var(--warning-action-text);
    border: none;
    border-radius: 10px;
    padding: 12px 32px;
    font-weight: bold;
    cursor: pointer;
    font-size: 1.1em;
    transition: all 0.2s ease;
  }
</style>