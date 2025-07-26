<script lang="ts">
  import { onMount } from 'svelte';
  import ReplayViewer from '$lib/components/ReplayViewer.svelte';
  import FloatingBackButton from '$lib/components/FloatingBackButton.svelte';
  import { navigationService } from '$lib/services/navigationService.js';

  let moveHistory: any = null;
  let boardSize = 4; // Значення за замовчуванням

  onMount(() => {
    const replayDataJSON = sessionStorage.getItem('replayData');
    if (replayDataJSON) {
      try {
        const replayData = JSON.parse(replayDataJSON);
        moveHistory = replayData.moveHistory;
        boardSize = replayData.boardSize;
        // Додаємо автозапуск через 1 секунду
        setTimeout(() => {
          const event = new CustomEvent('toggleAutoPlay', { detail: 'forward' });
          // Знаходимо ReplayViewer і ReplayControls у DOM
          const controls = document.querySelector('.replay-controls .play-pause:last-child');
          if (controls) (controls as HTMLElement).click();
        }, 1000);
      } catch (e) {
        console.error("Failed to parse replay data", e);
        navigationService.goToMainMenu();
      }
    } else {
      // Якщо даних немає (прямий захід на сторінку), перенаправляємо
      navigationService.goToMainMenu();
    }
  });
</script>

<FloatingBackButton />

<div class="replay-page-container">
  {#if moveHistory}
    <ReplayViewer {moveHistory} {boardSize} autoPlayForward={true} />
  {:else}
    <p>Завантаження даних для перегляду...</p>
  {/if}
</div>

<style>
  .replay-page-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    width: 100%;
    padding: 1rem;
    box-sizing: border-box;
  }
</style> 