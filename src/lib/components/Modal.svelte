<script lang="ts">
  import "$lib/css/components/modal.css";
  import { modalState, modalStore } from "$lib/stores/modalStore";
  import { _ } from "svelte-i18n";
  import FAQModal from "./FAQModal.svelte";
  import GameOverContent from "./modals/GameOverContent.svelte";
  import { onMount, tick, onDestroy } from "svelte";
  import { audioService } from "$lib/services/audioService.js";
  import { focusManager } from "$lib/stores/focusManager.js";
  import { logService } from "$lib/services/logService";
  import hotkeyService from "$lib/services/hotkeyService";
  import { trapFocus } from "$lib/actions/trapFocus.js";
  import { uiStateStore } from "$lib/stores/uiStateStore";
  import { gameEventBus } from "$lib/services/gameEventBus";
  import { get } from "svelte/store";
  import FloatingBackButton from "$lib/components/FloatingBackButton.svelte";

  import ExpertModeVolumeControl from "./modals/parts/ExpertModeVolumeControl.svelte";
  import ModalHeader from "./modals/parts/ModalHeader.svelte";
  import ModalActionButtons from "./modals/parts/ModalActionButtons.svelte";

  let buttonRefs: (HTMLButtonElement | null)[] = [];
  let windowHeight = 0;

  onMount(() => {
    windowHeight = window.innerHeight;
    const updateHeight = () => (windowHeight = window.innerHeight);
    window.addEventListener("resize", updateHeight);
    return () => window.removeEventListener("resize", updateHeight);
  });

  let modalContent: HTMLDivElement | null = null;
  let expertVolume = 0.3;
  let currentModalContext: string | null = null;

  $: themeClass =
    $modalState.variant === "menu" ? "style-glass" : "style-classic";

  $: {
    if ($modalState.isOpen) {
      const newContext = `modal-${$modalState.dataTestId}`;
      if (currentModalContext !== newContext) {
        if (currentModalContext) hotkeyService.popContext(currentModalContext);
        currentModalContext = newContext;
        hotkeyService.pushContext(currentModalContext);

        tick().then(() => {
          if ($modalState.closable) {
            hotkeyService.register(currentModalContext!, "Escape", () => {
              logService.ui("Escape key pressed, closing modal");
              gameEventBus.dispatch("CloseModal");
            });
          }
          $modalState.buttons.forEach((btn, i) => {
            if (btn.hotKey) {
              const key = btn.hotKey === "ESC" ? "Escape" : btn.hotKey;
              hotkeyService.register(currentModalContext!, key, () => {
                buttonRefs[i]?.click();
              });
            }
          });
        });
      }
    } else {
      if (currentModalContext) {
        hotkeyService.popContext(currentModalContext);
        currentModalContext = null;
      }
    }
  }

  onDestroy(() => {
    if (currentModalContext) {
      hotkeyService.popContext(currentModalContext);
      currentModalContext = null;
    }
  });

  $: {
    const isTestEnvironment =
      import.meta.env.CI === "true" || import.meta.env.MODE === "test";
    const shouldPlay =
      $modalState.isOpen &&
      $modalState.titleKey === "modal.expertModeTitle" &&
      !isTestEnvironment;

    audioService.setVolume(expertVolume);
    audioService.saveVolume(expertVolume);

    if (shouldPlay) audioService.play();
    else audioService.pause();
  }

  $: if ($modalState.isOpen && $modalState.buttons) {
    const hotButtonIndex = $modalState.buttons.findIndex((b) => b.isHot);
    if (hotButtonIndex !== -1) {
      tick().then(() => {
        focusManager.focusWithDelay(buttonRefs[hotButtonIndex], 50);
      });
    }
  }

  function onOverlayClick(e: MouseEvent) {
    if (!$modalState.closeOnOverlayClick) return;
    const target = e.target as HTMLElement;
    if (
      target &&
      (target.classList.contains("modal-overlay") ||
        target.classList.contains("modal-window"))
    ) {
      logService.ui("Закриття модального вікна (overlay)");
      gameEventBus.dispatch("CloseModal");
    }
  }
