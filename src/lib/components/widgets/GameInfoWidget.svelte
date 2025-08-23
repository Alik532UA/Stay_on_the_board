<script lang="ts">
  import { derived } from 'svelte/store';
  import { gameState } from '$lib/stores/gameState.js';
  import { settingsStore } from '$lib/stores/settingsStore.js';
  import { _ } from 'svelte-i18n';
  import { lastComputerMove, lastPlayerMove, isPlayerTurn, isPauseBetweenMoves } from '$lib/stores/derivedState.ts';
  import { i18nReady } from '$lib/i18n/init.js';
  import { fade } from 'svelte/transition';

  // --- Локальний стан для керування анімацією тексту ---
  let displayContent: any = '';
  let isFading = false;
  let timeoutId: ReturnType<typeof setTimeout>;

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
        const directionKey = $lastComputerMove.direction.replace(/-(\w)/g, (_, c) => c.toUpperCase());
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
        const currentPlayer = $gameState.players[$gameState.currentPlayerIndex];
        const previousPlayerIndex = ($gameState.currentPlayerIndex + $gameState.players.length - 1) % $gameState.players.length;
        const previousPlayer = $gameState.players[previousPlayerIndex];
        const previousPlayerStyle = getPlayerNameStyle($gameState.players, previousPlayer.name);
        const currentPlayerStyle = getPlayerNameStyle($gameState.players, currentPlayer.name);
        const directionKey = $lastPlayerMove.direction.replace(/-(\w)/g, (_, c) => c.toUpperCase());
        const direction = $_(`gameBoard.directions.${directionKey}`);
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

  // --- Реактивний блок для керування анімацією зміни тексту ---
  $: {
    const newMessage = $displayMessage;
    // Ініціалізуємо displayContent першим значенням
    if (displayContent === '') {
      displayContent = newMessage;
    }

    // Порівнюємо об'єкти та рядки, щоб уникнути зайвих анімацій
    if (JSON.stringify(displayContent) !== JSON.stringify(newMessage)) {
      clearTimeout(timeoutId);
      isFading = true;
      timeoutId = setTimeout(() => {
        displayContent = newMessage;
        isFading = false;
      }, 250); // Тривалість анімації зникнення
    }
  }

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
    backdrop-filter: var(--unified-backdrop-filter);
    border: var(--unified-border);
    overflow: hidden;
    transition: max-height 0.4s ease-out, opacity 0.3s ease-out, padding 0.4s ease-out, margin 0.4s ease-out, transform 0.3s ease-out;
    max-height: 200px;
    transform: scale(1);
    margin-bottom: 16px;
  }

  .game-info-widget.hidden {
    max-height: 0;
    opacity: 0;
    padding-top: 0;
    padding-bottom: 0;
    margin-top: 0;
    margin-bottom: 0;
    border-width: 0;
    transform: scale(0.95);
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
    transition: opacity 0.25s ease-in-out;
  }

  .game-info-content.fading {
    opacity: 0;
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
    flex-wrap: wrap;
  }
</style>

{#if $i18nReady && $gameState}
  <div class="game-info-widget"
       class:hidden={$settingsStore.showGameInfoWidget === 'hidden'}
       class:compact={$settingsStore.showGameInfoWidget === 'compact'}
       data-testid="game-info-panel"
  >
    <div class="game-info-content" class:fading={isFading} data-testid="game-info-content">
      {#if typeof displayContent === 'object' && displayContent.isCompact}
        <div class="compact-message-line">
          <span>{displayContent.part1}</span>
          <span class="compact-move-display">{displayContent.move}</span>
        </div>
        <span>{displayContent.part2}</span>
      {:else}
        {@html displayContent}
      {/if}
    </div>
  </div>
{/if}