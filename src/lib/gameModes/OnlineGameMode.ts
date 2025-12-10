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
import { gameEventBus } from '$lib/services/gameEventBus';

export class OnlineGameMode extends BaseGameMode {
  private stateSync: IGameStateSync | null = null;
  private unsubscribeSync: (() => void) | null = null;
  private unsubscribeSettings: (() => void) | null = null;
  private roomId: string | null = null;
  private myPlayerId: string | null = null;
  private amIHost: boolean = false;
  private myPlayerIndex: number = -1;
  private isApplyingRemoteState: boolean = false; // Прапорець для уникнення циклів

  constructor() {
    super();
    this.turnDuration = 30;
  }

  async initialize(options: { newSize?: number; roomId?: string } = {}): Promise<void> {
    this.roomId = options.roomId || null;
    const session = roomService.getSession();
    this.myPlayerId = session.playerId;

    if (!this.roomId || !this.myPlayerId) {
      logService.error('[OnlineGameMode] Missing roomId or playerId');
      return;
    }

    const roomData = await roomService.getRoom(this.roomId);
    if (roomData) {
      this.amIHost = roomData.hostId === this.myPlayerId;
      this.myPlayerIndex = this.amIHost ? 0 : 1;

      uiStateStore.update(s => ({
        ...s,
        amIHost: this.amIHost,
        onlinePlayerIndex: this.myPlayerIndex,
        intendedGameType: 'online'
      }));

      // Застосовуємо початкові налаштування з кімнати
      if (roomData.settings) {
        this.isApplyingRemoteState = true;
        gameSettingsStore.updateSettings({
          ...roomData.settings,
          settingsLocked: roomData.settingsLocked // Синхронізуємо стан блокування
        });
        if (roomData.settings.turnDuration) {
          this.turnDuration = roomData.settings.turnDuration;
        }
        this.isApplyingRemoteState = false;
      }

      logService.init(`[OnlineGameMode] Role determined. Host: ${this.amIHost}, Index: ${this.myPlayerIndex}`);
    } else {
      logService.error('[OnlineGameMode] Could not fetch room data');
      return;
    }

    this.stateSync = createFirebaseGameStateSync();

    try {
      await this.stateSync.initialize(this.roomId);

      this.unsubscribeSync = this.stateSync.subscribe((event) => {
        this.handleSyncEvent(event);
      });

      // Підписуємося на локальні зміни налаштувань, щоб відправляти їх на сервер
      this.unsubscribeSettings = gameSettingsStore.subscribe(settings => {
        if (!this.isApplyingRemoteState && this.roomId) {
          // Відправляємо зміни тільки якщо вони зроблені локально
          // І тільки ті, що впливають на геймплей
          const settingsToSync = {
            blockModeEnabled: settings.blockModeEnabled,
            autoHideBoard: settings.autoHideBoard,
            boardSize: settings.boardSize,
            turnDuration: settings.turnDuration
          };

          // Використовуємо roomService для оновлення налаштувань (це оновить документ кімнати)
          // АЛЕ: нам також треба оновити gameState, щоб інші гравці отримали це через stateSync
          // Тому краще оновлювати через pushState
          this.syncCurrentState();
        }
      });

      const remoteState = await this.stateSync.pullState();

      if (remoteState) {
        logService.GAME_MODE('[OnlineGameMode] Loaded existing state from server');
        this.applyRemoteState(remoteState);
      } else {
        if (this.amIHost) {
          logService.GAME_MODE('[OnlineGameMode] I am Host. Initializing new game state.');
          gameService.initializeNewGame({
            size: options.newSize,
            players: this.getPlayersConfiguration(),
          });
          await this.syncCurrentState();
        } else {
          logService.GAME_MODE('[OnlineGameMode] I am Guest. Waiting for Host to initialize state...');
        }
      }

      // Локальні налаштування (не синхронізуються)
      gameSettingsStore.updateSettings({
        speechRate: 1.6,
        shortSpeech: true,
        speechFor: { player: true, computer: true },
      });

      animationService.initialize();
      if (get(boardStore)) {
        this.startTurn();
      }

    } catch (error) {
      logService.error('[OnlineGameMode] Initialization failed:', error);
    }
  }

