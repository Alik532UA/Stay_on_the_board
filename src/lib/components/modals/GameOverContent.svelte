<script lang="ts">
  import { t } from "$lib/i18n/typedI18n";
  import type { TranslationKey } from "$lib/types/i18n";
  import ScoreBonusExpander from "../widgets/ScoreBonusExpander.svelte";
  import NotoEmoji from "$lib/components/NotoEmoji.svelte";
  import StyledButton from "$lib/components/ui/StyledButton.svelte";
  import type {
    FinalScoreDetails,
    PlayerScoreResult,
  } from "$lib/stores/gameOverStore";

  // Props даних
  export let content: any;

  // Props налаштувань
  export let titleKey: TranslationKey = "modal.gameOverTitle";
  export let titleValues: any = {};
  export let mode: "game-over" | "no-moves" = "game-over";

  // Props колбеків (дій)
  export let onPlayAgain: (() => void) | undefined = undefined;
  export let onWatchReplay: (() => void) | undefined = undefined;
  export let onMainMenu: (() => void) | undefined = undefined;
  export let onLeaveLobby: (() => void) | undefined = undefined;
  export let onContinue: (() => void) | undefined = undefined;
  export let onFinish: (() => void) | undefined = undefined;

  // Prop для ідентифікації в тестах
  export let dataTestId: string = "game-over-modal";

  // Тексти для динамічних кнопок (наприклад, з кількістю голосів)

  export let continueText: string | undefined = undefined;
  export let finishText: string | undefined = undefined;

  let isCompactScoreMode = true;

  $: scoreDetails = content?.scoreDetails as FinalScoreDetails;
  $: totalBonus = scoreDetails
    ? (scoreDetails.sizeBonus ?? 0) +
      (scoreDetails.blockModeBonus ?? 0) +
      (scoreDetails.jumpBonus ?? 0) +
      (scoreDetails.noMovesBonus ?? 0) +
      (scoreDetails.distanceBonus ?? 0) +
      (scoreDetails.finishBonus ?? 0)
    : 0;

  $: playerScores = content?.playerScores as Array<
    PlayerScoreResult & {
      playerName: string;
      playerColor: string;
      isWinner: boolean;
      isLoser: boolean;
    }
  >;
</script>

