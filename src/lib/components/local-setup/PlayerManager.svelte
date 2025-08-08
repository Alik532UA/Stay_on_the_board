<script lang="ts">
  import { localGameStore } from '$lib/stores/localGameStore.js';
  import { _ } from 'svelte-i18n';
  import { get } from 'svelte/store';
  import { resetGame } from '$lib/services/gameLogicService.js';
  import { navigationService } from '$lib/services/navigationService.js';
  import ColorPicker from './ColorPicker.svelte';
  import { logService } from '$lib/services/logService.js';
  
  function startGame() {
    logService.action('Click: "Почати гру" (PlayerManager)');
    const { players, settings } = get(localGameStore);
    
    // Конвертуємо гравців з localGameStore в формат gameState
    const gamePlayers = players.map(player => ({
      id: player.id,
      name: player.name,
      type: 'human' as const
    }));
    
    // Ініціалізуємо стан гри з поточними налаштуваннями
    resetGame({
      newSize: settings.boardSize,
      players: gamePlayers,
      settings: {
        blockModeEnabled: settings.blockModeEnabled,
        autoHideBoard: settings.autoHideBoard,
        lockSettings: settings.lockSettings
      }
    });

    // Переходимо на сторінку локальної гри
    navigationService.goTo('/game/local');
  }
</script>

<div class="player-manager-card">
  <h2>{$_('localGame.playerManagerTitle')}</h2>

  <div class="player-list">
    {#each $localGameStore.players as player (player.id)}
      <div class="player-row">
        <ColorPicker 
          value={player.color}
          on:change={(e) => {
            console.log('PlayerManager: ColorPicker change event received', e.detail);
            console.log('PlayerManager: Updating player', player.id, 'color to', e.detail.value);
            localGameStore.updatePlayer(player.id, { color: e.detail.value });
          }}
        />
        <input 
          type="text" 
          class="player-name-input"
          placeholder="Ім'я гравця"
          bind:value={player.name}
          on:input={(e) => localGameStore.updatePlayer(player.id, { name: e.currentTarget.value })}
        />
        <button 
          class="remove-player-btn" 
          title={$_('localGame.removePlayer')}
          on:click={() => {
            logService.action(`Click: "Видалити гравця: ${player.name}" (PlayerManager)`);
            localGameStore.removePlayer(player.id);
          }}
          disabled={$localGameStore.players.length <= 2}
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
        localGameStore.addPlayer();
      }}
      disabled={$localGameStore.players.length >= 8}
    >
      {$_('localGame.addPlayer')}
    </button>
    <button class="start-game-btn" on:click={startGame}>
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
    width: 36px;
    height: 36px;
    border-radius: 50%;
    border: none;
    background: var(--error-color);
    color: white;
    font-size: 1.5em;
    font-weight: bold;
    cursor: pointer;
    transition: background 0.2s;
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