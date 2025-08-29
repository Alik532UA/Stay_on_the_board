<script lang="ts">
  import { derived } from 'svelte/store';
  import { gameSettingsStore } from '$lib/stores/gameSettingsStore.js';
  import { _ } from 'svelte-i18n';
  import { lastComputerMove, lastPlayerMove, isPlayerTurn, isPauseBetweenMoves } from '$lib/stores/derivedState.ts';
  import { i18nReady } from '$lib/i18n/init.js';
  import { fade, slide } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';
  import { playerStore } from '$lib/stores/playerStore';
  import { uiStateStore } from '$lib/stores/uiStateStore';

  // --- Допоміжні функції ---
  function getPlayerColor(players: any[], playerName: string): string | null {
    const player = players.find(p => p.name === playerName);
    return player ? player.color : null;
  }

  function getPlayerNameStyle(players: any[], playerName: string): string {
    const color = getPlayerColor(players, playerName);
    return color ? `background-color: ${color};` : '';
  }

  const directionArrows: Record<string, string> = {
    'up-left': '↖', 'up': '↑', 'up-right': '↗',
    'left': '←', 'right': '→',
    'down-left': '↙', 'down': '↓', 'down-right': '↘'
  };

  // --- Derived стор для генерації повідомлень ---
  const displayMessage = derived(
    [playerStore, uiStateStore, lastComputerMove, lastPlayerMove, isPlayerTurn, isPauseBetweenMoves, _, gameSettingsStore],
    ([$playerStore, $uiStateStore, $lastComputerMove, $lastPlayerMove, $isPlayerTurn, $isPauseBetweenMoves, $_, $gameSettingsStore]) => {
      if (!$playerStore || !$uiStateStore) return '';

      const isCompact = $gameSettingsStore.showGameInfoWidget === 'compact';
      const humanPlayersCount = $playerStore.players.filter((p: any) => p.type === 'human').length;
      const isLocalGame = humanPlayersCount > 1;

      if ($uiStateStore.isGameOver) return $_('gameBoard.gameInfo.gameOver');
      if ($uiStateStore.isFirstMove) {
        if (isLocalGame) {
          const currentPlayer = $playerStore.players[$playerStore.currentPlayerIndex];
          const playerStyle = getPlayerNameStyle($playerStore.players, currentPlayer.name);
          return `Гра почалась!<br><div><span class="player-name-plate" style="${playerStyle}">${currentPlayer.name}</span>, ваша черга робити хід</div>`;
        }
        return $_('gameBoard.gameInfo.firstMove');
      }
      
      if ($lastComputerMove && !$isPauseBetweenMoves) {
        const directionKey = $lastComputerMove.direction.replace(/-(\w)/g, (_: string, c: string) => c.toUpperCase());
        const direction = $_(`gameBoard.directions.${directionKey}`);
        const distance = $lastComputerMove.distance;

        if (isCompact) {
          const arrow = directionArrows[$lastComputerMove.direction] || '?';
          return {
            isCompact: true,
            part1: $_('gameBoard.gameInfo.computerMadeMovePart1'),
            move: `${arrow}${distance}`,
            part2: $_('gameBoard.gameInfo.computerMadeMovePart2')
          };
        }
        return $_('gameBoard.gameInfo.computerMadeMove', { values: { direction, distance } });
      }

      if ($lastPlayerMove && !$isPauseBetweenMoves && isLocalGame) {
        const currentPlayer = $playerStore.players[$playerStore.currentPlayerIndex];
        const previousPlayerIndex = ($playerStore.currentPlayerIndex + $playerStore.players.length - 1) % $playerStore.players.length;
        const previousPlayer = $playerStore.players[previousPlayerIndex];
        const previousPlayerStyle = getPlayerNameStyle($playerStore.players, previousPlayer.name);
        const currentPlayerStyle = getPlayerNameStyle($playerStore.players, currentPlayer.name);
        const directionKey = $lastPlayerMove.direction.replace(/-(\w)/g, (_: string, c: string) => c.toUpperCase());
        const direction = $_(`gameBoard.directions.${directionKey}`);
        return `<div class="message-line-1"><span class="player-name-plate" style="${previousPlayerStyle}">${previousPlayer.name}</span> зробив хід: ${direction} на ${$lastPlayerMove.distance}.</div><div class="message-line-2"><span class="player-name-plate" style="${currentPlayerStyle}">${currentPlayer.name}</span> ваша черга робити хід!</div>`;
      }

      if ($isPauseBetweenMoves) return $_('gameBoard.gameInfo.pauseBetweenMoves');

      if ($isPlayerTurn) {
        if (isLocalGame) {
          const currentPlayer = $playerStore.players[$playerStore.currentPlayerIndex];
          const currentPlayerStyle = getPlayerNameStyle($playerStore.players, currentPlayer.name);
          return `Хід гравця: <span class="player-name-plate" style="${currentPlayerStyle}">${currentPlayer.name}</span>`;
        }
        return $_('gameBoard.gameInfo.playerTurn');
      }

      if (!$isPlayerTurn) return $_('gameBoard.gameInfo.computerTurn');

      return $_('gameBoard.gameInfo.gameStarted');
    }
  );