</script>

{#if $modalState.isOpen}
  <div
    use:trapFocus
    class="modal-overlay screen-overlay-backdrop {themeClass}"
    role="button"
    tabindex="-1"
    on:click={onOverlayClick}
    on:keydown={(e) =>
      (e.key === "Enter" || e.key === " ") && onOverlayClick(e as any)}
    data-testid="modal-overlay"
  >
    <!-- FIX: Показуємо кнопку "Назад" ТІЛЬКИ якщо дозволено закриття по кліку на фон.
         Це прибирає кнопку з екранів Game Over та No Moves, змушуючи гравця обирати дію в меню. -->
    {#if $modalState.variant === "menu" && $modalState.closeOnOverlayClick}
      <FloatingBackButton onClick={() => gameEventBus.dispatch("CloseModal")} />
    {/if}

    <div
      class="modal-window {themeClass} variant-{$modalState.variant}"
      class:[$modalState.customClass]={$modalState.customClass}
      data-testid={$modalState.dataTestId}
    >
      {#if $modalState.variant === "standard" && ($modalState.titleKey || $modalState.title) && !($modalState.dataTestId === "replay-modal" && windowHeight < 870)}
        <ModalHeader modalState={$modalState}>
          <div slot="volume-control">
            {#if $modalState.titleKey === "modal.expertModeTitle"}
              <ExpertModeVolumeControl bind:expertVolume />
            {/if}
          </div>
        </ModalHeader>
      {/if}

      <div
        class="modal-content"
        class:is-faq={typeof $modalState.content === "object" &&
          $modalState.content &&
          "isFaq" in $modalState.content &&
          $modalState.content.isFaq}
        bind:this={modalContent}
        data-testid={`${$modalState.dataTestId}-content`}
      >
        <!-- FIX: Додано перевірку !$modalState.component, щоб уникнути дублювання тексту -->
        {#if typeof $modalState.content === "object" && $modalState.content && "reason" in $modalState.content && !$modalState.component}
          <p
            class="reason"
            data-testid={`${$modalState.dataTestId}-content-reason`}
            data-i18n-key={($modalState.content as any).reasonKey}
          >
            {$modalState.content.reason}
          </p>
        {/if}

        {#if $modalState.component}
          <svelte:component
            this={$modalState.component as any}
            {...$modalState.props}
            content={$modalState.content}
            dataTestId={$modalState.dataTestId}
            scope={currentModalContext}
          />
        {:else if typeof $modalState.content === "object" && $modalState.content && "isFaq" in $modalState.content && $modalState.content.isFaq}
          <FAQModal />
        {:else if typeof $modalState.content === "object" && $modalState.content && "key" in $modalState.content && "actions" in $modalState.content}
          <p class="reason">
            {$_("modal.keyConflictContent", {
              values: { key: $modalState.content.key as string },
            })}
          </p>
        {:else if $modalState.contentKey}
          <p class="reason">
            {$_($modalState.contentKey, { values: $modalState.content as any })}
          </p>
        {:else if typeof $modalState.content === "string" && $modalState.content}
          <p class="reason">{$modalState.content}</p>
        {/if}

        {#if $modalState.content && typeof $modalState.content === "object" && "scoreDetails" in $modalState.content && !$modalState.component}
          <GameOverContent content={$modalState.content} />
        {/if}
      </div>

      {#if $modalState.buttons.length > 0}
        <ModalActionButtons
          modalState={$modalState}
          {currentModalContext}
          isComputerMoveInProgress={$uiStateStore?.isComputerMoveInProgress}
          bind:buttonRefs
        >
          <slot />
        </ModalActionButtons>
      {/if}
    </div>
  </div>
{/if}

<style>
  /* Styles handled by modal.css */
</style>
