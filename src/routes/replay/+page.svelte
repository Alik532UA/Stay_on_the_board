<script lang="ts">
  import { onMount } from 'svelte';
  import ReplayViewer from '$lib/components/ReplayViewer.svelte';
  import FloatingBackButton from '$lib/components/FloatingBackButton.svelte';
  import { navigationService } from '$lib/services/navigationService.js';
  import { logService } from '$lib/services/logService.js';
  import { gameOverStore } from '$lib/stores/gameOverStore';

  let moveHistory: any = null;
  let boardSize = 4; // Значення за замовчуванням

  onMount(() => {
    const replayDataJSON = sessionStorage.getItem('replayData');
    if (replayDataJSON) {
      try {
        const replayData = JSON.parse(replayDataJSON);
        moveHistory = replayData.moveHistory;
        boardSize = replayData.boardSize;
        
        // Перевіряємо, чи є збережений стан завершення гри
        const replayGameStateJSON = sessionStorage.getItem('replayGameState');
        if (replayGameStateJSON) {
          try {
            const replayGameState = JSON.parse(replayGameStateJSON);
            // Відновлюємо стан завершення гри з sessionStorage
            if (replayGameState.isGameOver && replayGameState.gameOverReasonKey) {
              let winnerIndexes: number[] = [];
              let player1Score = replayGameState.score || 0;
              let player2Score = 0;
              
              // Якщо це локальна гра, отримуємо дані з localGameStore
              if (replayData.gameType === 'local') {
                const replayLocalGameStateJSON = sessionStorage.getItem('replayLocalGameState');
                if (replayLocalGameStateJSON) {
                  try {
                    const replayLocalGameState = JSON.parse(replayLocalGameStateJSON);
                    player1Score = replayLocalGameState.players[0]?.score || 0;
                    player2Score = replayLocalGameState.players[1]?.score || 0;
                    
                    // Визначаємо переможця для локальної гри
                    if (replayLocalGameState.players && replayLocalGameState.players.length > 0) {
                      const maxScore = Math.max(...replayLocalGameState.players.map((p: any) => p.score));
                      const winners = replayLocalGameState.players
                        .map((p: any, index: number) => ({ score: p.score, index }))
                        .filter((p: any) => p.score === maxScore);
                      
                      winnerIndexes = winners.map((w: any) => w.index);
                    }
                  } catch (e) {
                    logService.ui("Failed to parse local game state", e);
                  }
                }
              }
              
              const gameResult = {
                scores: [
                  { playerId: 0, score: player1Score },
                  { playerId: 1, score: player2Score }
                ],
                winners: winnerIndexes,
                reasonKey: replayGameState.gameOverReasonKey,
                reasonValues: replayGameState.gameOverReasonValues,
                finalScoreDetails: {
                  baseScore: replayGameState.baseScore || 0,
                  sizeBonus: replayGameState.sizeBonus || 0,
                  blockModeBonus: replayGameState.blockModeBonus || 0,
                  jumpBonus: replayGameState.jumpBonus || 0,
                  finishBonus: replayGameState.finishBonus || 0,
                  noMovesBonus: replayGameState.noMovesBonus || 0,
                  totalPenalty: replayGameState.totalPenalty || 0,
                  totalScore: replayGameState.totalScore || 0,
                },
                gameType: replayData.gameType || 'vs-computer',
              };
              gameOverStore.setGameOver(gameResult);
            }
          } catch (e) {
            logService.ui("Failed to restore game over state", e);
          }
        }
        
        // Додаємо автозапуск через 1 секунду
        setTimeout(() => {
          const event = new CustomEvent('toggleAutoPlay', { detail: 'forward' });
          // Знаходимо ReplayViewer і ReplayControls у DOM
          const controls = document.querySelector('.replay-controls .play-pause:last-child');
          if (controls) (controls as HTMLElement).click();
        }, 1000);
      } catch (e) {
        logService.ui("Failed to parse replay data", e);
        navigationService.goToMainMenu();
      }
    } else {
      // Якщо даних немає (прямий захід на сторінку), перенаправляємо
      navigationService.goToMainMenu();
    }
  });
</script>

<div class="header-container">
  <FloatingBackButton />
  <h1>Перегляд повтору</h1>
</div>

<div class="replay-page-container">
  {#if moveHistory}
    <ReplayViewer {moveHistory} {boardSize} autoPlayForward={true} />
  {:else}
    <p>Завантаження даних для перегляду...</p>
  {/if}
</div>

<style>
  .header-container {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 2rem;
  }

  .replay-page-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
    padding: 1rem;
    box-sizing: border-box;
  }
</style> 