</script>


{#if $i18nReady && $uiStateStore && $playerStore}
  {#if $gameSettingsStore.showGameInfoWidget !== 'hidden'}
    <div class="game-info-widget"
         class:compact={$gameSettingsStore.showGameInfoWidget === 'compact'}
         transition:slide={{ duration: 400, easing: quintOut }}
         data-testid="game-info-panel"
    >
      <div class="game-info-content" data-testid="game-info-content">
        {#key $displayMessage}
          <div class="fade-wrapper" in:fade={{ duration: 250, delay: 250 }} out:fade={{ duration: 250 }}>
            {#if typeof $displayMessage === 'object' && $displayMessage.isCompact}
              <div class="compact-message-line">
                <span>{$displayMessage.part1}</span>
                <span class="compact-move-display">{$displayMessage.move}</span>
              </div>
              <span>{$displayMessage.part2}</span>
            {:else}
              {@html $displayMessage}
            {/if}
          </div>
        {/key}
      </div>
    </div>
  {/if}
{/if}

<style>
  .game-info-widget {
    background: var(--bg-secondary);
    padding: 20px 12px;
    border-radius: var(--unified-border-radius);
    box-shadow: var(--dynamic-widget-shadow) var(--current-player-shadow-color);
    font-size: 1.1em;
    color: var(--text-primary, #222);
    display: flex;
    align-items: center;
    justify-content: center;
    backdrop-filter: var(--unified-backdrop-filter);
    border: var(--unified-border);
    /* overflow: hidden; -- видаляємо, щоб slide працював коректно */
  }

  .game-info-content {
    font-weight: 500;
    line-height: 1.4;
    width: 100%;
    word-wrap: break-word;
    white-space: pre-line;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    position: relative; /* Батьківський елемент для абсолютно позиціонованої обгортки */
    min-height: 50px; /* Задаємо мінімальну висоту, щоб уникнути стрибків розміру */
  }

  .fade-wrapper {
    /* Робимо обгортку абсолютною, щоб стара і нова версії могли анімуватися одна над одною */
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 100%;
  }

  :global(.message-line-1), :global(.message-line-2) {
    text-align: center;
    width: 100%;
  }

  :global(.player-name-plate) {
   display: inline-block;
   padding: 0px 8px;
   border-radius: 12px;
   color: #ffffff;
   font-weight: bold;
   text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.6);
   border: 1px solid rgba(255, 255, 255, 0.3);
   box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
   transition: all 0.3s ease;
  }

  :global(.compact-move-display) {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: orange !important;
    color: #fff !important;
    font-weight: bold !important;
    border-radius: 12px;
    padding: 2px 10px;
    margin: 0 4px;
    font-family: 'M PLUS Rounded 1c', sans-serif !important;
    min-width: 40px;
    min-height: 28px;
    font-size: 1.1em;
  }

  .compact-message-line {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    flex-wrap: wrap;
  }
</style>