<script lang="ts">
  import "../css/layouts/main-menu.css";
  import { appSettingsStore } from "$lib/stores/appSettingsStore.js";
  import { gameSettingsStore } from "$lib/stores/gameSettingsStore.js";
  import { navigateToGame } from "$lib/services/uiService";
  import { navigationService } from "$lib/services/navigationService";
  import { logService } from "$lib/services/logService.js";
  import { gameModeService } from "$lib/services/gameModeService.js";
  import hotkeyService from "$lib/services/hotkeyService";

  import { goto } from "$app/navigation";
  import { base } from "$app/paths";
  import { _, isLoading, locale } from "svelte-i18n";
  import SvgIcons from "./SvgIcons.svelte";
  import { appVersion } from "$lib/stores/versionStore";
  import { currentLanguageFlagSvg } from "$lib/stores/derivedState.ts";
  import { modalStore } from "$lib/stores/modalStore";
  import { onMount, onDestroy, tick } from "svelte";
  import { get } from "svelte/store";

  import { customTooltip } from "$lib/actions/customTooltip.js";
  import { uiStateStore } from "$lib/stores/uiStateStore";
  import { boardStore } from "$lib/stores/boardStore";

  import StyledButton from "$lib/components/ui/StyledButton.svelte";
  import ThemeDropdown from "./main-menu/ThemeDropdown.svelte";
  import LanguageDropdown from "./main-menu/LanguageDropdown.svelte";
  import WipNotice from "./main-menu/WipNotice.svelte";
  import DevMenu from "./main-menu/DevMenu.svelte";

  let showLangDropdown = false;
  let showThemeDropdown = false;
  let showWipNotice = false;
  let showDevMenu = false;
  let mainMenuButtonsNode: HTMLElement;

  const CONTEXT_NAME = "main-menu";

  onMount(() => {
    hotkeyService.pushContext(CONTEXT_NAME);

    const activeGameMode = gameModeService.getCurrentMode();
    if (activeGameMode) {
      activeGameMode.cleanup();
    }
    appSettingsStore.init();
  });

  $: if (!$isLoading && mainMenuButtonsNode) {
    const playButton = mainMenuButtonsNode.querySelector(
      '[data-testid="virtual-player-btn"]',
    ) as HTMLElement;
    if (playButton) {
      playButton.focus();
    } else {
      const buttons = getFocusableButtons();
      if (buttons.length > 0) {
        buttons[0].focus();
      }
    }
  }

  onDestroy(() => {
    hotkeyService.popContext();
  });

  function getFocusableButtons() {
    if (!mainMenuButtonsNode) return [];
    return Array.from(mainMenuButtonsNode.querySelectorAll("button"));
  }

  function handleMenuKeyDown(event: KeyboardEvent) {
    logService.action(
      `[MainMenu] handleMenuKeyDown fired with key: ${event.key}`,
    );
    const buttons = getFocusableButtons();
    if (buttons.length === 0) {
      logService.action(`[MainMenu] No buttons found.`);
      return;
    }

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const currentIndex = buttons.findIndex(
        (btn) => btn === document.activeElement,
      );
      logService.action(`[MainMenu] Current focused index: ${currentIndex}`);
      let nextIndex = currentIndex;

      if (event.key === "ArrowDown") {
        nextIndex = (currentIndex + 1) % buttons.length;
      } else {
        // ArrowUp
        nextIndex = (currentIndex - 1 + buttons.length) % buttons.length;
      }

      logService.action(`[MainMenu] Focusing next index: ${nextIndex}`);
      buttons[nextIndex].focus();
    } else if (
      event.key === "Enter" ||
      event.key === " " ||
      event.code === "NumpadEnter"
    ) {
      event.preventDefault();
      const focusedButton = document.activeElement as HTMLElement;
      if (buttons.includes(focusedButton as HTMLButtonElement)) {
        logService.action(`[MainMenu] Clicking focused button:`, focusedButton);
        focusedButton.click();
      }
    }
  }

  $: if (mainMenuButtonsNode) {
    const buttons = getFocusableButtons();
    buttons.forEach((btn, index) => {
      if (index < 9) {
        // Only register for the first 9 buttons (1-9)
        const key = `Digit${index + 1}`;
        logService.action(
          `[MainMenu] Registering hotkey '${key}' for button`,
          btn,
        );
        hotkeyService.register(CONTEXT_NAME, key, () => btn.click());
      }
    });
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

  function handlePlayVirtualPlayer() {
    hotkeyService.popContext();
    logService.action(`Click: "Гра проти віртуального гравця" (MainMenu)`);
    import("./GameModeModal.svelte").then((module) => {
      const GameModeModal = module.default;
      modalStore.showModal({
        titleKey: "mainMenu.gameModeModal.title",
        dataTestId: "game-mode-modal",
        component: GameModeModal,
        props: { extended: true },
        buttons: [
          {
            textKey: "modal.close",
            onClick: () => modalStore.closeModal(),
            dataTestId: "modal-btn-modal.close",
            hotKey: "ESC",
          },
        ],
      });
    });
  }
  function handlePlayVsComputer() {
    hotkeyService.popContext();
    logService.action(`Click: "Гра проти комп'ютера" (MainMenu)`);
    uiStateStore.update((s) => ({ ...s, intendedGameType: "training" })); // Set intended game type
    const uiState = get(uiStateStore);
    if (
      uiState &&
      !uiState.isGameOver &&
      get(boardStore)?.moveHistory.length > 1
    ) {
      navigationService.resumeGame("/game/training");
    } else {
      const settings = get(gameSettingsStore);
      if (settings.showGameModeModal) {
        import("./GameModeModal.svelte").then((module) => {
          const GameModeModal = module.default;
          modalStore.showModal({
            titleKey: "mainMenu.gameModeModal.title",
            dataTestId: "game-mode-modal",
            component: GameModeModal,
            props: { extended: false },
            buttons: [
              {
                textKey: "modal.close",
                onClick: () => modalStore.closeModal(),
                dataTestId: "modal-btn-modal.close",
                hotKey: "ESC",
              },
            ],
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
    uiStateStore.update((s) => ({ ...s, intendedGameType: "local" })); // Set intended game type
    navigateTo("/local-setup");
  }
  function handleControls() {
    logService.action('Click: "Управління" (MainMenu)');
    navigateTo("/controls");
  }
  function handleRules() {
    logService.action('Click: "Правила" (MainMenu)');
    navigateTo("/rules");
  }
  function handleSupporters() {
    logService.action('Click: "Підтримати" (MainMenu)');
    navigateTo("/supporters");
  }

  // Derived or handled logic
  $: isDev = import.meta.env.DEV;
</script>

<main class="main-menu" data-testid="main-menu-container">
  {#if $isLoading}
    <div class="main-menu-loading">{$_("mainMenu.loadingTranslations")}</div>
  {:else}
    <div class="main-menu-top-icons">
      <button
        class="main-menu-icon"
        use:customTooltip={$_("mainMenu.theme")}
        aria-label={$_("mainMenu.theme")}
        onclick={() => (showThemeDropdown = !showThemeDropdown)}
        data-testid="theme-btn"
      >
        <span class="main-menu-icon-inner">
          <SvgIcons name={settings.style} />
        </span>
      </button>

      <button
        class="main-menu-icon"
        use:customTooltip={$_("mainMenu.language")}
        aria-label={$_("mainMenu.language")}
        onclick={toggleLangDropdown}
        data-testid="language-btn"
      >
        <span class="main-menu-icon-inner">
          {@html $currentLanguageFlagSvg}
        </span>
      </button>

      {#if showLangDropdown}
        <LanguageDropdown onClose={() => (showLangDropdown = false)} />
      {/if}

      <button
        class="main-menu-icon"
        use:customTooltip={$_("mainMenu.donate")}
        aria-label={$_("mainMenu.donate")}
        onclick={() => navigateTo("/supporters")}
        data-testid="donate-btn"
      >
        <span class="main-menu-icon-inner">
          <SvgIcons name="donate" />
        </span>
      </button>
    </div>

    {#if showThemeDropdown || showLangDropdown || showWipNotice || showDevMenu}
      <div
        class="screen-overlay-backdrop"
        role="button"
        tabindex="0"
        aria-label={$_("mainMenu.closeDropdowns")}
        onclick={closeDropdowns}
        onkeydown={(e) =>
          (e.key === "Enter" || e.key === " ") && closeDropdowns()}
      ></div>
    {/if}

    {#if showDevMenu}
      <DevMenu
        onClose={() => (showDevMenu = false)}
        onOpenWipNotice={openWipNotice}
        onPlayVsComputer={handlePlayVsComputer}
        onLocalGame={handleLocalGame}
      />
    {/if}

    {#if showWipNotice}
      <WipNotice onClose={closeDropdowns} />
    {/if}

    {#if showThemeDropdown}
      <ThemeDropdown onClose={() => (showThemeDropdown = false)} />
    {/if}

    <div class="main-menu-title" data-testid="main-menu-title">
      {$_("mainMenu.title")}
    </div>
    {#if isDev}
      <div class="main-menu-subtitle" data-testid="main-menu-subtitle">
        {$_("mainMenu.menu")}
        <span
          class="dev-version"
          role="button"
          tabindex="0"
          onclick={handleDevMenu}
          onkeydown={(e) =>
            (e.key === "Enter" || e.key === " ") && handleDevMenu()}
          data-testid="dev-version-span"
        >
          dev v.{$appVersion}
        </span>
      </div>
    {/if}
    <div
      id="main-menu-buttons"
      bind:this={mainMenuButtonsNode}
      onkeydown={handleMenuKeyDown}
      tabindex="-1"
      role="group"
      aria-label={$_("mainMenu.menu")}
    >
      <StyledButton
        variant="menu"
        size="large"
        on:click={() => navigateTo("/settings")}
        dataTestId="settings-btn">{$_("mainMenu.settings")}</StyledButton
      >
      <StyledButton
        variant="menu"
        size="large"
        on:click={handleControls}
        dataTestId="controls-btn">{$_("mainMenu.controls")}</StyledButton
      >
      <StyledButton
        variant="menu"
        size="large"
        on:click={handleRules}
        dataTestId="rules-btn">{$_("mainMenu.rules")}</StyledButton
      >
      <StyledButton
        variant="menu"
        size="large"
        on:click={handleSupporters}
        dataTestId="supporters-btn">{$_("mainMenu.supporters")}</StyledButton
      >
      <StyledButton
        variant="menu"
        size="large"
        on:click={() => navigateTo("/rewards")}
        dataTestId="rewards-btn"
      >
        <span slot="icon" class="icon-spacer" style="margin-right: 0px;"
          ><SvgIcons name="trophy_bronze" /></span
        >
        {$_("rewards.pageTitle")}
      </StyledButton>
      <!-- <button class="modal-button danger" onclick={showClearCacheModal} data-testid="clear-cache-btn">{$_('mainMenu.clearCache')}</button> -->
      <StyledButton
        variant="primary"
        size="large"
        class="play-button ripple"
        style="padding: 32px;"
        on:click={handlePlayVirtualPlayer}
        dataTestId="virtual-player-btn"
        >{$_("mainMenu.virtualPlayer")}</StyledButton
      >
    </div>
  {/if}
</main>

<style>
  /* Усі стилі винесено в src/lib/css/layouts/main-menu.css */
</style>