  cleanup(): void {
    if (this.unsubscribeSync) {
      this.unsubscribeSync();
      this.unsubscribeSync = null;
    }
    if (this.unsubscribeSettings) {
      this.unsubscribeSettings();
      this.unsubscribeSettings = null;
    }
    if (this.stateSync) {
      this.stateSync.cleanup();
      this.stateSync = null;
    }
    super.cleanup();
    logService.GAME_MODE('[OnlineGameMode] Cleaned up');
  }

  async handlePlayerMove(direction: MoveDirectionType, distance: number, onEndCallback?: () => void): Promise<void> {
    const playerState = get(playerStore);
    if (!playerState || this.myPlayerIndex === -1) return;

    if (playerState.currentPlayerIndex !== this.myPlayerIndex) {
      notificationService.show({ type: 'warning', messageRaw: 'Зачекайте свого ходу!' });
      return;
    }

    await super.handlePlayerMove(direction, distance, onEndCallback);
    await this.syncCurrentState();
  }

  async claimNoMoves(): Promise<void> {
    const playerState = get(playerStore);
    if (playerState?.currentPlayerIndex !== this.myPlayerIndex) {
      notificationService.show({ type: 'warning', messageRaw: 'Зачекайте свого ходу!' });
      return;
    }
    await super.claimNoMoves();
    await this.syncCurrentState();
  }

  async handleNoMoves(playerType: 'human' | 'computer'): Promise<void> {
    await super.handleNoMoves(playerType);
    await this.syncCurrentState();
  }

  getPlayersConfiguration(): Player[] {
    return createOnlinePlayers();
  }

  getModeName(): 'training' | 'local' | 'timed' | 'online' | 'virtual-player' {
    return 'online';
  }

  async continueAfterNoMoves(): Promise<void> {
    const playerState = get(playerStore);
    if (playerState?.currentPlayerIndex !== this.myPlayerIndex) return;

    await super.continueAfterNoMoves();
    await this.syncCurrentState();
  }

  private async syncCurrentState(): Promise<void> {
    if (!this.stateSync) return;
    const boardState = get(boardStore);
    const playerState = get(playerStore);
    const scoreState = get(scoreStore);
    const settings = get(gameSettingsStore);

    if (!boardState || !playerState || !scoreState) return;

    await this.stateSync.pushState({
      boardState,
      playerState,
      scoreState,
      settings: { // Синхронізуємо важливі налаштування
        blockModeEnabled: settings.blockModeEnabled,
        autoHideBoard: settings.autoHideBoard,
        boardSize: settings.boardSize,
        turnDuration: settings.turnDuration,
        settingsLocked: settings.settingsLocked
      },
      version: Date.now(),
      updatedAt: Date.now()
    });
  }

  private applyRemoteState(remoteState: SyncableGameState): void {
    this.isApplyingRemoteState = true; // Блокуємо зворотню синхронізацію

    const currentBoard = get(boardStore);

    if (currentBoard && remoteState.boardState) {
      const oldQueueLength = currentBoard.moveQueue.length;
      const newQueueLength = remoteState.boardState.moveQueue.length;

      if (newQueueLength > oldQueueLength) {
        const newMoves = remoteState.boardState.moveQueue.slice(oldQueueLength);
        logService.animation(`[OnlineGameMode] Found ${newMoves.length} new moves from server. Queueing animation.`);

        newMoves.forEach(move => {
          gameEventBus.dispatch('new_move_added', move);
        });
      }
    }

    if (remoteState.boardState) boardStore.set(remoteState.boardState);
    if (remoteState.playerState) playerStore.set(remoteState.playerState);
    if (remoteState.scoreState) scoreStore.set(remoteState.scoreState);

    // Застосовуємо налаштування з сервера
    if (remoteState.settings) {
      gameSettingsStore.updateSettings(remoteState.settings);
      if (remoteState.settings.turnDuration) {
        this.turnDuration = remoteState.settings.turnDuration;
      }
    }

    availableMovesService.updateAvailableMoves();
    this.startTurn();

    this.isApplyingRemoteState = false; // Розблоковуємо
  }

  private handleSyncEvent(event: GameStateSyncEvent): void {
    switch (event.type) {
      case 'state_updated':
        this.applyRemoteState(event.state);
        break;
      case 'player_left':
        notificationService.show({ type: 'warning', messageRaw: 'Суперник покинув гру' });
        break;
      case 'connection_lost':
        notificationService.show({ type: 'error', messageRaw: 'Втрачено з\'єднання з сервером' });
        break;
    }
  }
}