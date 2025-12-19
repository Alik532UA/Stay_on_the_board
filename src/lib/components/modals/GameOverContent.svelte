<script lang="ts">
  import { _ } from "svelte-i18n";
  import ScoreBonusExpander from "../widgets/ScoreBonusExpander.svelte";
  import type {
    FinalScoreDetails,
    PlayerScoreResult,
  } from "$lib/stores/gameOverStore";

  export let content: any;
  export let isCompactScoreMode = true;

  // Helper to calculate total bonus
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

{#if playerScores && playerScores.length > 0}
  <!-- Multiplayer Score View -->
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
{:else if scoreDetails}
  <!-- Single Player Score View -->
  <div class="score-details-container" data-testid="score-details-container">
    <div class="score-detail-row" data-testid="base-score">
      {$_("modal.scoreDetails.baseScore")}
      <span data-testid="base-score-value">{scoreDetails.baseScore ?? 0}</span>
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
      {$_("modal.scoreDetails.penalty")}
      <span data-testid="total-penalty-value">-{scoreDetails.totalPenalty}</span
      >
    </div>
  {/if}

  <div class="final-score-container" class:compact={isCompactScoreMode}>
    {#if isCompactScoreMode}
      <div class="final-score-compact">
        <span class="final-score-label-inline"
          >{$_("modal.scoreDetails.finalScore")}</span
        >
        <span class="final-score-value-inline" data-testid="final-score-value">
          {scoreDetails.totalScore ?? 0}
        </span>
      </div>
    {:else}
      <div class="final-score-label">{$_("modal.scoreDetails.finalScore")}</div>
      <div class="final-score-value" data-testid="final-score-value">
        {scoreDetails.totalScore ?? 0}
      </div>
    {/if}
  </div>
{/if}

<style>
  /* Styles extracted from Modal.svelte */
  .player-scores-container {
    margin-bottom: 20px;
    padding: 15px;
    background: var(--bg-secondary);
    border-radius: var(--unified-border-radius);
    border: var(--unified-border);
  }
  .player-scores-container h3 {
    margin: 0 0 10px 0;
    font-size: 1.1em;
    color: var(--text-primary);
  }
  .player-score-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 0;
    border-bottom: 1px solid var(--border-color);
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
    font-size: 1.2em;
  }
  .player-name-plate {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 12px;
    color: #ffffff;
    font-weight: bold;
    text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.6);
    border: var(--global-border-width) solid rgba(255, 255, 255, 0.3);
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  }
  .score-value {
    font-weight: bold;
    white-space: nowrap;
    margin-left: 4px;
  }
  .score-details-container {
    background: rgba(0, 0, 0, 0.1);
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
    color: var(--text-secondary);
  }
  .score-detail-row.penalty span {
    color: var(--error-color);
  }
  .score-detail-row span {
    font-weight: bold;
    color: var(--text-primary);
  }
  .final-score-container {
    background: rgba(0, 0, 0, 0.2);
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
    color: var(--text-secondary);
    font-weight: 500;
  }
  .final-score-value-inline {
    font-size: 2.2em;
    font-weight: 700;
    color: var(--text-primary);
    line-height: 1;
  }
  .final-score-label {
    font-size: 1em;
    color: var(--text-secondary);
    margin-bottom: 8px;
  }
  .final-score-value {
    font-size: 2.8em;
    font-weight: 700;
    color: var(--text-primary);
    line-height: 1;
  }
</style>
