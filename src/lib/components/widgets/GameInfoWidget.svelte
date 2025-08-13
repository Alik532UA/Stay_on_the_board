<script lang="ts">
  import { gameState } from '$lib/stores/gameState.js';
  import { playerInputStore } from '$lib/stores/playerInputStore.js';
  import { settingsStore } from '$lib/stores/settingsStore.js';
  import { _, locale } from 'svelte-i18n';
  import { lastComputerMove, lastPlayerMove, isPlayerTurn, isPauseBetweenMoves } from '$lib/stores/derivedState.ts';
  import { i18nReady } from '$lib/i18n/init.js';
  import { slide, scale } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';
  import { logService } from '$lib/services/logService.js';

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

  // Реактивні змінні для відстеження змін
  $: $gameState;
  $: $playerInputStore;
  $: $lastComputerMove;
  $: $isPlayerTurn;
  $: $isPauseBetweenMoves;

  // Відлагоджувальна інформація
  $: logService.ui('GameInfoWidget Debug:', {
    i18nReady: $i18nReady,
    locale: $locale,
    playerTurn: $_('gameBoard.gameInfo.playerTurn'),
    currentState,
    previousState,
    pendingState,
    lastProcessedState,
    isAnimating,
    isInitialized,
    displayMessage: displayMessage.substring(0, 50) + '...',
    gameState: {
      isGameOver: $gameState.isGameOver,
      isFirstMove: $gameState.isFirstMove,
      wasResumed: $gameState.wasResumed
    },
    derivedState: {
      lastComputerMove: $lastComputerMove,
      lastPlayerMove: $lastPlayerMove,
      isPlayerTurn: $isPlayerTurn,
      isPauseBetweenMoves: $isPauseBetweenMoves
    }
  });

  // wasResumed тепер скидається тільки коли гравець робить хід (в continueAfterNoMoves)

  // Логіка для анімації fade
  let isAnimating = false;
  let displayMessage = '';
  let previousState = '';
  let isInitialized = false;
  let pendingState = ''; // Додаємо відстеження очікуваного стану
  let lastProcessedState = ''; // Додаємо відстеження останнього обробленого стану
  
  // Функція для отримання повідомлення для стану
  function getMessageForState() {
    logService.ui('getMessageForState called with state:', currentState);
    
    // Перевіряємо чи це локальна гра (більше одного людського гравця)
    const humanPlayersCount = $gameState.players.filter(p => p.type === 'human').length;
    const isLocalGame = humanPlayersCount > 1;
    
    if ($gameState.isGameOver) {
      const message = $_('gameBoard.gameInfo.gameOver');
      logService.ui('Returning gameOver message:', message);
      return message;
    } else if ($gameState.isFirstMove) {
      if (isLocalGame) {
        const currentPlayer = $gameState.players[$gameState.currentPlayerIndex];
        const playerColor = getPlayerColor(currentPlayer.name);
        const playerStyle = playerColor ? `style="${getPlayerNameStyle(currentPlayer.name)}"` : '';
        const message = `Гра почалась!<br><div><span class="player-name-plate" ${playerStyle}>${currentPlayer.name}</span>, ваша черга робити хід</div>`;
        logService.ui('Returning localGame firstMove message:', message);
        return message;
      } else {
        const message = $_('gameBoard.gameInfo.firstMove');
        logService.ui('Returning firstMove message:', message);
        logService.ui('Message contains \\n:', message.includes('\\n'));
        logService.ui('Message contains actual newline:', message.includes('\n'));
        return message;
      }
    } else if ($gameState.wasResumed) {
      const message = $_('gameBoard.gameInfo.gameResumed');
      logService.ui('Returning gameResumed message:', message);
      logService.ui('GameInfoWidget: wasResumed condition met - wasResumed:', $gameState.wasResumed);
      return message;
    } else if (currentState.startsWith('computerMove-') && $lastComputerMove && !$isPauseBetweenMoves) {
      const message = $_('gameBoard.gameInfo.computerMadeMove', { 
        values: { 
          direction: $lastComputerMove.direction === 'up-left' ? $_('gameBoard.directions.upLeft') :
                    $lastComputerMove.direction === 'up' ? $_('gameBoard.directions.up') :
                    $lastComputerMove.direction === 'up-right' ? $_('gameBoard.directions.upRight') :
                    $lastComputerMove.direction === 'left' ? $_('gameBoard.directions.left') :
                    $lastComputerMove.direction === 'right' ? $_('gameBoard.directions.right') :
                    $lastComputerMove.direction === 'down-left' ? $_('gameBoard.directions.downLeft') :
                    $lastComputerMove.direction === 'down' ? $_('gameBoard.directions.down') :
                    $lastComputerMove.direction === 'down-right' ? $_('gameBoard.directions.downRight') :
                    $lastComputerMove.direction,
          distance: $lastComputerMove.distance 
        } 
      });
      logService.ui('Returning computerMadeMove message:', message);
      return message;
    } else if (currentState.startsWith('playerMove-') && $lastPlayerMove && !$isPauseBetweenMoves && isLocalGame) {
      // В локальній грі показуємо хід попереднього гравця
      const currentPlayer = $gameState.players[$gameState.currentPlayerIndex];
      // Отримуємо індекс попереднього гравця з стану або обчислюємо
      const stateParts = currentState.split('-');
      const previousPlayerIndex = stateParts.length >= 3 ? parseInt(stateParts[1]) : ($gameState.currentPlayerIndex + $gameState.players.length - 1) % $gameState.players.length;
      const previousPlayer = $gameState.players[previousPlayerIndex];
      
      const previousPlayerColor = getPlayerColor(previousPlayer.name);
      const currentPlayerColor = getPlayerColor(currentPlayer.name);
      const previousPlayerStyle = previousPlayerColor ? `style="${getPlayerNameStyle(previousPlayer.name)}"` : '';
      const currentPlayerStyle = currentPlayerColor ? `style="${getPlayerNameStyle(currentPlayer.name)}"` : '';
      
      const direction = $lastPlayerMove.direction === 'up-left' ? $_('gameBoard.directions.upLeft') :
                        $lastPlayerMove.direction === 'up' ? $_('gameBoard.directions.up') :
                        $lastPlayerMove.direction === 'up-right' ? $_('gameBoard.directions.upRight') :
                        $lastPlayerMove.direction === 'left' ? $_('gameBoard.directions.left') :
                        $lastPlayerMove.direction === 'right' ? $_('gameBoard.directions.right') :
                        $lastPlayerMove.direction === 'down-left' ? $_('gameBoard.directions.downLeft') :
                        $lastPlayerMove.direction === 'down' ? $_('gameBoard.directions.down') :
                        $lastPlayerMove.direction === 'down-right' ? $_('gameBoard.directions.downRight') :
                        $lastPlayerMove.direction;
      
      const message = `<div class="message-line-1"><span class="player-name-plate" ${previousPlayerStyle}>${previousPlayer.name}</span> зробив хід: ${direction} на ${$lastPlayerMove.distance}.</div><div class="message-line-2"><span class="player-name-plate" ${currentPlayerStyle}>${currentPlayer.name}</span> ваша черга робити хід!</div>`;
      logService.ui('Returning localGame playerMadeMove message:', message);
      return message;
    } else if ($isPauseBetweenMoves) {
      const message = $_('gameBoard.gameInfo.pauseBetweenMoves');
      logService.ui('Returning pauseBetweenMoves message:', message);
      return message;
    } else if ($isPlayerTurn) {
      if (isLocalGame) {
        // В локальній грі показуємо чергу поточного гравця
        const currentPlayer = $gameState.players[$gameState.currentPlayerIndex];
        const currentPlayerColor = getPlayerColor(currentPlayer.name);
        const currentPlayerStyle = currentPlayerColor ? `style="${getPlayerNameStyle(currentPlayer.name)}"` : '';
        const message = `Хід гравця: <span class="player-name-plate" ${currentPlayerStyle}>${currentPlayer.name}</span>`;
        logService.ui('Returning localGame playerTurn message:', message);
        return message;
      }
      const message = $_('gameBoard.gameInfo.playerTurn');
      logService.ui('Returning playerTurn message:', message);
      return message;
    } else if (!$isPlayerTurn) {
      const message = $_('gameBoard.gameInfo.computerTurn');
      logService.ui('Returning computerTurn message:', message);
      return message;
    } else {
      if (isLocalGame) {
        const currentPlayer = $gameState.players[$gameState.currentPlayerIndex];
        const currentPlayerColor = getPlayerColor(currentPlayer.name);
        const currentPlayerStyle = currentPlayerColor ? `style="${getPlayerNameStyle(currentPlayer.name)}"` : '';
        const message = `Гра почалась!<br><div><span class="player-name-plate" ${currentPlayerStyle}>${currentPlayer.name}</span>, ваша черга робити хід</div>`;
        logService.ui('Returning localGame gameStarted message:', message);
        return message;
      } else {
        const message = $_('gameBoard.gameInfo.gameStarted');
        logService.ui('Returning gameStarted message:', message);
        logService.ui('Message contains \\n:', message.includes('\\n'));
        logService.ui('Message contains actual newline:', message.includes('\n'));
        return message;
      }
    }
  }
  
  // Визначаємо поточний стан з урахуванням змін в lastComputerMove
  $: currentState = (() => {
    // Перевіряємо чи це локальна гра (більше одного людського гравця)
    const humanPlayersCount = $gameState.players.filter(p => p.type === 'human').length;
    const isLocalGame = humanPlayersCount > 1;
    
    if ($gameState.isGameOver) return 'gameOver';
    if ($gameState.isFirstMove) return 'firstMove';
    
    // Якщо гра була відновлена - показуємо повідомлення про відновлення (поки гравець не зробить хід)
    if ($gameState.wasResumed) {
      logService.ui('GameInfoWidget: Returning wasResumed state');
      return 'wasResumed';
    }
    
    // Якщо є хід комп'ютера і не пауза - показуємо хід комп'ютера
    if ($lastComputerMove && !$isPauseBetweenMoves) {
      // Додаємо хеш ходу комп'ютера до стану, щоб відстежувати зміни
      const moveHash = `${$lastComputerMove.direction}-${$lastComputerMove.distance}`;
      logService.ui('GameInfoWidget: Returning computerMove state:', `computerMove-${moveHash}`);
      return `computerMove-${moveHash}`;
    }
    
    // Якщо є хід гравця в локальній грі і не пауза - показуємо хід гравця
    if ($lastPlayerMove && !$isPauseBetweenMoves && isLocalGame) {
      // Додаємо хеш ходу гравця та індекс попереднього гравця до стану, щоб відстежувати зміни
      const previousPlayerIndex = ($gameState.currentPlayerIndex + $gameState.players.length - 1) % $gameState.players.length;
      const moveHash = `${previousPlayerIndex}-${$lastPlayerMove.direction}-${$lastPlayerMove.distance}`;
      logService.ui('GameInfoWidget: Returning playerMove state:', `playerMove-${moveHash}`);
      return `playerMove-${moveHash}`;
    }
    
    // Якщо пауза між ходами - показуємо паузу
    if ($isPauseBetweenMoves) {
      logService.ui('GameInfoWidget: Returning pause state');
      return 'pause';
    }
    
    // Якщо черга гравця і немає останнього ходу комп'ютера - черга гравця
    if ($isPlayerTurn && !$lastComputerMove) {
      logService.ui('GameInfoWidget: Returning playerTurn state');
      return 'playerTurn';
    }
    
    // Якщо черга комп'ютера - черга комп'ютера
    if (!$isPlayerTurn) {
      logService.ui('GameInfoWidget: Returning computerTurn state');
      return 'computerTurn';
    }
    
    // За замовчуванням - черга гравця
    logService.ui('GameInfoWidget: Returning default playerTurn state');
    if (isLocalGame) {
      return `playerTurn-${$gameState.currentPlayerIndex}`;
    }
    return 'playerTurn';
  })();
  
      // Додаткова відлагоджувальна інформація для currentState
    $: logService.ui('GameInfoWidget currentState calculation:', {
      isGameOver: $gameState.isGameOver,
      isFirstMove: $gameState.isFirstMove,
      wasResumed: $gameState.wasResumed,
      lastComputerMove: $lastComputerMove,
      lastPlayerMove: $lastPlayerMove,
      isPauseBetweenMoves: $isPauseBetweenMoves,
      isPlayerTurn: $isPlayerTurn,
      calculatedState: currentState,
      // Додаємо хеш lastComputerMove для відстеження змін
      lastComputerMoveHash: $lastComputerMove ? `${$lastComputerMove.direction}-${$lastComputerMove.distance}` : 'null',
      // Додаємо хеш lastPlayerMove для відстеження змін
      lastPlayerMoveHash: $lastPlayerMove ? `${$lastPlayerMove.direction}-${$lastPlayerMove.distance}` : 'null',
      // Додаємо індекс попереднього гравця для відстеження змін
      previousPlayerIndex: $lastPlayerMove ? ($gameState.currentPlayerIndex + $gameState.players.length - 1) % $gameState.players.length : 'null',
      // Додаткова інформація для wasResumed логіки
      wasResumedCondition: $gameState.wasResumed && !$lastComputerMove
    });
  
  // Ініціалізація та оновлення повідомлення
  $: if ($i18nReady && currentState) {
    logService.ui('GameInfoWidget Animation Logic:', {
      currentState,
      previousState,
      pendingState,
      isAnimating,
      isInitialized,
      condition: currentState !== previousState && !isAnimating,
      // Додаткова інформація для діагностики
      gameStateInfo: {
        isGameOver: $gameState.isGameOver,
        isFirstMove: $gameState.isFirstMove,
        wasResumed: $gameState.wasResumed,
        lastComputerMove: $lastComputerMove,
        lastPlayerMove: $lastPlayerMove,
        isPauseBetweenMoves: $isPauseBetweenMoves,
        isPlayerTurn: $isPlayerTurn
      }
    });
    
    if (!isInitialized) {
      // Перший рендер - встановлюємо повідомлення без анімації
      logService.ui('Initializing GameInfoWidget');
      displayMessage = getMessageForState();
      isInitialized = true;
      previousState = currentState;
      lastProcessedState = currentState;
    } else if (currentState !== previousState && !isAnimating && currentState !== pendingState && currentState !== lastProcessedState) {
      // Зміна стану - запускаємо анімацію тільки якщо це новий стан
      logService.ui('Starting animation for state change:', { from: previousState, to: currentState });
      isAnimating = true;
      pendingState = currentState; // Запам'ятовуємо очікуваний стан
      
      // Після fade-out змінюємо повідомлення і робимо fade-in
      setTimeout(() => {
        logService.ui('Fade-out complete, updating message');
        // Перевіряємо, чи не змінився стан під час fade-out
        if (pendingState === currentState) {
          displayMessage = getMessageForState();
          setTimeout(() => {
            logService.ui('Fade-in complete, animation finished');
            isAnimating = false;
            // Оновлюємо previousState тільки після завершення анімації
            previousState = pendingState;
            lastProcessedState = pendingState;
            pendingState = '';
          }, 300); // fade-in
        } else {
          // Стан змінився під час fade-out, негайно завершуємо анімацію
          logService.ui('State changed during fade-out, immediately updating message');
          displayMessage = getMessageForState();
          isAnimating = false;
          previousState = currentState;
          lastProcessedState = currentState;
          pendingState = '';
        }
      }, 300); // fade-out
    } else if (currentState !== previousState && isAnimating && currentState !== pendingState) {
      // Якщо під час анімації стан змінився знову, оновлюємо pendingState
      logService.ui('State changed during animation, updating pendingState:', { 
        from: pendingState, 
        to: currentState,
        previousState 
      });
      pendingState = currentState;
    } else if (currentState === previousState && !isAnimating) {
      // Додаткова діагностика: коли стан не змінюється
      logService.ui('State unchanged, no animation needed:', {
        currentState,
        previousState,
        isAnimating,
        displayMessage: displayMessage.substring(0, 50) + '...'
      });
    }
  }

  // Додаткова перевірка для синхронізації displayMessage з поточним станом
  // Це гарантує, що текст завжди відповідає актуальному стану гри
  $: if ($i18nReady && isInitialized && !isAnimating && currentState === previousState) {
    const expectedMessage = getMessageForState();
    if (displayMessage !== expectedMessage) {
      logService.ui('GameInfoWidget: Syncing displayMessage with current state');
      displayMessage = expectedMessage;
    }
  }

  // Функція для отримання кольору гравця
  function getPlayerColor(playerName: string): string | null {
    const player = $gameState.players.find(p => p.name === playerName);
    return player ? player.color : null;
  }

  // Функція для створення стилю з тінню кольору гравця
  function getPlayerNameStyle(playerName: string): string {
    const color = getPlayerColor(playerName);
    if (color) {
      // Повертаємо стиль для фону
      return `background-color: ${color};`;
    }
    return '';
  }
