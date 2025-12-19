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
import { uiStateStore } from '$lib/stores/uiStateStore';
import type { IGameStateSync, GameStateSyncEvent, SyncableGameState } from '$lib/sync/gameStateSync.interface';
import { createFirebaseGameStateSync } from '$lib/sync/FirebaseGameStateSync';
import type { ScoreChangesData } from '$lib/types/gameMove';
import { roomService } from '$lib/services/roomService';
import type { MoveDirectionType } from '$lib/models/Piece';
import { notificationService } from '$lib/services/notificationService';
import type { Room, OnlinePlayer } from '$lib/types/online';
import { modalStore } from '$lib/stores/modalStore';
import { endGameService } from '$lib/services/endGameService';
import { timeService } from '$lib/services/timeService';

// Імпорт нових класів
import { GameStateReconciler } from './online/GameStateReconciler';
import { OnlineMatchController } from './online/OnlineMatchController';
import { OnlineGameEventManager } from './online/OnlineGameEventManager';
import { OnlineStateSynchronizer } from './online/OnlineStateSynchronizer';
import { OnlinePresenceManager } from './online/OnlinePresenceManager';
import ReconnectionModal from '$lib/components/modals/ReconnectionModal.svelte';

export class OnlineGameMode extends BaseGameMode {
  private stateSync: IGameStateSync | null = null;
  private reconciler: GameStateReconciler | null = null;
  private matchController: OnlineMatchController | null = null;
  private eventManager: OnlineGameEventManager | null = null;
  private synchronizer: OnlineStateSynchronizer | null = null;
  private presenceManager: OnlinePresenceManager | null = null;

  private unsubscribeSync: (() => void) | null = null;
  private unsubscribeRoom: (() => void) | null = null;

  private roomId: string | null = null;
  private myPlayerId: string | null = null;
  private amIHost: boolean = false;
  private myPlayerIndex: number = -1;
  private isApplyingRemoteState: boolean = false;
  private roomData: Room | null = null;

  constructor() {
    super();
    this.turnDuration = 30;
  }

