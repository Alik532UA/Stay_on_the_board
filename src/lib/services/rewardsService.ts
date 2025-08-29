// src/lib/services/rewardsService.ts
import { writable, get } from 'svelte/store';
import { gameStore } from '$lib/stores/gameStore';
import { TrainingGameMode } from '$lib/gameModes/TrainingGameMode';
import { playerStore } from '$lib/stores/playerStore';
import { scoreStore } from '$lib/stores/scoreStore';

export const rewards = writable<any[]>([]);

class RewardsService {
  constructor() {
    playerStore.subscribe(state => {
      if (state) {
        this.checkRewards(state);
      }
    });
  }

  checkRewards(state: any) {
    const newRewards = [];
    const scoreState = get(scoreStore);

    if (get(gameStore).mode instanceof TrainingGameMode && state.players[0]?.score > 532) {
      newRewards.push({ id: 'score_532', name: 'Expert Player' });
    }

    if (scoreState?.jumpedBlockedCells && scoreState.jumpedBlockedCells >= 10) {
      newRewards.push({ id: 'jumps_10', name: 'Jumper' });
    }

    rewards.set(newRewards);
  }
}

export const rewardsService = new RewardsService();