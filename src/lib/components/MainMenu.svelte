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
  function handleOnlineGame() {
    hotkeyService.popContext();
    logService.action('Click: "Онлайн гра" (MainMenu)');
    uiStateStore.update((s) => ({ ...s, intendedGameType: "online" }));
    navigateTo("/online");
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
</script>

<!-- 
  FIX: Замінено min-height: 100vh на flex: 1 та width: 100%.
  Це дозволяє компоненту заповнювати батьківський контейнер (який має min-height: 100vh),
  але не форсувати власну висоту, що дозволяє коректно працювати зі спейсерами меню.
-->
<div
  style="display: flex; flex-direction: column; flex: 1; width: 100%; align-items: center; justify-content: center;"
>
  <main class="main-menu" data-testid="main-menu-container">
    {#if $isLoading}
      <div class="main-menu-loading">{$_("mainMenu.loadingTranslations")}</div>
    {:else}
      <div>
        {#if showWipNotice}
          <WipNotice onClose={closeDropdowns} />
        {/if}

        {#if showThemeDropdown}
          <ThemeDropdown onClose={() => (showThemeDropdown = false)} />
        {/if}

        <div class="main-menu-title" data-testid="main-menu-title">
          {$_("mainMenu.title")}
        </div>
        <div
          id="main-menu-buttons"
          bind:this={mainMenuButtonsNode}
          tabindex="-1"
          role="group"
          aria-label={$_("mainMenu.menu")}
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
            variant="primary"
            size="large"
            class="play-button ripple"
            style="padding: 32px;"
            on:click={handlePlayVirtualPlayer}
            dataTestId="play-btn">{$_("mainMenu.virtualPlayer")}</StyledButton
          >
        </div>
      </div>
    {/if}
  </main>
</div>

<style>
  /* Усі стилі винесено в src/lib/css/layouts/main-menu.css */
</style>
