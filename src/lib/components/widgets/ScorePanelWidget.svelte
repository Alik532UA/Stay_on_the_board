<script lang="ts">
  import { userActionService } from '$lib/services/userActionService';
  import { modalStore } from '$lib/stores/modalStore.js';
  import { replayStore } from '$lib/stores/replayStore.js';
  import { _ } from 'svelte-i18n';
  import { customTooltip } from '$lib/actions/customTooltip.js';
  import { playerStore } from '$lib/stores/playerStore';
  import { scoreStore } from '$lib/stores/scoreStore';

  $: currentPlayer = $playerStore ? $playerStore.players[$playerStore.currentPlayerIndex] : null;
  $: isMultiplayer = $playerStore ? $playerStore.players.filter(p => p.type === 'human').length > 1 : false;
  $: players = $playerStore ? $playerStore.players : [];

  function getPlayerColor(playerName: string) {
    const player = players.find(p => p.name === playerName);
    return player ? player.color : null;
  }

  function getPlayerNameStyle(playerName: string) {
    const color = getPlayerColor(playerName);
    if (color) {
      return `background-color: ${color};`;
    }
    return '';
  }

  function showPenaltyInfo() {
    modalStore.showModal({
      titleKey: 'gameBoard.penaltyInfoTitle',
      contentKey: 'gameBoard.penaltyHint',
      buttons: [{ textKey: 'modal.ok', primary: true, isHot: true }],
      dataTestId: 'penalty-info-modal'
    });
  }

  function showBonusInfo() {
    if (currentPlayer && currentPlayer.bonusHistory && currentPlayer.bonusHistory.length > 0) {
      let bonusDetails = `Бонусні бали гравця ${currentPlayer.name}:\n\n`;
      
      currentPlayer.bonusHistory.forEach((bonus: any, index: number) => {
        const time = new Date(bonus.timestamp).toLocaleTimeString();
        bonusDetails += `${index + 1}. +${bonus.points} балів - ${bonus.reason} (${time})\n`;
      });
      
      bonusDetails += `\nЗагальна сума бонусних балів: ${currentPlayer.bonusPoints}`;
      
      modalStore.showModal({
        titleKey: 'gameBoard.bonusInfoTitle',
        content: bonusDetails,
        buttons: [{ textKey: 'modal.ok', primary: true, isHot: true }],
        dataTestId: 'bonus-info-modal'
      });
    } else {
      modalStore.showModal({
        titleKey: 'gameBoard.bonusInfoTitle',
        contentKey: 'gameBoard.bonusHint',
        buttons: [{ textKey: 'modal.ok', primary: true, isHot: true }],
        dataTestId: 'bonus-info-modal'
      });
    }
  }

  function showPlayerBonusInfo(player: any) {
    let scoreDetails = '';
    if (player.bonusPoints > 0) {
      scoreDetails += `Бонус за відстань: +${player.bonusPoints}\n`;
      scoreDetails += `Бонус за перестрибування: +0\n`;
    } else {
      scoreDetails += `Бонус за відстань: +0\n`;
      scoreDetails += `Бонус за перестрибування: +0\n`;
    }
    scoreDetails += `Штраф за зворотній хід: -${player.penaltyPoints}\n`;
    const totalScore = player.bonusPoints - player.penaltyPoints;
    scoreDetails += `\nЗагальна сума балів: ${totalScore}`;
    
    modalStore.showModal({
      title: `Поточні бали ${player.name}`,
      content: scoreDetails,
      buttons: [{ textKey: 'modal.ok', primary: true, isHot: true }],
      dataTestId: `player-score-details-modal-${player.name}`
    });
  }

  function showScoreInfo() {
    modalStore.showModal({
      titleKey: 'modal.scoreInfoTitle',
      contentKey: 'modal.scoreInfoContent',
      buttons: [{ textKey: 'modal.ok', primary: true, isHot: true }],
      dataTestId: 'score-info-modal'
    });
  }

  async function cashOutAndEndGame() {
    await userActionService.finishWithBonus('modal.gameOverReasonCashOut');
  }
</script>

