// src/lib/services/hotkeyService.ts
import { get } from 'svelte/store';
import { setDirection, setDistance } from '$lib/services/gameLogicService.js';
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
    case 'up-left': setDirection('up-left'); break;
    case 'up': setDirection('up'); break;
    case 'up-right': setDirection('up-right'); break;
    case 'left': setDirection('left'); break;
    case 'right': setDirection('right'); break;
    case 'down-left': setDirection('down-left'); break;
    case 'down': setDirection('down'); break;
    case 'down-right': setDirection('down-right'); break;
    case 'confirm': localInputProvider.confirmMove(); break;
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