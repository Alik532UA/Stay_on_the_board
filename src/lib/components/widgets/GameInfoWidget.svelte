<script lang="ts">
  import { gameState } from '$lib/stores/gameState.js';
  import { playerInputStore } from '$lib/stores/playerInputStore.js';
  import { settingsStore } from '$lib/stores/settingsStore.js';
  import { _, locale } from 'svelte-i18n';
  import { lastComputerMove, isPlayerTurn, isPauseBetweenMoves } from '$lib/stores/derivedState.ts';
  import { i18nReady } from '$lib/i18n/init.js';
  import { slide, scale } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';

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
  $: console.log('GameInfoWidget Debug:', {
    i18nReady: $i18nReady,
    locale: $locale,
    playerTurn: $_('gameBoard.gameInfo.playerTurn'),
    currentState,
    previousState,
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
  
  // Функція для отримання повідомлення для стану
  function getMessageForState() {
    console.log('getMessageForState called with state:', currentState);
    
    if ($gameState.isGameOver) {
      const message = $_('gameBoard.gameInfo.gameOver');
      console.log('Returning gameOver message:', message);
      return message;
    } else if ($gameState.isFirstMove) {
      const message = $_('gameBoard.gameInfo.firstMove');
      console.log('Returning firstMove message:', message);
      console.log('Message contains \\n:', message.includes('\\n'));
      console.log('Message contains actual newline:', message.includes('\n'));
      return message;
    } else if ($gameState.wasResumed) {
      const message = $_('gameBoard.gameInfo.gameResumed');
      console.log('Returning gameResumed message:', message);
      console.log('GameInfoWidget: wasResumed condition met - wasResumed:', $gameState.wasResumed);
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
      console.log('Returning computerMadeMove message:', message);
      return message;
    } else if ($isPauseBetweenMoves) {
      const message = $_('gameBoard.gameInfo.pauseBetweenMoves');
      console.log('Returning pauseBetweenMoves message:', message);
      return message;
    } else if ($isPlayerTurn) {
      const message = $_('gameBoard.gameInfo.playerTurn');
      console.log('Returning playerTurn message:', message);
      return message;
    } else if (!$isPlayerTurn) {
      const message = $_('gameBoard.gameInfo.computerTurn');
      console.log('Returning computerTurn message:', message);
      return message;
    } else {
      const message = $_('gameBoard.gameInfo.gameStarted');
      console.log('Returning gameStarted message:', message);
      console.log('Message contains \\n:', message.includes('\\n'));
      console.log('Message contains actual newline:', message.includes('\n'));
      return message;
    }
  }
  
  // Визначаємо поточний стан з урахуванням змін в lastComputerMove
  $: currentState = (() => {
    if ($gameState.isGameOver) return 'gameOver';
    if ($gameState.isFirstMove) return 'firstMove';
    
    // Якщо гра була відновлена - показуємо повідомлення про відновлення (поки гравець не зробить хід)
    if ($gameState.wasResumed) {
      console.log('GameInfoWidget: Returning wasResumed state');
      return 'wasResumed';
    }
    
    // Якщо є хід комп'ютера і не пауза - показуємо хід комп'ютера
    if ($lastComputerMove && !$isPauseBetweenMoves) {
      // Додаємо хеш ходу комп'ютера до стану, щоб відстежувати зміни
      const moveHash = `${$lastComputerMove.direction}-${$lastComputerMove.distance}`;
      console.log('GameInfoWidget: Returning computerMove state:', `computerMove-${moveHash}`);
      return `computerMove-${moveHash}`;
    }
    
    // Якщо пауза між ходами - показуємо паузу
    if ($isPauseBetweenMoves) {
      console.log('GameInfoWidget: Returning pause state');
      return 'pause';
    }
    
    // Якщо черга гравця і немає останнього ходу комп'ютера - черга гравця
    if ($isPlayerTurn && !$lastComputerMove) {
      console.log('GameInfoWidget: Returning playerTurn state');
      return 'playerTurn';
    }
    
    // Якщо черга комп'ютера - черга комп'ютера
    if (!$isPlayerTurn) {
      console.log('GameInfoWidget: Returning computerTurn state');
      return 'computerTurn';
    }
    
    // За замовчуванням - черга гравця
    console.log('GameInfoWidget: Returning default playerTurn state');
    return 'playerTurn';
  })();
  
      // Додаткова відлагоджувальна інформація для currentState
    $: console.log('GameInfoWidget currentState calculation:', {
      isGameOver: $gameState.isGameOver,
      isFirstMove: $gameState.isFirstMove,
      wasResumed: $gameState.wasResumed,
      lastComputerMove: $lastComputerMove,
      isPauseBetweenMoves: $isPauseBetweenMoves,
      isPlayerTurn: $isPlayerTurn,
      calculatedState: currentState,
      // Додаємо хеш lastComputerMove для відстеження змін
      lastComputerMoveHash: $lastComputerMove ? `${$lastComputerMove.direction}-${$lastComputerMove.distance}` : 'null',
      // Додаткова інформація для wasResumed логіки
      wasResumedCondition: $gameState.wasResumed && !$lastComputerMove
    });
  
  // Ініціалізація та оновлення повідомлення
  $: if ($i18nReady && currentState) {
    console.log('GameInfoWidget Animation Logic:', {
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
        isPauseBetweenMoves: $isPauseBetweenMoves,
        isPlayerTurn: $isPlayerTurn
      }
    });
    
    if (!isInitialized) {
      // Перший рендер - встановлюємо повідомлення без анімації
      console.log('Initializing GameInfoWidget');
      displayMessage = getMessageForState();
      isInitialized = true;
      previousState = currentState;
    } else if (currentState !== previousState && !isAnimating) {
      // Зміна стану - запускаємо анімацію
      console.log('Starting animation for state change:', { from: previousState, to: currentState });
      isAnimating = true;
      pendingState = currentState; // Запам'ятовуємо очікуваний стан
      
      // Після fade-out змінюємо повідомлення і робимо fade-in
      setTimeout(() => {
        console.log('Fade-out complete, updating message');
        displayMessage = getMessageForState();
        setTimeout(() => {
          console.log('Fade-in complete, animation finished');
          isAnimating = false;
          // Оновлюємо previousState тільки після завершення анімації
          previousState = pendingState;
          pendingState = '';
        }, 300); // fade-in
      }, 300); // fade-out
    } else if (currentState !== previousState && isAnimating && currentState !== pendingState) {
      // Якщо під час анімації стан змінився знову, оновлюємо pendingState
      console.log('State changed during animation, updating pendingState:', { 
        from: pendingState, 
        to: currentState,
        previousState 
      });
      pendingState = currentState;
    } else if (currentState === previousState && !isAnimating) {
      // Додаткова діагностика: коли стан не змінюється
      console.log('State unchanged, no animation needed:', {
        currentState,
        previousState,
        isAnimating,
        displayMessage: displayMessage.substring(0, 50) + '...'
      });
    }
  }
</script>

<style>
  .game-info-widget {
    background: var(--bg-secondary);
    /* Змінено padding та видалено min-height для плавної анімації */
    padding: 20px 12px;
    border-radius: var(--unified-border-radius);
    box-shadow: var(--unified-shadow);
    text-align: center;
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

  .game-info-content {
    font-weight: 500;
    line-height: 1.4;
    max-width: 100%;
    word-wrap: break-word;
    opacity: 1;
    transition: opacity 0.3s ease-in-out;
    white-space: pre-line;
  }

  .game-info-content.fade-out {
    opacity: 0;
  }



  /* Всі стани використовують той самий фон, що й game-controls-panel */
  .game-info-widget.player-turn,
  .game-info-widget.computer-turn,
  .game-info-widget.game-over,
  .game-info-widget.pause {
    background: var(--bg-secondary);
    box-shadow: var(--unified-shadow);
    border: var(--unified-border);
  }
</style>

{#if $i18nReady}
  {#if $settingsStore.showGameInfoWidget}
    <div class="game-info-widget" 
         class:player-turn={$isPlayerTurn && !$playerInputStore.selectedDirection && !$playerInputStore.selectedDistance}
         class:computer-turn={!$isPlayerTurn && !$lastComputerMove}
         class:game-over={$gameState.isGameOver}
         class:pause={$isPauseBetweenMoves}
         transition:scaleAndSlide={{ duration: 400, easing: quintOut }}
    >
      <div class="game-info-content" class:fade-out={isAnimating}>
        {displayMessage}
      </div>
    </div>
  {/if}
{:else}
  {#if $settingsStore.showGameInfoWidget}
    <div class="game-info-widget" transition:scaleAndSlide={{ duration: 400, easing: quintOut }}>
      <div class="game-info-content">
        Loading...
      </div>
    </div>
  {/if}
{/if} 