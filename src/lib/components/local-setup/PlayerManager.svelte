<script lang="ts">
  import { gameState } from '$lib/stores/gameState';
  import { _ } from 'svelte-i18n';
  import { get } from 'svelte/store';
  import { navigationService } from '$lib/services/navigationService.js';
  import ColorPicker from './ColorPicker.svelte';
  import { logService } from '$lib/services/logService.js';
  
  function startGame() {
    logService.action('Click: "Почати гру" (PlayerManager)');
    const state = get(gameState);
    
    // Ініціалізуємо стан гри з поточними гравцями та налаштуваннями
    gameState.reset({
      size: state.settings.boardSize,
      players: state.players,
    });

    // Робимо знімок початкових (нульових) рахунків перед стартом
    gameState.snapshotScores();

    // Переходимо на сторінку локальної гри
    navigationService.goTo('/game/local');
  }
</script>

<div class="player-manager-card">
  <h2 data-testid="player-manager-title">{$_('localGame.playerManagerTitle')}</h2>

  <div class="player-list">
    {#each $gameState.players as player (player.id)}
      <div class="player-row">
        <ColorPicker
          value={player.color}
          on:change={(e) => {
            gameState.updatePlayer(player.id, { color: e.detail.value });
          }}
        />
        <button
          class="player-type-btn"
          title={$_('localGame.togglePlayerType')}
          on:click={() => gameState.updatePlayer(player.id, { type: player.type === 'human' ? 'computer' : 'human' })}
        >
          {player.type === 'computer' ? '🤖' : '👤'}
        </button>
        <input
          type="text"
          class="player-name-input"
          placeholder="Ім'я гравця"
          bind:value={player.name}
          on:input={(e) => gameState.updatePlayer(player.id, { name: e.currentTarget.value })}
          data-testid="player-name-input-{player.id}"
        />
        <button
          class="remove-player-btn"
          title={$_('localGame.removePlayer')}
          on:click={() => {
            logService.action(`Click: "Видалити гравця: ${player.name}" (PlayerManager)`);
            gameState.removePlayer(player.id);
          }}
          disabled={$gameState.players.length <= 2}
          data-testid="remove-player-btn-{player.id}"
        >
          ×
        </button>
      </div>
    {/each}
  </div>

  <div class="manager-actions">
    <button
      class="add-player-btn"
      on:click={() => {
        logService.action('Click: "Додати гравця" (PlayerManager)');
        gameState.addPlayer();
      }}
      disabled={$gameState.players.length >= 8}
      data-testid="add-player-btn"
    >
      {$_('localGame.addPlayer')}
    </button>
    <button class="start-game-btn" on:click={startGame} data-testid="start-game-btn">
      {$_('localGame.startGame')}
    </button>
  </div>
</div>

<style>
  .player-manager-card {
    background: var(--bg-secondary);
    padding: 24px;
    border-radius: var(--unified-border-radius);
    box-shadow: var(--unified-shadow);
    border: var(--unified-border);
    display: flex;
    flex-direction: column;
    gap: 20px;
  }
  h2 {
    text-align: center;
    margin: 0 0 10px 0;
    color: var(--text-primary);
  }
  .player-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .player-row {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .player-type-btn {
    width: 40px;
    height: 40px;
    padding: 0;
    border-radius: 8px;
    border: 1.5px solid var(--border-color);
    background: var(--bg-primary);
    color: var(--text-primary);
    font-size: 1.5em;
    cursor: pointer;
    transition: background 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .player-name-input {
    flex-grow: 1;
    padding: 10px 14px;
    border-radius: 8px;
    border: 1.5px solid var(--border-color);
    background: var(--bg-primary);
    color: var(--text-primary);
    font-size: 1em;
  }
  .remove-player-btn {
    width: 32px;
    height: 32px;
    min-height: 32px;
    max-height: 32px;
    padding: 0;
    border-radius: 50%;
    border: none;
    background: var(--error-color);
    color: white;
    font-size: 1.5em;
    font-weight: bold;
    cursor: pointer;
    transition: background 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0; /* Prevent the button from shrinking */
    align-self: center;
  }
  .remove-player-btn:disabled {
    background: var(--disabled-bg);
    cursor: not-allowed;
    opacity: 0.5;
  }
  .manager-actions {
    margin-top: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .add-player-btn, .start-game-btn {
    padding: 12px;
    font-size: 1.1em;
    font-weight: bold;
    border-radius: 10px;
    border: none;
    cursor: pointer;
    transition: background 0.2s, transform 0.1s;
  }
  .add-player-btn {
    background: var(--control-bg);
    color: var(--text-primary);
  }
  .add-player-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .start-game-btn {
    background: var(--confirm-action-bg);
    color: var(--confirm-action-text);
  }
</style> 