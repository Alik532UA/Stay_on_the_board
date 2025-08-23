<script lang="ts">
  import { derived } from 'svelte/store';
  import { gameState } from '$lib/stores/gameState.js';
  import { playerInputStore } from '$lib/stores/playerInputStore.js';
  import { settingsStore } from '$lib/stores/settingsStore.js';
  import { _ } from 'svelte-i18n';
  import { lastComputerMove, lastPlayerMove, isPlayerTurn, isPauseBetweenMoves } from '$lib/stores/derivedState.ts';
  import { i18nReady } from '$lib/i18n/init.js';
  import { slide, scale } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';
  import { safeScale } from '$lib/utils/transitions';

  // Функція для комбінованої анімації
  function scaleAndSlide(node: HTMLElement, params: any) {
      const slideTrans = slide(node, params);
      const scaleTrans = scale(node, params);

      return {
          duration: params.duration,
          easing: params.easing,
          css: (t: number, u: number) => `
              ${slideTrans.css ? slideTrans.css(t, u) : ''}
              ${scaleTrans.css ? scaleTrans.css(t, u) : ''}
          `
      };
  }

  // Функція для отримання кольору гравця
  function getPlayerColor(players: any[], playerName: string): string | null {
    const player = players.find(p => p.name === playerName);
    return player ? player.color : null;
  }

  // Функція для створення стилю з тінню кольору гравця
  function getPlayerNameStyle(players: any[], playerName: string): string {
    const color = getPlayerColor(players, playerName);
    return color ? `background-color: ${color};` : '';
  }

  const directionArrows: Record<string, string> = {
    'up-left': '↖', 'up': '↑', 'up-right': '↗',
    'left': '←', 'right': '→',
    'down-left': '↙', 'down': '↓', 'down-right': '↘'
  };

  const displayMessage = derived(
    [gameState, lastComputerMove, lastPlayerMove, isPlayerTurn, isPauseBetweenMoves, _, settingsStore],
    ([$gameState, $lastComputerMove, $lastPlayerMove, $isPlayerTurn, $isPauseBetweenMoves, $_, $settingsStore]) => {
      if (!$gameState) return '';

      const isCompact = $settingsStore.showGameInfoWidget === 'compact';

      const humanPlayersCount = $gameState.players.filter(p => p.type === 'human').length;
      const isLocalGame = humanPlayersCount > 1;

      if ($gameState.isGameOver) {
        return $_('gameBoard.gameInfo.gameOver');
      }
      if ($gameState.isFirstMove) {
        if (isLocalGame) {
          const currentPlayer = $gameState.players[$gameState.currentPlayerIndex];
          const playerStyle = getPlayerNameStyle($gameState.players, currentPlayer.name);
          return `Гра почалась!<br><div><span class="player-name-plate" style="${playerStyle}">${currentPlayer.name}</span>, ваша черга робити хід</div>`;
        }
        return $_('gameBoard.gameInfo.firstMove');
      }
      if ($gameState.wasResumed) {
        return $_('gameBoard.gameInfo.gameResumed');
      }
      if ($lastComputerMove && !$isPauseBetweenMoves) {
        const direction = $_(`gameBoard.directions.${$lastComputerMove.direction.replace('-', '')}`);
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
        const currentPlayer = $gameState.players[$gameState.currentPlayerIndex];
        const previousPlayerIndex = ($gameState.currentPlayerIndex + $gameState.players.length - 1) % $gameState.players.length;
        const previousPlayer = $gameState.players[previousPlayerIndex];
        const previousPlayerStyle = getPlayerNameStyle($gameState.players, previousPlayer.name);
        const currentPlayerStyle = getPlayerNameStyle($gameState.players, currentPlayer.name);
        const direction = $_(`gameBoard.directions.${$lastPlayerMove.direction.replace('-', '')}`);
        return `<div class="message-line-1"><span class="player-name-plate" style="${previousPlayerStyle}">${previousPlayer.name}</span> зробив хід: ${direction} на ${$lastPlayerMove.distance}.</div><div class="message-line-2"><span class="player-name-plate" style="${currentPlayerStyle}">${currentPlayer.name}</span> ваша черга робити хід!</div>`;
      }
      if ($isPauseBetweenMoves) {
        return $_('gameBoard.gameInfo.pauseBetweenMoves');
      }
      if ($isPlayerTurn) {
        if (isLocalGame) {
          const currentPlayer = $gameState.players[$gameState.currentPlayerIndex];
          const currentPlayerStyle = getPlayerNameStyle($gameState.players, currentPlayer.name);
          return `Хід гравця: <span class="player-name-plate" style="${currentPlayerStyle}">${currentPlayer.name}</span>`;
        }
        return $_('gameBoard.gameInfo.playerTurn');
      }
      if (!$isPlayerTurn) {
        return $_('gameBoard.gameInfo.computerTurn');
      }
      return $_('gameBoard.gameInfo.gameStarted');
    }
  );
</script>

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
    transition: all 0.3s ease;
    backdrop-filter: var(--unified-backdrop-filter);
    border: var(--unified-border);
    max-height: 200px;
    overflow: hidden;
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
  }

  :global(.message-line-1) {
    text-align: left;
    width: 100%;
  }

  :global(.message-line-2) {
    text-align: right;
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
    flex-wrap: wrap; /* Додаємо перенос для дуже вузьких екранів */
  }
</style>

{#if $i18nReady && $settingsStore.showGameInfoWidget !== 'hidden' && $gameState}
  <div class="game-info-widget"
       class:compact={$settingsStore.showGameInfoWidget === 'compact'}
       transition:safeScale={{ duration: 400, easing: quintOut }}
       data-testid="game-info-panel"
  >
    <div class="game-info-content" data-testid="game-info-content">
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
  </div>
{/if}