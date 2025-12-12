<script lang="ts">
  import { _ } from "svelte-i18n";
  import { onMount } from "svelte";
  import hotkeyService from "$lib/services/hotkeyService";
  import { modalStore } from "$lib/stores/modalStore";
  import { goto } from "$app/navigation";
  import { base } from "$app/paths";
  import DontShowAgainCheckbox from "./DontShowAgainCheckbox.svelte";
  import { userActionService } from "$lib/services/userActionService";
  import { logService } from "$lib/services/logService";
  import { uiStateStore } from "$lib/stores/uiStateStore";
  import type { GameModePreset } from "$lib/stores/gameSettingsStore";
  import { APP_CONFIG } from "$lib/config/appConfig";
  import WipNotice from "./main-menu/WipNotice.svelte";

  let showWipNotice = false;

  function openWipNotice() {
    logService.action('Click: "Play Online (WIP)" (GameModeModal)');
    showWipNotice = true;
  }

  function handleLocalGame() {
    logService.action('Click: "Локальна гра" (GameModeModal)');
    uiStateStore.update((s) => ({ ...s, intendedGameType: "local" }));
    modalStore.closeModal();
    goto(`${base}/local-setup`);
  }

  function handleOnlineGame() {
    logService.action('Click: "Онлайн гра" (GameModeModal)');
    uiStateStore.update((s) => ({ ...s, intendedGameType: "online" }));
    modalStore.closeModal();
    goto(`${base}/online`);
  }

  // TODO: Implement navigation for Arena Mode
  function handleArenaMode() {
    logService.action('Click: "Arena Mode" (Future Feature)');
    openWipNotice();
  }

  // TODO: Implement navigation for Maze Mode
  function handleMazeMode() {
    logService.action('Click: "Maze Mode" (Future Feature)');
    openWipNotice();
  }

  export let scope: string;
  export let extended = false;
  let buttonsNode: HTMLElement;

  onMount(() => {
    if (buttonsNode) {
      const buttons = Array.from(buttonsNode.querySelectorAll("button"));
      buttons.forEach((btn, index) => {
        const key = `Digit${index + 1}`;
        hotkeyService.register(scope, key, () => btn.click());
      });
    }
  });

  function selectMode(mode: GameModePreset) {
    logService.modal(`[GameModeModal] selectMode called with: ${mode}`);
    userActionService.setGameModePreset(mode);

    if (extended) {
      uiStateStore.update((s) => ({
        ...s,
        intendedGameType: "virtual-player",
      }));
      if (mode === "beginner") {
        logService.modal(
          "[GameModeModal] Beginner mode selected. Showing FAQ modal.",
        );
        modalStore.showModal({
          titleKey: "faq.title",
          dataTestId: "faq-modal",
          content: { isFaq: true },
          buttons: [
            {
              textKey: "rulesPage.title",
              onClick: () => {
                goto(`${base}/rules`);
                modalStore.closeModal();
              },
              customClass: "blue-btn",
            },
            {
              textKey: "modal.ok",
              primary: true,
              isHot: true,
              onClick: () => {
                logService.modal(
                  "[FAQModal] OK button clicked. Closing modal and navigating to game.",
                );
                modalStore.closeModal();
                userActionService.navigateToGame();
              },
            },
          ],
        });
      } else {
        userActionService.navigateToGame();
        modalStore.closeModal();
      }
      return;
    }

    if (mode === "beginner") {
      logService.modal(
        "[GameModeModal] Beginner mode selected. Showing FAQ modal.",
      );
      modalStore.showModal({
        titleKey: "faq.title",
        dataTestId: "faq-modal",
        content: { isFaq: true },
        buttons: [
          {
            textKey: "rulesPage.title",
            onClick: () => {
              goto(`${base}/rules`);
              modalStore.closeModal();
            },
            customClass: "blue-btn",
          },
          {
            textKey: "modal.ok",
            primary: true,
            isHot: true,
            onClick: () => {
              logService.modal(
                "[FAQModal] OK button clicked. Closing modal and navigating to game.",
              );
              modalStore.closeModal();
              userActionService.navigateToGame();
            },
          },
        ],
      });
    } else {
      logService.modal(
        `[GameModeModal] ${mode} mode selected. Closing current modal and navigating.`,
      );
      modalStore.closeModal();
      userActionService.navigateToGame();
    }
  }
</script>

<div class="game-mode-buttons" bind:this={buttonsNode}>
  {#if extended}
    <!-- 1. Online Game (Top Priority) -->
    <button
      class="modal-btn-generic"
      on:click={handleOnlineGame}
      data-testid="online-game-btn"
    >
      {$_("mainMenu.playOnline")}
    </button>

    <hr class="divider" />
  {/if}

  <!-- 2. Single Player Modes -->
  <!-- Заголовок модального вікна вже містить "Втримайся", тому тут не дублюємо -->

  <button
    class="modal-btn-generic green-btn"
    on:click={() => selectMode("beginner")}
    data-testid="beginner-mode-btn"
  >
    {$_("gameModes.beginner")}
  </button>
  <button
    class="modal-btn-generic blue-btn"
    on:click={() => selectMode("experienced")}
    data-testid="experienced-mode-btn"
  >
    {$_("gameModes.experienced")}
  </button>
  <button
    class="modal-btn-generic danger-btn"
    on:click={() => selectMode("pro")}
    data-testid="pro-mode-btn"
  >
    {$_("gameModes.pro")}
  </button>

  {#if extended}
    <button
      class="modal-btn-generic"
      on:click={() => selectMode("timed")}
      data-testid="timed-game-btn"
    >
      {$_("mainMenu.timedGame")}
    </button>

    <hr class="divider" />

    <!-- 3. Local Game -->
    <button
      class="modal-btn-generic"
      on:click={handleLocalGame}
      data-testid="local-game-btn"
    >
      {$_("mainMenu.localGame")}
    </button>
  {/if}
</div>

{#if showWipNotice}
  <WipNotice onClose={() => (showWipNotice = false)} />
{/if}

{#if !extended}
  <DontShowAgainCheckbox tid="game-mode-modal-dont-show-again-switch" {scope} />
{/if}

<style>
  .game-mode-buttons {
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding-top: 16px;
  }
  .divider {
    border: none;
    border-top: 1px solid var(--border-color);
    margin: 0;
  }

  .mode-section-label {
    font-size: 0.9em;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: var(--text-secondary);
    text-align: center;
    margin-bottom: -8px;
    font-weight: bold;
  }

  .mode-section-label.future {
    opacity: 0.6;
    margin-top: 8px;
  }

  .future-btn {
    opacity: 0.6;
    border-style: dashed;
  }
</style>
