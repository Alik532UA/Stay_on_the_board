<script lang="ts">
  import "$lib/css/components/modal.css";
  import { modalState, modalStore } from "$lib/stores/modalStore";
  import { get } from "svelte/store";
  import { _ } from "svelte-i18n";
  import { i18nReady } from "$lib/i18n/init.js";
  import SvgIcons from "./SvgIcons.svelte";
  import FAQModal from "./FAQModal.svelte";
  import { onMount, tick, onDestroy } from "svelte";
  import { audioService } from "$lib/services/audioService.js";
  import DontShowAgainCheckbox from "./DontShowAgainCheckbox.svelte";
  import { focusManager } from "$lib/stores/focusManager.js";
  import { logService } from "$lib/services/logService";
  import hotkeyService from "$lib/services/hotkeyService";
  import { hotkeyTooltip } from "$lib/actions/hotkeyTooltip.js";
  import { trapFocus } from "$lib/actions/trapFocus.js";
  import { uiStateStore } from "$lib/stores/uiStateStore";
  import ScoreBonusExpander from "./widgets/ScoreBonusExpander.svelte";
  import StyledButton from "$lib/components/ui/StyledButton.svelte";
  import { gameEventBus } from "$lib/services/gameEventBus"; // FIX: Імпорт шини подій

  let buttonRefs: (HTMLButtonElement | null)[] = [];
  let windowHeight = 0;

  onMount(() => {
    windowHeight = window.innerHeight;
    const updateHeight = () => (windowHeight = window.innerHeight);
    window.addEventListener("resize", updateHeight);

    return () => {
      window.removeEventListener("resize", updateHeight);
    };
  });
  let modalContent: HTMLDivElement | null = null;

  let expertVolume = 0.3;
  let volumePercentage = 30;
  let isCompactScoreMode = true;
  let processingButtons: boolean[] = [];
  let currentModalContext: string | null = null;

  // Use a reactive statement to manage the hotkey context
  $: {
    if ($modalState.isOpen) {
      const newContext = `modal-${$modalState.dataTestId}`;
      if (currentModalContext !== newContext) {
        if (currentModalContext) {
          hotkeyService.popContext(currentModalContext);
        }
        currentModalContext = newContext;
        hotkeyService.pushContext(currentModalContext);

        tick().then(() => {
          if ($modalState.closable) {
            hotkeyService.register(currentModalContext!, "Escape", () => {
              logService.ui("Escape key pressed, closing modal");
              // FIX: Використовуємо EventBus для закриття
              gameEventBus.dispatch("CloseModal");
            });
          }

          $modalState.buttons.forEach((btn, i) => {
            if (btn.hotKey) {
              const key = btn.hotKey === "ESC" ? "Escape" : btn.hotKey;
              hotkeyService.register(currentModalContext!, key, () => {
                const buttonElement = buttonRefs[i];
                buttonElement?.click();
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

    if (shouldPlay) {
      audioService.play();
    } else {
      audioService.pause();
    }
  }

  $: if ($modalState.isOpen && $modalState.buttons) {
    const hotButtonIndex = $modalState.buttons.findIndex((b) => b.isHot);
    if (hotButtonIndex !== -1) {
      tick().then(() => {
        const hotButtonElement = buttonRefs[hotButtonIndex];
        if (hotButtonElement) {
          focusManager.focusWithDelay(hotButtonElement, 50);
        }
      });
    }
  }

  function onOverlayKeyDown(e: KeyboardEvent) {
    if (e.key === "Enter" || e.key === " ") {
      onOverlayClick(e as any);
    }
  }

  function onOverlayClick(e: MouseEvent) {
    if (!$modalState.closeOnOverlayClick) return;
    const target = e.target as HTMLElement;
    if (target && target.classList.contains("modal-overlay")) {
      logService.ui("Закриття модального вікна (overlay)");
      // FIX: Використовуємо EventBus для закриття
      gameEventBus.dispatch("CloseModal");
    }
  }
</script>

{#if $modalState.isOpen}
  <div
    use:trapFocus
    class="modal-overlay screen-overlay-backdrop"
    role="button"
    tabindex="-1"
    on:click={onOverlayClick}
    on:keydown={onOverlayKeyDown}
    data-testid="modal-overlay"
  >
    <div
      class="modal-window"
      class:[$modalState.customClass]={$modalState.customClass}
      data-testid={$modalState.dataTestId}
    >
      {#if ($modalState.titleKey || $modalState.title) && !($modalState.dataTestId === "replay-modal" && windowHeight < 870)}
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
              >
                <SvgIcons name="boxing-glove-pictogram-1" />
              </span>
              <span class="volume-label" data-testid="expert-mode-volume-label"
                >{$_("voiceSettings.volumeLabel")}: {volumePercentage.toFixed(
                  0,
                )}%</span
              >
            </div>
          {/if}

          <div class="modal-title-wrapper">
            {#if $modalState.titleKey === "modal.gameOverTitle"}
              <span class="modal-victory-icon"><SvgIcons name="piece" /></span>
            {/if}
            <h2
              class="modal-title"
              data-testid={`${$modalState.dataTestId}-title`}
              data-i18n-key={$modalState.titleKey}
            >
              {#if $i18nReady && $modalState.titleKey}
                {$_($modalState.titleKey, {
                  values: $modalState.content as any,
                })}
              {:else}
                {$modalState.title}
              {/if}
            </h2>
          </div>

          {#if !(($modalState.buttons && $modalState.buttons.length === 2 && $modalState.buttons.every((btn) => typeof btn.onClick === "function")) || ($modalState.titleKey && ["modal.gameOverTitle", "modal.trainingOverTitle", "modal.winnerTitle", "modal.drawTitle"].includes($modalState.titleKey)) || ($modalState.buttons && $modalState.buttons.length === 1))}
            {#if $modalState.closable}
              <button
                class="modal-close"
                use:hotkeyTooltip={{ key: "ESC" }}
                on:click={() => {
                  logService.ui("Закриття модального вікна (X)");
                  // FIX: Використовуємо EventBus для закриття
                  gameEventBus.dispatch("CloseModal");
                }}
                data-testid={`${$modalState.dataTestId}-close-btn`}>×</button
              >
            {/if}
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
          <svelte:component
            this={$modalState.component as any}
            {...$modalState.props}
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
            {$_($modalState.contentKey, {
              values: $modalState.content as any,
            })}
          </p>
        {:else if typeof $modalState.content === "string" && $modalState.content}
          <p class="reason">
            {$modalState.content}
          </p>
        {/if}

        {#if $modalState.content && typeof $modalState.content === "object" && "scoreDetails" in $modalState.content && !$modalState.component}
          {#if ($modalState.content as any)?.playerScores && ($modalState.content as any).playerScores.length > 0}
            <div class="player-scores-container">
              <h3>Рахунки гравців:</h3>
              {#each ($modalState.content as any).playerScores as playerScore}
                <div
                  class="player-score-row"
                  class:winner={playerScore.isWinner}
                  class:loser={playerScore.isLoser}
                >
                  <div class="score-content-wrapper">
                    {#if playerScore.isWinner}
                      <span class="winner-badge">🏆</span>
                    {:else if playerScore.isLoser}
                      <span class="loser-badge">🐚</span>
                    {/if}

                    <span
                      class="player-name-plate"
                      style={playerScore.playerColor
                        ? `background-color: ${playerScore.playerColor}`
                        : ""}
                    >
                      {playerScore.playerName}
                    </span>

                    <span class="score-value">
                      : {playerScore.score}
                    </span>
                  </div>
                </div>
              {/each}
            </div>
          {:else}
            {@const scoreDetails = ($modalState.content as any)?.scoreDetails}
            {@const totalBonus =
              (scoreDetails?.sizeBonus ?? 0) +
              (scoreDetails?.blockModeBonus ?? 0) +
              (scoreDetails?.jumpBonus ?? 0) +
              (scoreDetails?.noMovesBonus ?? 0) +
              (scoreDetails?.distanceBonus ?? 0) +
              (scoreDetails?.finishBonus ?? 0)}

            <div
              class="score-details-container"
              data-testid="score-details-container"
            >
              <div class="score-detail-row" data-testid="base-score">
                {$_("modal.scoreDetails.baseScore")}
                <span data-testid="base-score-value"
                  >{scoreDetails?.baseScore ?? scoreDetails?.score ?? 0}</span
                >
              </div>
            </div>

            {#if totalBonus > 0}
              <ScoreBonusExpander
                bonusDetails={scoreDetails}
                {totalBonus}
                expanded={!isCompactScoreMode}
              />
            {/if}

            {#if scoreDetails?.totalPenalty > 0}
              <div class="score-detail-row penalty" data-testid="total-penalty">
                {$_("modal.scoreDetails.penalty")}
                <span data-testid="total-penalty-value"
                  >-{scoreDetails?.totalPenalty}</span
                >
              </div>
            {/if}

            <div
              class="final-score-container"
              class:compact={isCompactScoreMode}
            >
              {#if isCompactScoreMode}
                <div class="final-score-compact">
                  <span class="final-score-label-inline"
                    >{$_("modal.scoreDetails.finalScore")}</span
                  >
                  <span
                    class="final-score-value-inline"
                    data-testid="final-score-value"
                    >{scoreDetails?.totalScore ??
                      scoreDetails?.score ??
                      0}</span
                  >
                </div>
              {:else}
                <div class="final-score-label">
                  {$_("modal.scoreDetails.finalScore")}
                </div>
                <div class="final-score-value" data-testid="final-score-value">
                  {scoreDetails?.totalScore ?? scoreDetails?.score ?? 0}
                </div>
              {/if}
            </div>
          {/if}
        {/if}
      </div>
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
              const $uiState = get(uiStateStore);
              if (
                processingButtons[i] ||
                ($uiState && $uiState.isComputerMoveInProgress)
              )
                return;
              processingButtons[i] = true;

              logService.action(
                `Click: "${btn.textKey ? $_(btn.textKey) : btn.text}" (Modal)`,
              );
              if (btn.onClick) {
                await btn.onClick();
              } else {
                // FIX: Використовуємо EventBus для закриття
                gameEventBus.dispatch("CloseModal");
              }
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
    </div>
  </div>
{/if}

<style>
  /* Основні стилі винесено в src/lib/css/components/modal.css */
</style>
