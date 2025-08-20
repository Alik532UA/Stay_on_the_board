<script lang="ts">
  // НАВІЩО: Цей layout є спільною оболонкою для всіх ігрових режимів.
  // Тут ми розміщуємо елементи, які є на кожній ігровій сторінці:
  // модальні вікна, обробники глобальних гарячих клавіш та загальні стилі.
  // Це дозволяє уникнути дублювання коду (DRY).

  import VoiceSettingsModal from '$lib/components/VoiceSettingsModal.svelte';
  import { uiState, closeVoiceSettingsModal } from '$lib/stores/uiStore.js';
  import { settingsStore } from '$lib/stores/settingsStore.ts';
  import { get } from 'svelte/store';
  import { setDirection, setDistance } from '$lib/services/gameLogicService.js';
  import { gameModeService } from '$lib/services/gameModeService';
  import { playerInputStore } from '$lib/stores/playerInputStore.js';
  import { modalStore } from '$lib/stores/modalStore.js';
  import { gameState } from '$lib/stores/gameState.js';
  import { userActionService } from '$lib/services/userActionService';
  import { goto } from '$app/navigation';
  import { base } from '$app/paths';
  import { logService } from '$lib/services/logService.js';
  import { onMount, onDestroy } from 'svelte';
  import { gameOrchestrator } from '$lib/gameOrchestrator';
  import PlayerColorProvider from '$lib/components/PlayerColorProvider.svelte';

  onDestroy(() => {
    logService.GAME_MODE('Game layout is being destroyed, cleaning up game mode.');
    gameModeService.cleanupCurrentGameMode();
  });
 
  onMount(() => {
    if (import.meta.env.DEV || get(settingsStore).testMode) {
  	(window as any).gameOrchestrator = gameOrchestrator;
  	(window as any).userActionService = userActionService;
  	(window as any).gameModeService = gameModeService;
  	(window as any).settingsStore = settingsStore;
  }
  });

  // НАВІЩО: Гарячі клавіші є глобальними для будь-якого ігрового режиму,
  // тому їх логіка знаходиться тут, а не на сторінках конкретних режимів.
  function changeBoardSize(increment: number) {
    const currentSize = get(gameState).boardSize;
    const newSize = currentSize + increment;
    if (newSize >= 2 && newSize <= 9) {
      userActionService.changeBoardSize(newSize);
    }
  }

  function executeAction(action: string) {
    logService.action(`Hotkey: "${action}" (GameLayout)`);
    switch (action) {
      case 'increase-board':
        changeBoardSize(1);
        break;
      case 'decrease-board':
        changeBoardSize(-1);
        break;
      case 'toggle-block-mode':
        settingsStore.toggleBlockMode();
        break;
      case 'toggle-board':
        settingsStore.toggleShowBoard(undefined);
        break;
    }
    switch (action) {
      case 'up-left': setDirection('up-left'); break;
      case 'up': setDirection('up'); break;
      case 'up-right': setDirection('up-right'); break;
      case 'left': setDirection('left'); break;
      case 'right': setDirection('right'); break;
      case 'down-left': setDirection('down-left'); break;
      case 'down': setDirection('down'); break;
      case 'down-right': setDirection('down-right'); break;
      case 'confirm': userActionService.confirmMove(); break;
      case 'no-moves': userActionService.claimNoMoves(); break;
      case 'distance-1': setDistance(1); break;
      case 'distance-2': setDistance(2); break;
      case 'distance-3': setDistance(3); break;
      case 'distance-4': setDistance(4); break;
      case 'distance-5': setDistance(5); break;
      case 'distance-6': setDistance(6); break;
      case 'distance-7': setDistance(7); break;
      case 'distance-8': setDistance(8); break;
    }
  }

  function handleHotkey(e: KeyboardEvent) {
    if (e.target && (e.target as HTMLElement).tagName !== 'BODY') return;
    
    // L або Д (українська Д) для переходу в local-setup (тільки в DEV)
    if ((e.key === 'l' || e.key === 'д' || e.key === 'L' || e.key === 'Д') && import.meta.env.DEV) {
      logService.action(`Hotkey: "L/Д" (GameLayout) - перехід до local-setup`);
      e.preventDefault();
      goto(`${base}/local-setup`);
      return;
    }
    
    const key = e.code;
    const currentSettings = get(settingsStore);
    const keybindings = currentSettings.keybindings;
    const resolutions = currentSettings.keyConflictResolution;

    if (e.key === '=' || e.key === '+' || e.code === 'Equal') {
      executeAction('increase-board');
      return;
    }
    if (e.key === '-' || e.key === '_' || e.code === 'Minus') {
      executeAction('decrease-board');
      return;
    }

    const matchingActions = Object.entries(keybindings)
      .filter(([, keys]) => (keys as string[]).includes(key))
      .map(([action]) => action);

    if (matchingActions.length === 0) return;

    if (matchingActions.length === 1) {
      executeAction(matchingActions[0]);
      return;
    }

    if (resolutions[key]) {
      executeAction(resolutions[key]);
      return;
    }
    
    // ... (логіка обробки конфліктів залишається)
  }
</script>

<div class="game-layout-container">
  <!-- НАВІЩО: <slot /> - це місце, куди SvelteKit буде вставляти 
       вміст конкретної сторінки (`vs-computer/+page.svelte`, `local/+page.svelte` і т.д.) -->
  <slot />
</div>

{#if $uiState.isVoiceSettingsModalOpen}
  <VoiceSettingsModal close={closeVoiceSettingsModal} />
{/if}

<svelte:window on:keydown={handleHotkey} />
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