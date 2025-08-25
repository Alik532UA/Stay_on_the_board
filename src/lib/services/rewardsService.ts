// src/lib/services/rewardsService.ts
import { gameState } from '$lib/stores/gameState';
import { writable, get } from 'svelte/store';
import { gameStore } from '$lib/stores/gameStore';
import { TrainingGameMode } from '$lib/gameModes/TrainingGameMode';

export const rewards = writable<any[]>([]);

class RewardsService {
  constructor() {
    gameState.subscribe(state => {
      if (state) {
        this.checkRewards(state);
      }
    });
  }

  checkRewards(state: any) {
    const newRewards = [];

    // Example reward: score over 532 in training mode
    if (get(gameStore).mode instanceof TrainingGameMode && state.players.score > 532) {
      newRewards.push({ id: 'score_532', name: 'Expert Player' });
    }

    // Example reward: 10 jumps in a game
    if (state.jumpedBlockedCells >= 10) {
      newRewards.push({ id: 'jumps_10', name: 'Jumper' });
    }

    rewards.set(newRewards);
  }
}

export const rewardsService = new RewardsService();