</script>

<style>
  .game-info-widget {
    background: var(--bg-secondary);
    /* Змінено padding та видалено min-height для плавної анімації */
    padding: 20px 12px;
    border-radius: var(--unified-border-radius);
    box-shadow: var(--dynamic-widget-shadow) var(--current-player-shadow-color);
    font-size: 1.1em;
    color: var(--text-primary, #222);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;
    /* Glassmorphism */
    backdrop-filter: var(--unified-backdrop-filter);
    border: var(--unified-border);
    max-height: 200px; /* Залишаємо для обмеження */
    overflow: hidden;
  }

  .game-info-widget.compact {
    padding: 8px 12px;
    min-height: 40px;
    font-size: 0.9em;
  }

  .game-info-content {
    font-weight: 500;
    line-height: 1.4;
    width: 100%;
    word-wrap: break-word;
    opacity: 1;
    transition: opacity 0.3s ease-in-out;
    white-space: pre-line;
    white-space: pre-line;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  :global(.message-line-1) {
    text-align: left;
    width: 100%;
  }

  :global(.message-line-2) {
    text-align: right;
    width: 100%;
  }

  .game-info-content.fade-out {
    opacity: 0;
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

  /* Всі стани використовують той самий фон, що й game-controls-panel */
  .game-info-widget.player-turn,
  .game-info-widget.computer-turn,
  .game-info-widget.game-over,
  .game-info-widget.pause {
    background: var(--bg-secondary);
    box-shadow: var(--dynamic-widget-shadow) var(--current-player-shadow-color);
    border: var(--unified-border);
  }
</style>

{#if $i18nReady}
  {#if $settingsStore.showGameInfoWidget !== 'hidden'}
    <div class="game-info-widget"
         class:player-turn={$isPlayerTurn && !$playerInputStore.selectedDirection && !$playerInputStore.selectedDistance}
         class:computer-turn={!$isPlayerTurn && !$lastComputerMove}
         class:game-over={$gameState.isGameOver}
         class:pause={$isPauseBetweenMoves}
         class:compact={$settingsStore.showGameInfoWidget === 'compact'}
         transition:scaleAndSlide={{ duration: 400, easing: quintOut }}
    >
      <div class="game-info-content" class:fade-out={isAnimating}>
        {@html displayMessage}
      </div>
    </div>
  {/if}
{:else}
  {#if $settingsStore.showGameInfoWidget !== 'hidden'}
    <div class="game-info-widget" class:compact={$settingsStore.showGameInfoWidget === 'compact'} transition:scaleAndSlide={{ duration: 400, easing: quintOut }}>
      <div class="game-info-content">
        Loading...
      </div>
    </div>
  {/if}
{/if}