<script lang="ts">
  import "$lib/css/components/modal.css"; // Імпорт агрегатора
  import { modalState, modalStore } from "$lib/stores/modalStore";
  import { _ } from "svelte-i18n";
  import { i18nReady } from "$lib/i18n/init.js";
  import SvgIcons from "./SvgIcons.svelte";
  import FAQModal from "./FAQModal.svelte";
  import GameOverContent from "./modals/GameOverContent.svelte";
  import { onMount, tick, onDestroy } from "svelte";
  import { audioService } from "$lib/services/audioService.js";
  import DontShowAgainCheckbox from "./DontShowAgainCheckbox.svelte";
  import { focusManager } from "$lib/stores/focusManager.js";
  import { logService } from "$lib/services/logService";
  import hotkeyService from "$lib/services/hotkeyService";
  import { hotkeyTooltip } from "$lib/actions/hotkeyTooltip.js";
  import { trapFocus } from "$lib/actions/trapFocus.js";
  import { uiStateStore } from "$lib/stores/uiStateStore";
  import StyledButton from "$lib/components/ui/StyledButton.svelte";
  import { gameEventBus } from "$lib/services/gameEventBus";
  import { get } from "svelte/store";
  import FloatingBackButton from "$lib/components/FloatingBackButton.svelte";

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
  let volumePercentage = 30;
  let processingButtons: boolean[] = [];
  let currentModalContext: string | null = null;

  // === ЛОГІКА ВИБОРУ ТЕМИ ===
  // Якщо variant === 'menu', використовуємо style-glass.
  // В усіх інших випадках (включаючи undefined) - style-classic.
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

  $: if ($modalState.buttons) {
    processingButtons = Array($modalState.buttons.length).fill(false);
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
    volumePercentage = expertVolume * 100;

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
    // Перевіряємо, чи клік був саме по оверлею або по "порожньому місцю" у style-glass
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
  <!-- Додаємо themeClass до overlay -->
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
    {#if $modalState.variant === "menu"}
      <FloatingBackButton onClick={() => gameEventBus.dispatch("CloseModal")} />
    {/if}

    <!-- Додаємо themeClass до window -->
    <div
      class="modal-window {themeClass}"
      class:[$modalState.customClass]={$modalState.customClass}
      data-testid={$modalState.dataTestId}
    >
      <!-- Header: Тільки для standard variant -->
      {#if $modalState.variant === "standard" && ($modalState.titleKey || $modalState.title) && !($modalState.dataTestId === "replay-modal" && windowHeight < 870)}
        <div
          class="modal-header"
          data-testid={`${$modalState.dataTestId}-header`}
        >
          {#if $modalState.titleKey === "modal.expertModeTitle"}
            <div
              class="volume-control-container"
              style="--volume-percentage: {volumePercentage}%; position: relative;"
              data-testid="expert-mode-volume-container"
            >
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                bind:value={expertVolume}
                class="volume-slider"
                aria-label={$_("voiceSettings.volume")}
                data-testid="expert-mode-volume-slider"
              />
              <span
                class="volume-thumb-svg"
                style="left: calc((100% - 32px) * {expertVolume});"
                data-testid="expert-mode-volume-thumb"
                ><SvgIcons name="boxing-glove-pictogram-1" /></span
              >
              <span class="volume-label" data-testid="expert-mode-volume-label"
                >{$_("voiceSettings.volumeLabel")}: {volumePercentage.toFixed(
                  0,
                )}%</span
              >
            </div>
          {/if}

          <div class="modal-title-wrapper">
            <!-- FIX: Видалено іконку корони/фігури для Game Over -->
            <h2
              class="modal-title"
              data-testid={`${$modalState.dataTestId}-title`}
              data-i18n-key={$modalState.titleKey}
            >
              {#if $i18nReady && $modalState.titleKey}
                <!-- FIX: Використовуємо titleValues, якщо вони є, інакше content -->
                {$_($modalState.titleKey, {
                  values:
                    $modalState.titleValues || ($modalState.content as any),
                })}
              {:else}
                {$modalState.title}
              {/if}
            </h2>
          </div>

          {#if $modalState.closable}
            <button
              class="modal-close"
              use:hotkeyTooltip={{ key: "ESC" }}
              on:click={() => gameEventBus.dispatch("CloseModal")}
              data-testid={`${$modalState.dataTestId}-close-btn`}>×</button
            >
          {/if}
        </div>
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
        {#if typeof $modalState.content === "object" && $modalState.content && "reason" in $modalState.content}
          <p
            class="reason"
            data-testid={`${$modalState.dataTestId}-content-reason`}
            data-i18n-key={($modalState.content as any).reasonKey}
          >
            {$modalState.content.reason}
          </p>
        {/if}

        {#if $modalState.component}
          <!-- FIX: Явно передаємо content у компонент -->
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
        <div class="modal-action-buttons">
          {#each $modalState.buttons as btn, i (i)}
            <StyledButton
              variant={btn.customClass === "blue-btn"
                ? "info"
                : btn.customClass === "green-btn"
                  ? "primary"
                  : btn.customClass === "danger-btn"
                    ? "danger"
                    : btn.primary
                      ? "primary"
                      : "default"}
              bind:buttonElement={buttonRefs[i]}
              dataTestId={btn.dataTestId ||
                `${$modalState.dataTestId}-${btn.textKey || btn.text}-btn`}
              disabled={btn.disabled ||
                get(uiStateStore)?.isComputerMoveInProgress ||
                processingButtons[i]}
              on:click={async () => {
                if (
                  processingButtons[i] ||
                  get(uiStateStore)?.isComputerMoveInProgress
                )
                  return;
                processingButtons[i] = true;
                logService.action(
                  `Click: "${btn.textKey ? $_(btn.textKey) : btn.text}" (Modal)`,
                );
                if (btn.onClick) await btn.onClick();
                else gameEventBus.dispatch("CloseModal");
              }}
            >
              {$i18nReady && btn.textKey ? $_(btn.textKey) : btn.text}
            </StyledButton>
          {/each}
          {#if $modalState.titleKey === "gameModes.title"}
            <DontShowAgainCheckbox
              modalType="gameMode"
              tid={`${$modalState.dataTestId}-dont-show-again-switch`}
              scope={currentModalContext}
            />
          {:else if $modalState.titleKey === "modal.expertModeTitle"}
            <DontShowAgainCheckbox
              modalType="expertMode"
              tid={`${$modalState.dataTestId}-dont-show-again-switch`}
              scope={currentModalContext}
            />
          {/if}
          <slot />
        </div>
      {/if}
    </div>
  </div>
{/if}

<style>
  /* Styles are imported from modal.css */
</style>
