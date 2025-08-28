<script lang="ts">
  // НАВІЩО: Цей layout є спільною оболонкою для всіх ігрових режимів.
  // Тут ми розміщуємо елементи, які є на кожній ігровій сторінці:
  // модальні вікна, обробники глобальних гарячих клавіш та загальні стилі.
  // Це дозволяє уникнути дублювання коду (DRY).

  import VoiceSettingsModal from '$lib/components/VoiceSettingsModal.svelte';
  import { uiState, closeVoiceSettingsModal } from '$lib/stores/uiStore.js';
  import { settingsStore } from '$lib/stores/settingsStore.ts';
  import { get } from 'svelte/store';
  import { gameModeService } from '$lib/services/gameModeService';
  import { userActionService } from '$lib/services/userActionService';
  import { logService } from '$lib/services/logService.js';
  import { onMount, onDestroy } from 'svelte';
  import { gameOrchestrator } from '$lib/gameOrchestrator';
  import PlayerColorProvider from '$lib/components/PlayerColorProvider.svelte';
  import { initializeHotkeyService } from '$lib/services/hotkeyService';

  onDestroy(() => {
    logService.GAME_MODE('Game layout is being destroyed, cleaning up game mode.');
    const activeGameMode = gameModeService.getCurrentMode();
    if (activeGameMode) {
      activeGameMode.cleanup();
    }
  });
 
  onMount(() => {
    if (import.meta.env.DEV || get(settingsStore).testMode) {
  	(window as any).gameOrchestrator = gameOrchestrator;
  	(window as any).userActionService = userActionService;
  	(window as any).gameModeService = gameModeService;
  	(window as any).settingsStore = settingsStore;
    }
    const hotkeyService = initializeHotkeyService();
    return () => {
        hotkeyService.destroy();
    };
  });
</script>

<div class="game-layout-container">
  <!-- НАВІЩО: <slot /> - це місце, куди SvelteKit буде вставляти
       вміст конкретної сторінки (`vs-computer/+page.svelte`, `local/+page.svelte` і т.д.) -->
  <slot />
</div>

{#if $uiState.isVoiceSettingsModalOpen}
  <VoiceSettingsModal close={closeVoiceSettingsModal} />
{/if}

<PlayerColorProvider />

<style>
  .game-layout-container {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding-bottom: 24px;
  }
</style>