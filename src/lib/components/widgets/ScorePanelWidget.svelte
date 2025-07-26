<script>
  import { gameState } from '$lib/stores/gameState.js';
  import { gameOrchestrator } from '$lib/gameOrchestrator.js';
  import { modalStore } from '$lib/stores/modalStore.js';
  import { replayStore } from '$lib/stores/replayStore.js';
  import { _ } from 'svelte-i18n';

  function showPenaltyInfo() {
    modalStore.showModal({
      titleKey: 'gameBoard.penaltyInfoTitle',
      contentKey: 'gameBoard.penaltyHint',
      buttons: [{ textKey: 'modal.ok', primary: true, isHot: true }]
    });
  }

  function showScoreInfo() {
    modalStore.showModal({
      titleKey: 'modal.scoreInfoTitle',
      contentKey: 'modal.scoreInfoContent',
      buttons: [{ textKey: 'modal.ok', primary: true, isHot: true }]
    });
  }

  function cashOutAndEndGame() {
      gameOrchestrator.endGame('modal.gameOverReasonCashOut');
  }
</script>

<style>
  .score-panel {
    background: var(--bg-secondary, #fff3);
    padding: 12px 16px;
    border-radius: 12px;
    box-shadow: var(--unified-shadow, 0 2px 12px 0 rgba(80,0,80,0.10));
    margin-bottom: 16px;
    text-align: center;
    font-size: 1.2em;
    font-weight: bold;
    color: var(--text-primary, #222);
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .score-display {
    display: flex;
    align-items: center;
    gap: 16px;
  }
  .score-value-clickable {
    cursor: pointer;
    text-decoration: none;
    transition: color 0.2s, text-shadow 0.2s;
  }
  .score-value-clickable:hover,
  .score-value-clickable:focus {
    color: var(--text-accent, #ff9800);
    text-shadow: 0 0 8px var(--shadow-color);
    outline: none;
  }
  .positive-score {
    color: var(--positive-score-color, #4CAF50);
    font-weight: bold;
  }
  .penalty-display {
    color: var(--error-color);
    font-weight: bold;
    cursor: pointer;
    transition: color 0.2s, transform 0.2s;
    border-radius: 4px;
    padding: 2px 6px;
  }
  .penalty-display:hover {
    color: #d32f2f;
    transform: scale(1.1);
    background: rgba(244, 67, 54, 0.1);
  }
  .cash-out-btn {
    background: var(--control-selected);
    color: var(--control-selected-text);
    border: none;
    border-radius: 10px;
    padding: 8px 16px;
    font-size: 0.95em;
    font-weight: 700;
    cursor: pointer;
    transition: background 0.2s, transform 0.2s, box-shadow 0.2s;
    box-shadow: 0 2px 8px var(--shadow-color);
  }
  .cash-out-btn:hover {
    background: var(--control-hover);
    transform: scale(1.05);
    box-shadow: 0 4px 12px var(--shadow-color);
  }
  .game-content-block {
    margin-bottom: 0;
  }
</style>

{#if !$replayStore.isReplayMode}
  <div class="score-panel game-content-block">
    <div class="score-display">
      <span class="score-label-text">{$_('gameBoard.scoreLabel')}:</span>
      <span
        class="score-value-clickable"
        class:positive-score={$gameState.score > 0}
        on:click={showScoreInfo}
        on:keydown={e => (e.key === 'Enter' || e.key === ' ') && showScoreInfo()}
        role="button"
        tabindex="0"
        title={$_('modal.scoreInfoTitle')}
      >{$gameState.score}</span>
      {#if $gameState.penaltyPoints > 0}
        <span 
          class="penalty-display" 
          on:click={showPenaltyInfo}
          on:keydown={e => (e.key === 'Enter' || e.key === ' ') && showPenaltyInfo()}
          title={$_('gameBoard.penaltyHint')}
          role="button"
          tabindex="0"
        >-{$gameState.penaltyPoints}</span>
      {/if}
    </div>
    <button class="cash-out-btn" on:click={cashOutAndEndGame} title={$_('gameBoard.cashOut')}>
      {$_('gameBoard.cashOut')}
    </button>
  </div>
{/if} 