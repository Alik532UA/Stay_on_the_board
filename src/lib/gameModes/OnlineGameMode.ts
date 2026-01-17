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
import { roomPlayerService } from '$lib/services/room/roomPlayerService';
import type { MoveDirectionType } from '$lib/models/Piece';
import { notificationService } from '$lib/services/notificationService';
import type { Room } from '$lib/types/online';
import { endGameService } from '$lib/services/endGameService';
import { modalStore, type ModalState } from '$lib/stores/modalStore'; // FIX: Added import

import { GameStateReconciler } from './online/GameStateReconciler';
import { OnlineMatchController } from './online/OnlineMatchController';
import { OnlineGameEventManager } from './online/OnlineGameEventManager';
import { OnlineStateSynchronizer } from './online/OnlineStateSynchronizer';
import { OnlinePresenceManager } from './online/OnlinePresenceManager';

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
    this.resetLocalStores();

    if (!this.initializeSession(options.roomId)) {
      return;
    }

    await this.fetchRoomData();
    if (!this.roomData) return;

    this.determineRole();
    this.applyRoomSettings();
    this.initializeControllers();
    this.setupSubscriptions();
    this.startPresence();

    await this.syncInitialState(options.newSize);
  }

  private resetLocalStores() {
    boardStore.set(null);
    playerStore.set(null);
    scoreStore.set(null);
    animationService.reset();
  }

  private initializeSession(optionRoomId?: string): boolean {
    const session = roomService.getSession();
    this.roomId = optionRoomId || session.roomId;
    this.myPlayerId = session.playerId;

    if (!this.roomId || !this.myPlayerId) {
      logService.error('[OnlineGameMode] Missing roomId or playerId. Cannot initialize.');
      return false;
    }
    return true;
  }

  private async fetchRoomData() {
    this.roomData = await roomService.getRoom(this.roomId!);
    if (!this.roomData) {
      logService.error('[OnlineGameMode] Could not fetch room data');
    }
  }

  private determineRole() {
    if (!this.roomData || !this.myPlayerId) return;
    this.amIHost = this.roomData.hostId === this.myPlayerId;
    this.myPlayerIndex = this.amIHost ? 0 : 1;

    uiStateStore.update(s => ({
      ...s,
      amIHost: this.amIHost,
      onlinePlayerIndex: this.myPlayerIndex,
      intendedGameType: 'online'
    }));

    logService.init(`[OnlineGameMode] Role determined. Host: ${this.amIHost}, Index: ${this.myPlayerIndex}`);
  }

  private applyRoomSettings() {
    if (this.roomData && this.roomData.settings) {
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
  }

  private initializeControllers() {
    this.stateSync = createFirebaseGameStateSync();
    this.reconciler = new GameStateReconciler(this.myPlayerId!);
    this.synchronizer = new OnlineStateSynchronizer(this.stateSync);

    this.matchController = new OnlineMatchController(
      this.roomId!,
      this.myPlayerId!,
      this.amIHost,
      this.stateSync,
      () => this.resetBoardForContinuation(),
      () => this.advanceToNextPlayer(),
      (reason: string, initiatorId?: string) => this.handleGameEnd(reason, initiatorId)
    );

    this.eventManager = new OnlineGameEventManager(
      this.roomId!,
      this.myPlayerId!,
      this.matchController,
      {
        onSyncState: (overrides: Partial<SyncableGameState>) => this.synchronizer?.syncCurrentState(overrides),
        isApplyingRemoteState: () => this.isApplyingRemoteState
      },
      this.turnDuration
    );

    this.presenceManager = new OnlinePresenceManager({
      roomId: this.roomId!,
      myPlayerId: this.myPlayerId!,
      isHost: () => this.amIHost,
      getPlayers: () => this.roomData ? Object.values(this.roomData.players) : []
    });
  }

  private handleGameEnd(reason: string, initiatorId?: string) {
    let specificPlayerIndex: number | undefined;

    if (initiatorId && this.roomData) {
      if (initiatorId === this.roomData.hostId) {
        specificPlayerIndex = 0;
      } else {
        const isGuest = Object.values(this.roomData.players).some(p => p.id === initiatorId);
        if (isGuest) {
          specificPlayerIndex = 1;
        }
      }
    }

    logService.GAME_MODE(`[OnlineGameMode] Ending game. Reason: ${reason}, Initiator: ${initiatorId}, Mapped Index: ${specificPlayerIndex}`);
    endGameService.endGame(reason, null, specificPlayerIndex);
  }

  private setupSubscriptions() {
    this.unsubscribeRoom = roomService.subscribeToRoom(this.roomId!, (updatedRoom) => {
      this.roomData = updatedRoom;
      const wasHost = this.amIHost;
      this.amIHost = updatedRoom.hostId === this.myPlayerId;
      if (wasHost !== this.amIHost) {
        logService.init(`[OnlineGameMode] Host role changed: ${wasHost} -> ${this.amIHost}`);
        uiStateStore.update(s => ({ ...s, amIHost: this.amIHost }));
      }
      this.matchController?.checkForVictory(updatedRoom);
      this.presenceManager?.handleRoomUpdate(updatedRoom);
    });
  }

  private startPresence() {
    this.presenceManager?.start();
  }

  private async syncInitialState(newSize?: number) {
    try {
      await this.stateSync!.initialize(this.roomId!);
      this.unsubscribeSync = this.stateSync!.subscribe((event) => this.handleSyncEvent(event));
      this.eventManager!.setupSubscriptions();

      const remoteState = await this.stateSync!.pullState();

      if (remoteState) {
        logService.GAME_MODE('[OnlineGameMode] Loaded existing state from server');
        this.applyRemoteState(remoteState);
      } else {
        if (this.amIHost) {
          logService.GAME_MODE('[OnlineGameMode] I am Host. Initializing new game state.');
          const playersConfig = this.getPlayersConfiguration();
          gameService.initializeNewGame({
            size: newSize,
            players: playersConfig,
          });
          await this.synchronizer!.syncCurrentState();
        } else {
          logService.GAME_MODE('[OnlineGameMode] I am Guest. Waiting for Host to initialize state...');
        }
      }

      this.applyLocalSettings();
      animationService.initialize();

      if (get(boardStore)) {
        this.startTurn();
      }

    } catch (error) {
      logService.error('[OnlineGameMode] Initialization failed:', error);
    }
  }

  private applyLocalSettings() {
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

    // Implicit Heartbeat: Хід підтверджує присутність. Не чекаємо завершення.
    if (this.roomId && this.myPlayerId) {
        roomPlayerService.sendHeartbeat(this.roomId, this.myPlayerId).catch(() => {});
    }

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
      await this.matchController.handleVote('continue');
    }
  }

  async voteToFinish(reasonKey?: string): Promise<void> {
    if (this.stateSync && this.myPlayerId) {
      logService.GAME_MODE(`[OnlineGameMode] Requesting finish (Cash Out).`);
      await this.stateSync.updateFinishRequest(this.myPlayerId, true);
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

    const previousPlayerIndex = get(playerStore)?.currentPlayerIndex;

    if (this.reconciler) {
      this.reconciler.apply(remoteState);
    }

    if (this.matchController) {
      this.matchController.checkVotes(remoteState);
    }

    if (remoteState.settings && remoteState.settings.turnDuration) {
      this.turnDuration = remoteState.settings.turnDuration;
    }

    const newPlayerIndex = remoteState.playerState.currentPlayerIndex;
    const isNewTurn = previousPlayerIndex !== newPlayerIndex;
    const isGameActive = !get(uiStateStore).isGameOver;

    // FIX: Explicitly cast get(modalStore) to ModalState to fix TS error
    const currentModalState = get(modalStore) as ModalState;
    if (isNewTurn && isGameActive && !currentModalState.isOpen) {
      logService.GAME_MODE(`[OnlineGameMode] Turn changed (${previousPlayerIndex} -> ${newPlayerIndex}). Restarting timer.`);
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
        if (remainingPlayers.length > 1) {
          notificationService.show({ type: 'warning', messageRaw: 'Гравець покинув гру' });
        }
        break;
      case 'connection_lost':
        notificationService.show({ type: 'error', messageRaw: 'Втрачено з\'єднання з сервером' });
        break;
    }
  }
}