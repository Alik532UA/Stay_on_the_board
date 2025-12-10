import { get } from 'svelte/store';
import { BaseGameMode } from './BaseGameMode';
import type { Player } from '$lib/models/player';
import { logService } from '$lib/services/logService';
import { gameService } from '$lib/services/gameService';
import { createOnlinePlayers } from '$lib/utils/playerFactory';
import { gameSettingsStore } from '$lib/stores/gameSettingsStore';
import { animationService } from '$lib/services/animationService';
import { boardStore } from '$lib/stores/boardStore';
import { playerStore } from '$lib/stores/playerStore';
import { scoreStore } from '$lib/stores/scoreStore';
import { uiStateStore } from '$lib/stores/uiStateStore';
import type { IGameStateSync, GameStateSyncEvent, SyncableGameState } from '$lib/sync/gameStateSync.interface';
import { createFirebaseGameStateSync } from '$lib/sync/FirebaseGameStateSync';
import type { ScoreChangesData } from '$lib/types/gameMove';
import { roomService } from '$lib/services/roomService';
import type { MoveDirectionType } from '$lib/models/Piece';
import { notificationService } from '$lib/services/notificationService';
import { availableMovesService } from '$lib/services/availableMovesService';

export class OnlineGameMode extends BaseGameMode {
  private stateSync: IGameStateSync | null = null;
  private unsubscribeSync: (() => void) | null = null;
  private roomId: string | null = null;
  private myPlayerId: string | null = null;

  constructor() {
    super();
    this.turnDuration = 30; // Більше часу для онлайн гри
  }

  async initialize(options: { newSize?: number; roomId?: string } = {}): Promise<void> {
    this.roomId = options.roomId || null;
    const session = roomService.getSession();
    this.myPlayerId = session.playerId;

    if (!this.roomId || !this.myPlayerId) {
      logService.error('[OnlineGameMode] Missing roomId or playerId');
      return;
    }

    // Створюємо новий екземпляр синхронізації для кожної гри
    this.stateSync = createFirebaseGameStateSync();

    try {
      await this.stateSync.initialize(this.roomId);

      this.unsubscribeSync = this.stateSync.subscribe((event) => {
        this.handleSyncEvent(event);
      });

      // Якщо ми хост (перший гравець), ми ініціалізуємо стан
      // Але в даному випадку стан вже може бути в кімнаті, тому спочатку пробуємо завантажити
      const remoteState = await this.stateSync.pullState();

      if (remoteState) {
        logService.GAME_MODE('[OnlineGameMode] Loaded existing state from server');
        this.applyRemoteState(remoteState);
      } else {
        logService.GAME_MODE('[OnlineGameMode] No remote state, initializing new game');
        // Ініціалізуємо нову гру локально
        gameService.initializeNewGame({
          size: options.newSize,
          players: this.getPlayersConfiguration(),
        });
        // І відправляємо на сервер, щоб другий гравець побачив стан
        await this.syncCurrentState();
      }

      gameSettingsStore.updateSettings({
        speechRate: 1.6,
        shortSpeech: true,
        speechFor: { player: true, computer: true }, // Озвучуємо всіх
      });

      animationService.initialize();
      this.startTurn();

      logService.GAME_MODE(`[OnlineGameMode] Initialized room: ${this.roomId}`);
    } catch (error) {
      logService.error('[OnlineGameMode] Initialization failed:', error);
    }
  }

  cleanup(): void {
    if (this.unsubscribeSync) {
      this.unsubscribeSync();
      this.unsubscribeSync = null;
    }
    if (this.stateSync) {
      this.stateSync.cleanup();
      this.stateSync = null;
    }
    super.cleanup();
    logService.GAME_MODE('[OnlineGameMode] Cleaned up');
  }

  // Перевизначаємо handlePlayerMove для перевірки черги
  async handlePlayerMove(direction: MoveDirectionType, distance: number, onEndCallback?: () => void): Promise<void> {
    const playerState = get(playerStore);
    if (!playerState || !this.myPlayerId) return;

    // ВАЖЛИВО: Перевірка, чи це мій хід
    // Для MVP: Хост завжди гравець 1, Гість завжди гравець 2.
    // Тут можна додати перевірку, чи співпадає myPlayerId з ID поточного гравця в roomService

    await super.handlePlayerMove(direction, distance, onEndCallback);

    // Після успішного локального ходу відправляємо стан на сервер
    await this.syncCurrentState();
  }

  async claimNoMoves(): Promise<void> {
    await super.claimNoMoves();
    // TODO: Синхронізувати подію завершення гри, якщо вона сталася
    await this.syncCurrentState();
  }

  async handleNoMoves(playerType: 'human' | 'computer'): Promise<void> {
    await super.handleNoMoves(playerType);
    await this.syncCurrentState();
  }

  getPlayersConfiguration(): Player[] {
    // Тут ми повертаємо заглушки. Реальні імена мають прийти з лобі.
    // В ідеалі initializeNewGame має приймати імена.
    return createOnlinePlayers();
  }

  getModeName(): 'training' | 'local' | 'timed' | 'online' | 'virtual-player' {
    return 'online';
  }

  async continueAfterNoMoves(): Promise<void> {
    await super.continueAfterNoMoves();
    await this.syncCurrentState();
  }

  protected async advanceToNextPlayer(): Promise<void> {
    await super.advanceToNextPlayer();
    // Стан вже оновлено в super, тут ми його просто пушимо
  }

  protected async applyScoreChanges(scoreChanges: ScoreChangesData): Promise<void> {
    await super.applyScoreChanges(scoreChanges);
  }

  private async syncCurrentState(): Promise<void> {
    if (!this.stateSync) return;

    const boardState = get(boardStore);
    const playerState = get(playerStore);
    const scoreState = get(scoreStore);

    if (!boardState || !playerState || !scoreState) return;

    await this.stateSync.pushState({
      boardState,
      playerState,
      scoreState,
      version: Date.now(), // Простий версіонування
      updatedAt: Date.now()
    });
  }

  private applyRemoteState(state: SyncableGameState): void {
    // Оновлюємо локальні стори даними з сервера
    if (state.boardState) boardStore.set(state.boardState);
    if (state.playerState) playerStore.set(state.playerState);
    if (state.scoreState) scoreStore.set(state.scoreState);

    // Оновлюємо доступні ходи для нового стану
    availableMovesService.updateAvailableMoves();
  }

  private handleSyncEvent(event: GameStateSyncEvent): void {
    switch (event.type) {
      case 'state_updated':
        logService.GAME_MODE('[OnlineGameMode] Received state update from server');
        this.applyRemoteState(event.state);
        break;
      case 'player_left':
        notificationService.show({
          type: 'warning',
          messageRaw: 'Суперник покинув гру'
        });
        break;
      case 'connection_lost':
        notificationService.show({
          type: 'error',
          messageRaw: 'Втрачено з\'єднання з сервером'
        });
        break;
    }
  }
}