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
  import WipNotice from "./main-menu/WipNotice.svelte";
  import GameModeButton from "$lib/components/game-modes/GameModeButton.svelte";

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

  export let scope: string;
  export let extended = false;
  let buttonsNode: HTMLElement;

  onMount(() => {
    if (buttonsNode) {
      // Знаходимо кнопки всередині компонента GameModeButton
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
        showFaqModal();
      } else {
        userActionService.navigateToGame();
        modalStore.closeModal();
      }
      return;
    }

    if (mode === "beginner") {
      showFaqModal();
    } else {
      logService.modal(
        `[GameModeModal] ${mode} mode selected. Closing current modal and navigating.`,
      );
      modalStore.closeModal();
      userActionService.navigateToGame();
    }
  }

  function showFaqModal() {
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
  }
</script>

<!-- FIX: Видалено заголовок "Втримайся" -->

<div class="game-mode-buttons" bind:this={buttonsNode}>
  {#if extended}
    <!-- 1. Online Game (Top Priority) -->
    <GameModeButton
      icon="🌍"
      text={$_("mainMenu.playOnline")}
      dataTestId="online-game-btn"
      on:click={handleOnlineGame}
    />

    <div class="divider"></div>
  {/if}

  <!-- 2. Single Player Modes -->
  <GameModeButton
    icon="🐣"
    text={$_("gameModes.beginner")}
    dataTestId="beginner-mode-btn"
    on:click={() => selectMode("beginner")}
  />

  <GameModeButton
    icon="🧠"
    text={$_("gameModes.experienced")}
    dataTestId="experienced-mode-btn"
    on:click={() => selectMode("experienced")}
  />

  <GameModeButton
    icon="🔥"
    text={$_("gameModes.pro")}
    dataTestId="pro-mode-btn"
    on:click={() => selectMode("pro")}
  />

  {#if extended}
    <GameModeButton
      icon="⏱️"
      text={$_("mainMenu.timedGame")}
      dataTestId="timed-game-btn"
      on:click={() => selectMode("timed")}
    />

    <div class="divider"></div>

    <!-- 3. Local Game -->
    <GameModeButton
      icon="👥"
      text={$_("mainMenu.localGame")}
      dataTestId="local-game-btn"
      on:click={handleLocalGame}
    />
  {/if}
</div>

{#if showWipNotice}
  <WipNotice onClose={() => (showWipNotice = false)} />
{/if}

{#if !extended}
  <div class="checkbox-wrapper">
    <DontShowAgainCheckbox
      modalType="gameMode"
      tid={`${$modalStore.dataTestId}-dont-show-again-switch`}
      {scope}
    />
  </div>
{/if}

<style>
  .game-mode-buttons {
    display: flex;
    flex-direction: column;
    gap: 12px;
    width: 100%;
    /* FIX: Додано box-sizing та max-width для запобігання розпиранню */
    box-sizing: border-box;
    max-width: 100%;
    /* Центрування, якщо контейнер ширший за контент */
    margin: 0 auto;
  }

  .divider {
    height: 1px;
    background: rgba(255, 255, 255, 0.15);
    margin: 8px 0;
    width: 100%;
  }

  .checkbox-wrapper {
    margin-top: 20px;
    display: flex;
    justify-content: center;
    width: 100%;
    box-sizing: border-box;
  }
</style>