{#if !$replayStore.isReplayMode && $playerStore && $scoreStore}
  <div class="score-panel game-content-block" data-testid="score-panel">
    {#if isMultiplayer}
      <div class="score-display-multiplayer">
        <div class="score-label-multiplayer">{$_('gameBoard.scoreLabel')}</div>
        {#each players as player}
          <div class="score-row">
            <span class="player-name-plate" style={getPlayerNameStyle(player.name)}>{player.name}</span>
            {#if player.bonusPoints === 0 && player.penaltyPoints === 0}
              <span
                class="score-value-clickable"
                on:click={() => showPlayerBonusInfo(player)}
                on:keydown={(e) => (e.key === 'Enter' || e.key === ' ') && showPlayerBonusInfo(player)}
                role="button"
                tabindex="0"
                use:customTooltip={"Натисніть для перегляду деталей балів"}
              >0</span>
            {/if}
            {#if player.bonusPoints > 0}
              <span
                class="bonus-display"
                on:click={() => showPlayerBonusInfo(player)}
                on:keydown={(e) => (e.key === 'Enter' || e.key === ' ') && showPlayerBonusInfo(player)}
                use:customTooltip={"Натисніть для перегляду деталей бонусних балів"}
                role="button"
                tabindex="0"
              >+{player.bonusPoints}</span>
            {/if}
            {#if player.penaltyPoints > 0}
              <span
                class="penalty-display"
                on:click={showPenaltyInfo}
                on:keydown={(e) => (e.key === 'Enter' || e.key === ' ') && showPenaltyInfo()}
                use:customTooltip={$_('gameBoard.penaltyHint')}
                role="button"
                tabindex="0"
              >-{player.penaltyPoints}</span>
            {/if}
          </div>
        {/each}
        {#if $scoreStore.penaltyPoints > 0}
          <div class="score-row">
            <span
              class="penalty-display"
              on:click={showPenaltyInfo}
              on:keydown={(e) => (e.key === 'Enter' || e.key === ' ') && showPenaltyInfo()}
              use:customTooltip={$_('gameBoard.penaltyHint')}
              role="button"
              tabindex="0"
            >Штраф: -{$scoreStore.penaltyPoints}</span>
          </div>
        {/if}
      </div>
    {:else}
      <div class="score-display">
        <span class="score-label-text">
          {$_('gameBoard.scoreLabel')}:
        </span>
        <span
          class="score-value-clickable"
          class:positive-score={$playerStore.players[0]?.score > 0}
          on:click={showScoreInfo}
          on:keydown={(e) => (e.key === 'Enter' || e.key === ' ') && showScoreInfo()}
          role="button"
          tabindex="0"
          use:customTooltip={$_('modal.scoreInfoTitle')}
          data-testid="score-value"
        >{$playerStore.players[0]?.score || 0}</span>
        {#if $scoreStore.penaltyPoints > 0}
          <span
            class="penalty-display"
            on:click={showPenaltyInfo}
            on:keydown={(e) => (e.key === 'Enter' || e.key === ' ') && showPenaltyInfo()}
            use:customTooltip={$_('gameBoard.penaltyHint')}
            role="button"
            tabindex="0"
            data-testid="penalty-display"
          >-{$scoreStore.penaltyPoints}</span>
        {/if}
      </div>
    {/if}
    <button class="cash-out-btn" on:click={cashOutAndEndGame} use:customTooltip={isMultiplayer ? $_('gameBoard.cashOutLocal') : $_('gameBoard.cashOutTooltip')} data-testid="cash-out-btn">
      {@html isMultiplayer ? $_('gameBoard.cashOutLocal') : $_('gameBoard.cashOut')}
    </button>
  </div>
{/if}

<style>
  .score-panel {
    background: var(--bg-secondary, #fff3);
    padding: 12px 16px;
    border-radius: var(--unified-border-radius);
    box-shadow: var(--unified-shadow);
    margin-bottom: 16px;
    text-align: center;
    font-size: 1.2em;
    font-weight: bold;
    color: var(--text-primary, #222);
    display: flex;
    justify-content: space-between;
    align-items: center;
    backdrop-filter: var(--unified-backdrop-filter);
    border: var(--unified-border);
  }
  .score-display {
    display: flex;
    align-items: center;
    gap: 16px;
  }
  
  .score-display-multiplayer {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .score-row {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.9em;
  }
  
  .score-label-multiplayer {
    font-weight: bold;
    margin-bottom: 4px;
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
  .bonus-display {
    color: var(--positive-score-color, #4CAF50);
    font-weight: bold;
    cursor: pointer;
    transition: color 0.2s, transform 0.2s;
    border-radius: 4px;
    padding: 2px 6px;
  }
  .bonus-display:hover {
    color: #2e7d32;
    transform: scale(1.1);
    background: rgba(76, 175, 80, 0.1);
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
    border: var(--unified-border);
    border-radius: var(--unified-border-radius);
    box-shadow: var(--dynamic-widget-shadow) var(--current-player-shadow-color);
    backdrop-filter: var(--unified-backdrop-filter);
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
    transition: all 0.3s ease;
  }
</style>