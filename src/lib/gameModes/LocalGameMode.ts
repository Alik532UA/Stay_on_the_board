import { get } from 'svelte/store';
import { BaseGameMode } from './index';
import type { Player } from '$lib/models/player';
import { gameSettingsStore } from '$lib/stores/gameSettingsStore';
import { gameOverStore } from '$lib/stores/gameOverStore';
import { gameEventBus } from '$lib/services/gameEventBus';
import { logService } from '$lib/services/logService';
import { animationService } from '$lib/services/animationService';
import { timeService } from '$lib/services/timeService';
import { noMovesService } from '$lib/services/noMovesService';
import { availableMovesService } from '$lib/services/availableMovesService';
import { gameService } from '$lib/services/gameService';
import { playerStore } from '$lib/stores/playerStore';
import { boardStore } from '$lib/stores/boardStore';
import { resetPlayerScore, createDefaultLocalPlayers } from '$lib/utils/playerFactory';
import type { ScoreChangesData } from '$lib/types/gameMove';
import { BASE_TURN_DURATION, DEV_TIME_MULTIPLIER } from '$lib/config/gameConfig';
import { dev } from '$app/environment';

export class LocalGameMode extends BaseGameMode {
  constructor() {
    super();
    this.turnDuration = dev ? BASE_TURN_DURATION * DEV_TIME_MULTIPLIER : BASE_TURN_DURATION;
  }

  initialize(options: { newSize?: number } = {}): void {
    gameService.initializeNewGame({
      size: options.newSize,
      players: this.getPlayersConfiguration(),
    });

    // Check for 'observer' mode to disable timer
    const currentSettings = get(gameSettingsStore);
    if (currentSettings.gameMode === 'observer') {
      this.turnDuration = 0; // Disable timer
    } else {
      // Restore default turn duration if not observer (in case of mode switch)
      this.turnDuration = dev ? BASE_TURN_DURATION * DEV_TIME_MULTIPLIER : BASE_TURN_DURATION;
    }

    gameSettingsStore.updateSettings({
      speechRate: 1.6,
      shortSpeech: true,
      speechFor: { player: false, computer: true },
    });
    animationService.initialize();
    this.checkComputerTurn();
    // this.startTurn(); // Timer will start after the first move to allow infinite setup time
  }

  async continueAfterNoMoves(): Promise<void> {
    logService.GAME_MODE(`[${this.constructor.name}] continueAfterNoMoves called`);

    // Використовуємо спільну логіку з базового класу
    this.resetBoardForContinuation();

    await this.advanceToNextPlayer();
    await this.checkComputerTurn();
    this.startTurn();
    gameEventBus.dispatch('CloseModal');
  }

  async handleNoMoves(playerType: 'human' | 'computer'): Promise<void> {
    noMovesService.dispatchNoMovesEvent(playerType);
  }

  getPlayersConfiguration(): Player[] {
    const playerState = get(playerStore);
    if (playerState) {
      // SSoT: Беремо поточних гравців, але ОБОВ'ЯЗКОВО скидаємо їхній рахунок до 0
      // для нової гри.
      return playerState.players.map(p => resetPlayerScore(p));
    }
    // If no players in store (e.g. F5 refresh), generate default players
    return createDefaultLocalPlayers();
  }

  getModeName(): 'training' | 'local' | 'timed' | 'online' | 'virtual-player' {
    return 'local';
  }

  protected async advanceToNextPlayer(): Promise<void> {
    const currentPlayerState = get(playerStore);
    if (!currentPlayerState) return;
    const nextPlayerIndex = (currentPlayerState.currentPlayerIndex + 1) % currentPlayerState.players.length;

    // Detect Round Completion (Wrap-around)
    if (nextPlayerIndex === 0) {
      logService.GAME_MODE(`[${this.constructor.name}] Round completed. Flushing round scores to fixed scores.`);
      this.flushRoundScores();
    }

    playerStore.update(s => s ? { ...s, currentPlayerIndex: nextPlayerIndex } : null);

    await this.checkComputerTurn();
    this.startTurn();
  }

  private flushRoundScores(): void {
    playerStore.update(s => {
      if (!s) return null;
      const newPlayers = s.players.map(p => ({
        ...p,
        score: p.score + (p.roundScore || 0),
        roundScore: 0
      }));
      logService.score('Flushed round scores. New fixed scores:', newPlayers.map(p => ({ name: p.name, score: p.score })));
      return { ...s, players: newPlayers };
    });
  }

  protected async applyScoreChanges(scoreChanges: ScoreChangesData): Promise<void> {
    const { bonusPoints, penaltyPoints } = scoreChanges;
    const playerState = get(playerStore);
    if (!playerState) return;

    playerStore.update(s => {
      if (!s) return null;
      const newPlayers = [...s.players];
      const playerToUpdate = { ...newPlayers[s.currentPlayerIndex] };

      // Local Game Scoring Rule: Score split (Fixed + Round)
      // We add points to roundScore. Fixed 'score' is updated only at the end of the round.
      // Note: bonusPoints here already includes distance bonus + jump bonus (from scoreService)
      // and does NOT include baseScoreChange (filtered out in performMove for local mode).
      const currentRoundScore = playerToUpdate.roundScore || 0;
      // Calculate net change for this move
      const moveScore = bonusPoints - penaltyPoints;
      playerToUpdate.roundScore = currentRoundScore + moveScore;

      // NOTE: We do NOT update playerToUpdate.score here anymore.
      // It serves as the 'Fixed Score' reference.

      logService.score(`[LocalGameMode] applyScoreChanges for ${playerToUpdate.name}:`, {
        bonusPointsFromMove: bonusPoints,
        penaltyPointsFromMove: penaltyPoints,
        moveScore: moveScore,
        newRoundScore: playerToUpdate.roundScore,
        fixedScore: playerToUpdate.score
      });

      newPlayers[s.currentPlayerIndex] = playerToUpdate;
      return { ...s, players: newPlayers };
    });
  }

  private async checkComputerTurn(): Promise<void> {
    // Local mode is typically Human vs Human, but keeping this for safety if mixed mode is possible
    const state = get(playerStore);
    if (!state) return;
    const currentPlayer = state.players[state.currentPlayerIndex];

    if (currentPlayer.type === 'computer' || currentPlayer.isComputer) {
      // Note: 'computer' check depends on Player model type literal. Assuming 'computer' or 'ai'.
      // Player type is 'human' | 'computer' usually.
      await new Promise(resolve => setTimeout(resolve, 1000));
      await this.triggerComputerMove();
    }
  }
}
