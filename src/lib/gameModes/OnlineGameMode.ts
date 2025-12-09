// src/lib/gameModes/OnlineGameMode.ts
/**
 * @file Режим онлайн-гри з синхронізацією через IGameStateSync.
 * @description Цей режим використовує абстракцію синхронізації для підтримки
 * онлайн-гри через Firebase або інші бекенди.
 * 
 * ВАЖЛИВО: Вся логіка синхронізації делегується до IGameStateSync,
 * щоб можна було легко замінити локальну синхронізацію на Firebase.
 */
import { get } from 'svelte/store';
import { BaseGameMode } from './BaseGameMode';
import type { Player } from '$lib/models/player';
import { logService } from '$lib/services/logService';
import { gameService } from '$lib/services/gameService';
import { gameSettingsStore } from '$lib/stores/gameSettingsStore';
import { animationService } from '$lib/services/animationService';
import { boardStore } from '$lib/stores/boardStore';
import { playerStore } from '$lib/stores/playerStore';
import { scoreStore } from '$lib/stores/scoreStore';
import type { IGameStateSync, GameStateSyncEvent } from '$lib/sync';
import { localGameStateSync } from '$lib/sync';

export class OnlineGameMode extends BaseGameMode {
  /**
   * Сервіс синхронізації стану гри.
   * За замовчуванням використовується локальна синхронізація.
   * Для онлайн-гри через Firebase потрібно замінити на FirebaseGameStateSync.
   */
  private stateSync: IGameStateSync;

  /**
   * Функція відписки від подій синхронізації.
   */
  private unsubscribeSync: (() => void) | null = null;

  /**
   * Ідентифікатор кімнати для онлайн-гри.
   */
  private roomId: string | null = null;

  constructor(stateSync?: IGameStateSync) {
    super();
    this.turnDuration = 15;
    // Дозволяємо впровадження залежності для тестування та Firebase
    this.stateSync = stateSync || localGameStateSync;
  }

  /**
   * Встановлює сервіс синхронізації.
   * Використовується для переключення між локальною та Firebase синхронізацією.
   */
  setStateSync(stateSync: IGameStateSync): void {
    if (this.unsubscribeSync) {
      this.unsubscribeSync();
      this.unsubscribeSync = null;
    }
    this.stateSync = stateSync;
  }

  async initialize(options: { newSize?: number; roomId?: string } = {}): Promise<void> {
    this.roomId = options.roomId || null;

    // Ініціалізуємо синхронізацію
    await this.stateSync.initialize(this.roomId || undefined);

    // Підписуємося на оновлення стану
    this.unsubscribeSync = this.stateSync.subscribe((event) => {
      this.handleSyncEvent(event);
    });

    gameService.initializeNewGame({
      size: options.newSize,
      players: this.getPlayersConfiguration(),
    });

    gameSettingsStore.updateSettings({
      speechRate: 1.6,
      shortSpeech: true,
      speechFor: { player: false, computer: true },
    });

    animationService.initialize();

    // Синхронізуємо початковий стан
    await this.syncCurrentState();

    this.startTurn();
    logService.GAME_MODE(`[OnlineGameMode] Initialized with roomId: ${this.roomId}`);
  }

  cleanup(): void {
    if (this.unsubscribeSync) {
      this.unsubscribeSync();
      this.unsubscribeSync = null;
    }
    this.stateSync.cleanup();
    super.cleanup();
    logService.GAME_MODE('[OnlineGameMode] Cleaned up');
  }

  async claimNoMoves(): Promise<void> {
    logService.GAME_MODE('[OnlineGameMode] Claiming no moves...');
    // TODO: Синхронізувати заяву про відсутність ходів
  }

  async handleNoMoves(playerType: 'human' | 'computer'): Promise<void> {
    logService.GAME_MODE(`[OnlineGameMode] Handling no moves for ${playerType}...`);
    // TODO: Синхронізувати обробку відсутності ходів
  }

  getPlayersConfiguration(): Player[] {
    return [
      { id: 1, type: 'human', name: 'You', score: 0, color: '#000000', isComputer: false, penaltyPoints: 0, bonusPoints: 0, bonusHistory: [], roundScore: 0 },
      { id: 2, type: 'human', name: 'Opponent', score: 0, color: '#ffffff', isComputer: false, penaltyPoints: 0, bonusPoints: 0, bonusHistory: [], roundScore: 0 }
    ];
  }

  getModeName(): 'training' | 'local' | 'timed' | 'online' {
    return 'online';
  }

  async continueAfterNoMoves(): Promise<void> {
    logService.GAME_MODE('[OnlineGameMode] Continuing after no moves...');
    await this.syncCurrentState();
  }

  protected async advanceToNextPlayer(): Promise<void> {
    logService.GAME_MODE('[OnlineGameMode] Advancing to next player...');

    const currentPlayerState = get(playerStore);
    if (!currentPlayerState) return;

    const nextPlayerIndex = (currentPlayerState.currentPlayerIndex + 1) % currentPlayerState.players.length;
    playerStore.update(s => s ? { ...s, currentPlayerIndex: nextPlayerIndex } : null);

    // Синхронізуємо зміну гравця
    await this.syncCurrentState();

    this.startTurn();
  }

  protected async applyScoreChanges(scoreChanges: any): Promise<void> {
    logService.GAME_MODE('[OnlineGameMode] Applying score changes...', scoreChanges);

    const { bonusPoints, penaltyPoints } = scoreChanges;
    const playerState = get(playerStore);
    if (!playerState) return;

    playerStore.update(s => {
      if (!s) return null;
      const newPlayers = [...s.players];
      const playerToUpdate = { ...newPlayers[s.currentPlayerIndex] };

      const currentRoundScore = playerToUpdate.roundScore || 0;
      const moveScore = bonusPoints - penaltyPoints;
      playerToUpdate.roundScore = currentRoundScore + moveScore;

      newPlayers[s.currentPlayerIndex] = playerToUpdate;
      return { ...s, players: newPlayers };
    });

    // Синхронізуємо зміни рахунку
    await this.syncCurrentState();
  }

  /**
   * Синхронізує поточний стан гри.
   */
  private async syncCurrentState(): Promise<void> {
    const boardState = get(boardStore);
    const playerState = get(playerStore);
    const scoreState = get(scoreStore);

    if (!boardState || !playerState || !scoreState) {
      logService.GAME_MODE('[OnlineGameMode] Cannot sync - state not initialized');
      return;
    }

    await this.stateSync.pushState({
      boardState,
      playerState,
      scoreState,
      version: Date.now(),
      updatedAt: Date.now()
    });
  }

  /**
   * Обробляє події синхронізації.
   */
  private handleSyncEvent(event: GameStateSyncEvent): void {
    switch (event.type) {
      case 'state_updated':
        logService.GAME_MODE('[OnlineGameMode] State updated from sync', event.state.version);
        // TODO: Оновити локальний стан з event.state
        break;
      case 'player_joined':
        logService.GAME_MODE(`[OnlineGameMode] Player joined: ${event.playerName}`);
        break;
      case 'player_left':
        logService.GAME_MODE(`[OnlineGameMode] Player left: ${event.playerId}`);
        break;
      case 'connection_lost':
        logService.GAME_MODE('[OnlineGameMode] Connection lost');
        // TODO: Показати UI повідомлення
        break;
      case 'connection_restored':
        logService.GAME_MODE('[OnlineGameMode] Connection restored');
        break;
      default:
        logService.GAME_MODE('[OnlineGameMode] Unknown sync event', event);
    }
  }
}
