import { goto } from '$app/navigation';
import { base } from '$app/paths';
import { gameModeService } from '$lib/services/gameModeService';
import { uiStateStore } from '$lib/stores/uiStateStore';
import { get } from 'svelte/store';
import { gameSettingsStore } from '$lib/stores/gameSettingsStore';

export function navigateToGame() {
  const { intendedGameType } = get(uiStateStore);
  const { gameMode } = get(gameSettingsStore);

  let targetPath = '';
  let modeToInitialize = '';

  switch (intendedGameType) {
    case 'training':
      targetPath = '/game/training';
      modeToInitialize = gameMode || 'training';
      break;
    case 'local':
      targetPath = '/local-setup';
      modeToInitialize = gameMode || 'local';
      break;
    case 'timed':
      targetPath = '/game/timed';
      modeToInitialize = gameMode || 'timed';
      break;
    case 'virtual-player':
      targetPath = '/game/virtual-player';
      modeToInitialize = gameMode || 'virtual-player';
      break;
    default:
      targetPath = '/game/training';
      modeToInitialize = 'training';
      break;
  }

  goto(`${base}${targetPath}`);
}