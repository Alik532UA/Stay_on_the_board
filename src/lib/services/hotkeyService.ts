// src/lib/services/hotkeyService.ts
import { get } from 'svelte/store';
import { userActionService } from '$lib/services/userActionService';
import { goto } from '$app/navigation';
import { base } from '$app/paths';
import { logService } from '$lib/services/logService.js';
import { localInputProvider } from '$lib/services/localInputProvider';
import { gameSettingsStore } from '$lib/stores/gameSettingsStore';
import { boardStore } from '$lib/stores/boardStore';

function changeBoardSize(increment: number) {
  const currentSize = get(boardStore)?.boardSize;
  if (typeof currentSize !== 'number') return;
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
      gameSettingsStore.toggleBlockMode();
      break;
    case 'toggle-board':
      gameSettingsStore.toggleShowBoard(undefined);
      break;
    case 'up-left': userActionService.selectDirection('up-left'); break;
    case 'up': userActionService.selectDirection('up'); break;
    case 'up-right': userActionService.selectDirection('up-right'); break;
    case 'left': userActionService.selectDirection('left'); break;
    case 'right': userActionService.selectDirection('right'); break;
    case 'down-left': userActionService.selectDirection('down-left'); break;
    case 'down': userActionService.selectDirection('down'); break;
    case 'down-right': userActionService.selectDirection('down-right'); break;
    case 'confirm': localInputProvider.confirmMove(); break;
    case 'no-moves': userActionService.claimNoMoves(); break;
    case 'distance-1': userActionService.selectDistance(1); break;
    case 'distance-2': userActionService.selectDistance(2); break;
    case 'distance-3': userActionService.selectDistance(3); break;
    case 'distance-4': userActionService.selectDistance(4); break;
    case 'distance-5': userActionService.selectDistance(5); break;
    case 'distance-6': userActionService.selectDistance(6); break;
    case 'distance-7': userActionService.selectDistance(7); break;
    case 'distance-8': userActionService.selectDistance(8); break;
  }
}

function handleHotkey(e: KeyboardEvent) {
  if (e.target && (e.target as HTMLElement).tagName !== 'BODY') return;
  
  if ((e.key === 'l' || e.key === 'д' || e.key === 'L' || e.key === 'Д') && import.meta.env.DEV) {
    logService.action(`Hotkey: "L/Д" (GameLayout) - перехід до local-setup`);
    e.preventDefault();
    goto(`${base}/local-setup`);
    return;
  }
  
  const key = e.code;
  const currentSettings = get(gameSettingsStore);
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
}

export function initializeHotkeyService() {
    window.addEventListener('keydown', handleHotkey);
    return {
        destroy() {
            window.removeEventListener('keydown', handleHotkey);
        }
    };
}