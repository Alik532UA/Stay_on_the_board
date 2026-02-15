<script lang="ts">
  import { t } from "$lib/i18n/typedI18n";
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
  import NotoEmoji from "$lib/components/NotoEmoji.svelte";

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
      modalStore.closeModal();
      userActionService.navigateToGame();
    }
  }

  // FIX: Додано ключове слово async, щоб дозволити використання await всередині
  async function showFaqModal() {
    // Для чистоти коду виносимо імпорт в змінну
    const FAQModal = (await import("./FAQModal.svelte")).default;

    modalStore.showModal({
      dataTestId: "faq-modal",
      component: FAQModal,
      variant: "menu",
      buttons: [],
      props: {
        onOk: () => {
          modalStore.closeModal();
          userActionService.navigateToGame();
        },
        onRules: () => {
          goto(`${base}/rules`);
          modalStore.closeModal();
        },
      },
    });
  }
</script>

<div class="game-mode-buttons" bind:this={buttonsNode}>
  {#if extended}
    <!-- 1. Online Game -->
    <GameModeButton
      text={$t("mainMenu.playOnline")}
      dataTestId="online-game-btn"
      on:click={handleOnlineGame}
    >
      <div slot="icon">
        <NotoEmoji name="globe_showing_europe_africa" size="100%" />
      </div>
    </GameModeButton>

    <div class="divider"></div>
  {/if}

  <!-- 2. Single Player Modes -->
  <GameModeButton
    text={$t("gameModes.beginner")}
    dataTestId="beginner-mode-btn"
    on:click={() => selectMode("beginner")}
  >
    <div slot="icon"><NotoEmoji name="hatching_chick" size="100%" /></div>
  </GameModeButton>

  <GameModeButton
    text={$t("gameModes.experienced")}
    dataTestId="experienced-mode-btn"
    on:click={() => selectMode("experienced")}
  >
    <div slot="icon"><NotoEmoji name="brain" size="100%" /></div>
  </GameModeButton>

  <GameModeButton
    text={$t("gameModes.pro")}
    dataTestId="pro-mode-btn"
    on:click={() => selectMode("pro")}
  >
    <div slot="icon"><NotoEmoji name="fire" size="100%" /></div>
  </GameModeButton>

  {#if extended}
    <GameModeButton
      text={$t("mainMenu.timedGame")}
      dataTestId="timed-game-btn"
      on:click={() => selectMode("timed")}
    >
      <div slot="icon"><NotoEmoji name="stopwatch" size="100%" /></div>
    </GameModeButton>

    <div class="divider"></div>

    <!-- 3. Local Game -->
    <GameModeButton
      text={$t("mainMenu.localGame")}
      dataTestId="local-game-btn"
      on:click={handleLocalGame}
    >
      <div slot="icon">
        <NotoEmoji name="busts_in_silhouette" size="100%" />
      </div>
    </GameModeButton>
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
    box-sizing: border-box;
    max-width: 100%;
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
