import { goto } from '$app/navigation';
import { base } from '$app/paths';
import { gameModeService } from '$lib/services/gameModeService';

export function navigateToGame() {
  gameModeService.initializeGameMode('training');
  goto(`${base}/game/training`);
}