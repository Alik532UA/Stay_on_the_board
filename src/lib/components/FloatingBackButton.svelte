<script lang="ts">
  import { navigationService } from '$lib/services/navigationService.js';
  import { modalStore } from '$lib/stores/modalStore.js';
  import { gameOrchestrator } from '$lib/gameOrchestrator.ts';
  import { _ } from 'svelte-i18n';
  import { customTooltip } from '$lib/actions/customTooltip.js';
  import { get } from 'svelte/store';
  import { userActionService } from '$lib/services/userActionService';
  import { gameState } from '$lib/stores/gameState.js';
  import { logService } from '$lib/services/logService.js';
  import { gameOverStore } from '$lib/stores/gameOverStore.js';
  import { replayService } from '$lib/services/replayService';
  import { gameModeService } from '$lib/services/gameModeService';

  function handleBackClick() {
    logService.ui('FloatingBackButton: handleBackClick called');
    // Встановлюємо прапорець, щоб повідомити root layout, що не потрібно закривати модальне вікно
    // No longer needed as replay is handled by replayStore
    logService.ui('FloatingBackButton: handleBackClick called, no longer restoring replay from sessionStorage.');
    navigationService.goBack();
  }
</script>

<button
  class="floating-back-btn"
  aria-label={$_('ui.goBack') || 'Повернутися назад'}
  use:customTooltip={$_('ui.goBack') || 'Повернутися назад'}
  onclick={handleBackClick}
>
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
    <line x1="19" y1="12" x2="5" y2="12"></line>
    <polyline points="12 19 5 12 12 5"></polyline>
  </svg>
</button>

<style>
  .floating-back-btn {
    width: 52px;
    height: 52px;
    border-radius: 50%;
    border: none;
    background: rgba(0, 0, 0, 0.2);
    color: white;
    cursor: pointer;
    z-index: 1010;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background-color 0.2s, transform 0.2s, box-shadow 0.2s;
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    margin-right: 1rem;
  }
  .floating-back-btn:hover {
    background: rgba(0, 0, 0, 0.4);
    transform: scale(1.05);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
  }
  .floating-back-btn svg {
    width: 200%;
    height: 200%;
    flex-shrink: 0; /* Забороняємо flex-контейнеру стискати іконку */
  }
</style> 