<div class="game-over-content" data-testid="game-over-content">
  <!-- Заголовок -->
  <h2
    class="modal-title-menu"
    data-testid={`${dataTestId}-title`}
    data-i18n-key={titleKey}
  >
    {$t(titleKey, titleValues)}
  </h2>

  <!-- Причина (текст) -->
  {#if typeof content === "object" && content && "reason" in content}
    <p
      class="reason-text"
      data-testid={`${dataTestId}-content-reason`}
      data-i18n-key={content.reasonKey}
    >
      {content.reason}
    </p>
  {/if}

  <!-- Картка з результатами -->
  <div class="results-card">
    {#if playerScores && playerScores.length > 0}
      <div class="player-scores-container">
        <h3>Рахунки гравців:</h3>
        {#each playerScores as playerScore}
          <div
            class="player-score-row"
            class:winner={playerScore.isWinner}
            class:loser={playerScore.isLoser}
          >
            <div class="score-content-wrapper">
              {#if playerScore.isWinner}
                <span class="winner-badge"
                  ><NotoEmoji name="trophy" size="1.2em" /></span
                >
              {:else if playerScore.isLoser}
                <span class="loser-badge"
                  ><NotoEmoji name="spiral_shell" size="1.2em" /></span
                >
              {/if}

              <span
                class="player-name-plate"
                style={playerScore.playerColor
                  ? `background-color: ${playerScore.playerColor}`
                  : ""}
              >
                {playerScore.playerName}
              </span>

              <span class="score-value">: {playerScore.score}</span>
            </div>
          </div>
        {/each}
      </div>
    {:else if scoreDetails}
      <div
        class="score-details-container"
        data-testid="score-details-container"
      >
        <div class="score-detail-row" data-testid="base-score">
          {$t("modal.scoreDetails.baseScore")}
          <span data-testid="base-score-value"
            >{scoreDetails.baseScore ?? 0}</span
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

      {#if scoreDetails.totalPenalty > 0}
        <div class="score-detail-row penalty" data-testid="total-penalty">
          {$t("modal.scoreDetails.penalty")}
          <span data-testid="total-penalty-value"
            >-{scoreDetails.totalPenalty}</span
          >
        </div>
      {/if}

      <div class="final-score-container" class:compact={isCompactScoreMode}>
        {#if isCompactScoreMode}
          <div class="final-score-compact">
            <span class="final-score-label-inline"
              >{$t("modal.scoreDetails.finalScore")}</span
            >
            <span
              class="final-score-value-inline"
              data-testid="final-score-value"
            >
              {scoreDetails.totalScore ?? 0}
            </span>
          </div>
        {:else}
          <div class="final-score-label">
            {$t("modal.scoreDetails.finalScore")}
          </div>
          <div class="final-score-value" data-testid="final-score-value">
            {scoreDetails.totalScore ?? 0}
          </div>
        {/if}
      </div>
    {/if}
  </div>

  <!-- КНОПКИ ДІЙ (Інтегровані в контент) -->
  <div class="actions-column">
    {#if mode === "no-moves"}
      <!-- Кнопки для ситуації "Немає ходів" -->
      {#if onContinue}
        <StyledButton
          variant="primary"
          size="large"
          on:click={onContinue}
          dataTestId="continue-game-no-moves-btn"
        >
          {continueText || $t("modal.continueGame")}
        </StyledButton>
      {/if}

      {#if onFinish}
        <StyledButton
          variant="default"
          on:click={onFinish}
          dataTestId="finish-game-with-bonus-btn"
        >
          {finishText || $t("modal.finishGameWithBonus")}
        </StyledButton>
      {/if}
    {:else}
      <!-- Кнопки для ситуації "Game Over" -->
      {#if onPlayAgain}
        <StyledButton
          variant="primary"
          size="large"
          on:click={onPlayAgain}
          dataTestId="play-again-btn"
        >
          {$t("modal.playAgain")}
        </StyledButton>
      {/if}
    {/if}

    <!-- Спільна кнопка перегляду запису -->
    {#if onWatchReplay}
      <StyledButton
        variant="info"
        on:click={onWatchReplay}
        dataTestId="watch-replay-btn"
      >
        {$t("modal.watchReplay")}
      </StyledButton>
    {/if}

    <!-- Кнопка виходу з лобі (тільки для Online) -->
    {#if onLeaveLobby}
      <StyledButton
        variant="danger"
        on:click={onLeaveLobby}
        dataTestId="leave-lobby-btn"
      >
        {$t("modal.leaveLobby")}
      </StyledButton>
    {/if}

    <!-- Кнопка головного меню (тільки для Game Over) -->
    {#if mode === "game-over" && onMainMenu}
      <StyledButton
        variant="default"
        on:click={onMainMenu}
        dataTestId="game-over-main-menu-btn"
      >
        {$t("modal.mainMenu")}
      </StyledButton>
    {/if}
  </div>
</div>

<style>
  .game-over-content {
    display: flex;
    flex-direction: column;
    gap: 20px;
    width: 100%;
    box-sizing: border-box;
  }

  .modal-title-menu {
    text-align: center;
    font-size: 1.8em;
    font-weight: 800;
    color: #fff;
    margin: 0;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
    white-space: pre-line;
  }

  .reason-text {
    text-align: center;
    color: rgba(255, 255, 255, 0.9);
    font-size: 1.1em;
    margin: 0;
    white-space: pre-line;
  }

  .results-card {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 16px;
    padding: 16px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    width: 100%;
    box-sizing: border-box;
  }

  .actions-column {
    display: flex;
    flex-direction: column;
    gap: 12px;
    width: 100%;
    margin-top: 10px;
  }

  /* Стилі для таблиці результатів */
  .player-scores-container {
    margin-bottom: 0;
    padding: 0;
    background: transparent;
    border: none;
  }
  .player-scores-container h3 {
    margin: 0 0 10px 0;
    font-size: 1.1em;
    color: #fff;
  }
  .player-score-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }
  .player-score-row:last-child {
    border-bottom: none;
  }
  .score-content-wrapper {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 6px;
    width: 100%;
  }
  .winner-badge,
  .loser-badge {
    margin-right: 10px;
    display: inline-flex;
    align-items: center;
  }
  .player-name-plate {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 12px;
    color: #ffffff;
    font-weight: bold;
    text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.6);
    border: 1px solid rgba(255, 255, 255, 0.3);
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  }
  .score-value {
    font-weight: bold;
    white-space: nowrap;
    margin-left: 4px;
    color: #fff;
  }

  /* Стилі для деталей рахунку */
  .score-details-container {
    background: rgba(0, 0, 0, 0.2);
    border-radius: 12px;
    padding: 12px 16px;
    margin-bottom: 20px;
  }
  .score-detail-row {
    display: flex;
    justify-content: space-between;
    padding: 8px 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    font-size: 1em;
    color: rgba(255, 255, 255, 0.7);
  }
  .score-detail-row.penalty span {
    color: var(--error-color);
  }
  .score-detail-row span {
    font-weight: bold;
    color: #fff;
  }
  .final-score-container {
    background: rgba(0, 0, 0, 0.3);
    border-radius: 12px;
    padding: 16px;
    text-align: center;
  }
  .final-score-container.compact {
    padding: 12px;
  }
  .final-score-compact {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
  }
  .final-score-label-inline {
    font-size: 1em;
    color: rgba(255, 255, 255, 0.7);
    font-weight: 500;
  }
  .final-score-value-inline {
    font-size: 2.2em;
    font-weight: 700;
    color: #fff;
    line-height: 1;
  }
  .final-score-label {
    font-size: 1em;
    color: rgba(255, 255, 255, 0.7);
    margin-bottom: 8px;
  }
  .final-score-value {
    font-size: 2.8em;
    font-weight: 700;
    color: #fff;
    line-height: 1;
  }
</style>