  async initialize(options: { newSize?: number; roomId?: string } = {}): Promise<void> {
    const session = roomService.getSession();
    this.roomId = options.roomId || session.roomId;
    this.myPlayerId = session.playerId;

    if (!this.roomId || !this.myPlayerId) {
      logService.error('[OnlineGameMode] Missing roomId or playerId. Cannot initialize.');
      return;
    }

    this.roomData = await roomService.getRoom(this.roomId);
    if (this.roomData) {
      this.amIHost = this.roomData.hostId === this.myPlayerId;
      this.myPlayerIndex = this.amIHost ? 0 : 1;

      uiStateStore.update(s => ({
        ...s,
        amIHost: this.amIHost,
        onlinePlayerIndex: this.myPlayerIndex,
        intendedGameType: 'online'
      }));

      if (this.roomData.settings) {
        this.isApplyingRemoteState = true;
        gameSettingsStore.updateSettings({
          ...this.roomData.settings,
          settingsLocked: this.roomData.settingsLocked
        });
        if (this.roomData.settings.turnDuration) {
          this.turnDuration = this.roomData.settings.turnDuration;
        }
        this.isApplyingRemoteState = false;
      }

      logService.init(`[OnlineGameMode] Role determined. Host: ${this.amIHost}, Index: ${this.myPlayerIndex}`);
    } else {
      logService.error('[OnlineGameMode] Could not fetch room data');
      return;
    }

    // Ініціалізація компонентів
    this.stateSync = createFirebaseGameStateSync();
    this.reconciler = new GameStateReconciler(this.myPlayerId);
    this.synchronizer = new OnlineStateSynchronizer(this.stateSync);

    this.matchController = new OnlineMatchController(
      this.roomId,
      this.myPlayerId,
      this.amIHost,
      this.stateSync,
      () => this.resetBoardForContinuation(),
      () => this.advanceToNextPlayer(),
      (reason) => endGameService.endGame(reason)
    );

    // Ініціалізація менеджера подій
    this.eventManager = new OnlineGameEventManager(
      this.roomId,
      this.myPlayerId,
      this.matchController,
      {
        onSyncState: (overrides) => this.synchronizer?.syncCurrentState(overrides),
        isApplyingRemoteState: () => this.isApplyingRemoteState
      },
      this.turnDuration
    );

    // Підписка на оновлення кімнати для PresenceManager та зміни Host
    this.unsubscribeRoom = roomService.subscribeToRoom(this.roomId, (updatedRoom) => {
      this.roomData = updatedRoom;

      const wasHost = this.amIHost;
      this.amIHost = updatedRoom.hostId === this.myPlayerId;
      if (wasHost !== this.amIHost) {
        logService.init(`[OnlineGameMode] Host role changed: ${wasHost} -> ${this.amIHost}`);
        uiStateStore.update(s => ({ ...s, amIHost: this.amIHost }));
      }
    });

    // Ініціалізація Presence Manager
    this.presenceManager = new OnlinePresenceManager({
      roomId: this.roomId,
      myPlayerId: this.myPlayerId,
      isHost: () => this.amIHost,
      getPlayers: () => this.roomData ? Object.values(this.roomData.players) : []
    });

    this.presenceManager.onPlayerDisconnect = (playerId, startedAt) => {
      const player = this.roomData?.players[playerId];
      const name = player?.name || 'Unknown';

      logService.init(`[OnlineGameMode] Player ${name} disconnected. Pausing game.`);
      this.stopTurnTimer();

      modalStore.showModal({
        titleKey: 'onlineMenu.waitingForReturn',
        titleValues: { name: name },
        dataTestId: 'reconnection-modal',
        content: {
          playerName: name,
          disconnectStartedAt: startedAt,
          roomId: this.roomId,
          myPlayerId: this.myPlayerId
        },
        variant: 'standard',
        component: ReconnectionModal,
        closable: false
      });
    };

    this.presenceManager.onPlayerReconnect = (playerId) => {
      const currentModal = get(modalStore);
      const player = this.roomData?.players[playerId];
      if (player && currentModal.isOpen && currentModal.dataTestId === 'reconnection-modal') {
        if (currentModal.content && (currentModal.content as any).playerName === player.name) {
          logService.init(`[OnlineGameMode] Player ${player.name} returned. Resuming game.`);
          modalStore.closeModal();
          this.resumeTurnTimer();
        }
      }
    };

    this.presenceManager.start();

    try {
      await this.stateSync.initialize(this.roomId);

      this.unsubscribeSync = this.stateSync.subscribe((event) => {
        this.handleSyncEvent(event);
      });

      this.eventManager.setupSubscriptions();

      const remoteState = await this.stateSync.pullState();

      if (remoteState) {
        logService.GAME_MODE('[OnlineGameMode] Loaded existing state from server');
        this.applyRemoteState(remoteState);
      } else {
        if (this.amIHost) {
          logService.GAME_MODE('[OnlineGameMode] I am Host. Initializing new game state.');
          const playersConfig = this.getPlayersConfiguration();
          gameService.initializeNewGame({
            size: options.newSize,
            players: playersConfig,
          });
          await this.synchronizer.syncCurrentState();
        } else {
          logService.GAME_MODE('[OnlineGameMode] I am Guest. Waiting for Host to initialize state...');
        }
      }

      gameSettingsStore.updateSettings({
        speechRate: 1.6,
        shortSpeech: true,
        speechFor: {
          player: false,
          computer: true,
          onlineMyMove: false,
          onlineOpponentMove: true
        },
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
    if (this.presenceManager) this.presenceManager.stop();
    if (this.unsubscribeSync) this.unsubscribeSync();
    if (this.unsubscribeRoom) this.unsubscribeRoom();
    if (this.eventManager) this.eventManager.cleanup();
    if (this.stateSync) this.stateSync.cleanup();

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
    await this.synchronizer?.syncCurrentState();
  }

  async claimNoMoves(): Promise<void> {
    const playerState = get(playerStore);
    if (playerState?.currentPlayerIndex !== this.myPlayerIndex) {
      notificationService.show({ type: 'warning', messageRaw: 'Зачекайте свого ходу!' });
      return;
    }
    await super.claimNoMoves();
  }

  async handleNoMoves(playerType: 'human' | 'computer'): Promise<void> {
    await super.handleNoMoves(playerType);
  }

  getPlayersConfiguration(): Player[] {
    if (this.roomData) {
      const onlinePlayers = Object.values(this.roomData.players);
      return createOnlinePlayers(onlinePlayers, this.roomData.hostId);
    }
    return createOnlinePlayers();
  }

  getModeName(): 'training' | 'local' | 'timed' | 'online' | 'virtual-player' {
    return 'online';
  }

  async voteToContinue(): Promise<void> {
    if (this.matchController) {
      await this.matchController.handleContinueRequest();
    }
  }

  async voteToFinish(): Promise<void> {
    if (this.matchController) {
      await this.matchController.handleFinishRequest();
    }
  }

  async continueAfterNoMoves(): Promise<void> {
    await this.voteToContinue();
  }

  protected async advanceToNextPlayer(): Promise<void> {
    const currentPlayerState = get(playerStore);
    if (!currentPlayerState) return;
    const nextPlayerIndex = (currentPlayerState.currentPlayerIndex + 1) % currentPlayerState.players.length;

    if (nextPlayerIndex === 0) {
      logService.GAME_MODE(`[OnlineGameMode] Round completed. Flushing round scores to fixed scores.`);
      this.flushRoundScores();
    }

    playerStore.update(s => s ? { ...s, currentPlayerIndex: nextPlayerIndex } : null);

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
      logService.score('[OnlineGameMode] Flushed round scores.', newPlayers.map(p => ({ name: p.name, score: p.score })));
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

      const currentRoundScore = playerToUpdate.roundScore || 0;
      const moveScore = bonusPoints - penaltyPoints;
      playerToUpdate.roundScore = currentRoundScore + moveScore;

      logService.score(`[OnlineGameMode] applyScoreChanges for ${playerToUpdate.name}:`, {
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

  private applyRemoteState(remoteState: SyncableGameState): void {
    this.isApplyingRemoteState = true;

    if (this.reconciler) {
      this.reconciler.apply(remoteState);
    }

    if (this.matchController) {
      this.matchController.checkVotes(remoteState);
    }

    if (remoteState.settings && remoteState.settings.turnDuration) {
      this.turnDuration = remoteState.settings.turnDuration;
    }

    if (!get(modalStore).isOpen) {
      this.startTurn();
    }

    this.isApplyingRemoteState = false;
  }

  private handleSyncEvent(event: GameStateSyncEvent): void {
    switch (event.type) {
      case 'state_updated':
        this.applyRemoteState(event.state);
        break;
      case 'player_left':
        const remainingPlayers = this.roomData ? Object.values(this.roomData.players) : [];
        if (remainingPlayers.length === 1 && remainingPlayers[0].id === this.myPlayerId) {
          notificationService.show({ type: 'success', messageRaw: 'Всі суперники залишили гру. Ви перемогли!' });
          endGameService.endGame('modal.gameOverReasonBonus');
        } else {
          notificationService.show({ type: 'warning', messageRaw: 'Суперник покинув гру' });
        }

        modalStore.closeModal();
        if (!get(modalStore).isOpen) {
          this.resumeTurnTimer();
        }
        break;
      case 'connection_lost':
        notificationService.show({ type: 'error', messageRaw: 'Втрачено з\'єднання з сервером' });
        break;
    }
  }

  private stopTurnTimer() {
    timeService.pauseTurnTimer();
  }

  private resumeTurnTimer() {
    timeService.resumeTurnTimer();
  }
}