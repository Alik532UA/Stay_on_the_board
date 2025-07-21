<script>
  import { onMount } from 'svelte';
  import ReplayViewer from '$lib/components/ReplayViewer.svelte';
  import FloatingBackButton from '$lib/components/FloatingBackButton.svelte';
  import { navigateToMainMenu } from '$lib/utils/navigation.js';

  let moveHistory = null;
  let boardSize = 4; // Значення за замовчуванням

  onMount(() => {
    const replayDataJSON = sessionStorage.getItem('replayData');
    if (replayDataJSON) {
      try {
        const replayData = JSON.parse(replayDataJSON);
        moveHistory = replayData.moveHistory;
        boardSize = replayData.boardSize;
      } catch (e) {
        console.error("Failed to parse replay data", e);
        navigateToMainMenu();
      }
    } else {
      // Якщо даних немає (прямий захід на сторінку), перенаправляємо
      navigateToMainMenu();
    }
  });
</script>

<FloatingBackButton />

<div class="replay-page-container">
  {#if moveHistory}
    <ReplayViewer {moveHistory} {boardSize} />
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