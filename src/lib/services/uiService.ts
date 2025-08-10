import { goto } from '$app/navigation';
import { base } from '$app/paths';
import { gameOrchestrator } from '$lib/gameOrchestrator';

export function navigateToGame() {
  gameOrchestrator.setCurrentGameMode('vs-computer');
  goto(`${base}/game/vs-computer`);
}