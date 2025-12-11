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
import { gameOverStore, type GameOverPayload } from '$lib/stores/gameOverStore';
import type { IGameStateSync, GameStateSyncEvent, SyncableGameState } from '$lib/sync/gameStateSync.interface';
import { createFirebaseGameStateSync } from '$lib/sync/FirebaseGameStateSync';
import type { ScoreChangesData } from '$lib/types/gameMove';
import { roomService } from '$lib/services/roomService';
import type { MoveDirectionType } from '$lib/models/Piece';
import { notificationService } from '$lib/services/notificationService';
import { availableMovesService } from '$lib/services/availableMovesService';
import { gameEventBus, type ShowNoMovesModalPayload } from '$lib/services/gameEventBus';
import type { Room } from '$lib/types/online';
import { modalService } from '$lib/services/modalService';
import { navigationService } from '$lib/services/navigationService';
import { base } from '$app/paths';
import { endGameService } from '$lib/services/endGameService';
import { timeService } from '$lib/services/timeService';
import { modalStore } from '$lib/stores/modalStore';

// Імпорт нових класів
import { GameStateReconciler } from './online/GameStateReconciler';
import { OnlineMatchController } from './online/OnlineMatchController';

export class OnlineGameMode extends BaseGameMode {
  private stateSync: IGameStateSync | null = null;
  private reconciler: GameStateReconciler | null = null;
  private matchController: OnlineMatchController | null = null;

  // Підписки
  private unsubscribeSync: (() => void) | null = null;
  private unsubscribeSettings: (() => void) | null = null;
  private unsubscribeReplay: (() => void) | null = null;
  private unsubscribeCloseModal: (() => void) | null = null;
  private unsubscribeNoMoves: (() => void) | null = null;
  private unsubscribeGameOver: (() => void) | null = null;
  private unsubscribeModalStore: (() => void) | null = null;

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
    this.matchController = new OnlineMatchController(
      this.roomId,
      this.myPlayerId,
      this.amIHost,
      this.stateSync,
      () => this.resetBoardForContinuation(),
      () => this.advanceToNextPlayer(),
      (reason) => endGameService.endGame(reason)
    );

    try {
      await this.stateSync.initialize(this.roomId);

      this.unsubscribeSync = this.stateSync.subscribe((event) => {
        this.handleSyncEvent(event);
      });

      this.setupSubscriptions();

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
          await this.syncCurrentState();
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

  private setupSubscriptions() {
    this.unsubscribeSettings = gameSettingsStore.subscribe(settings => {
      if (!this.isApplyingRemoteState && this.roomId) {
        this.syncCurrentState();
      }
    });

    this.unsubscribeReplay = gameEventBus.subscribe('ReplayGame', () => {
      this.matchController?.handleRestartRequest();
    });

    gameEventBus.subscribe('RequestReplay', () => {
      if (this.roomId && this.myPlayerId) {
        roomService.setWatchingReplay(this.roomId, this.myPlayerId, true);
      }
    });

    this.unsubscribeCloseModal = gameEventBus.subscribe('CloseModal', () => {
      if (this.roomId && this.myPlayerId) {
        roomService.setWatchingReplay(this.roomId, this.myPlayerId, false);
      }
    });

    this.unsubscribeNoMoves = gameEventBus.subscribe('ShowNoMovesModal', (payload: ShowNoMovesModalPayload & { isRemote?: boolean }) => {
      timeService.stopTurnTimer();

      if (this.myPlayerId && !payload.isRemote) {
        logService.GAME_MODE('[OnlineGameMode] Local NoMoves claim detected. Syncing to server.');
        this.syncCurrentState({
          noMovesClaim: {
            playerId: this.myPlayerId,
            scoreDetails: payload.scoreDetails,
            boardSize: payload.boardSize,
            timestamp: Date.now(),
            isCorrect: true
          }
        });
      }
    });

    this.unsubscribeGameOver = gameEventBus.subscribe('GameOver', (payload: GameOverPayload) => {
      if (!this.isApplyingRemoteState && this.roomId) {
        logService.GAME_MODE('[OnlineGameMode] Local GameOver detected. Syncing to server.');
        this.syncCurrentState({
          gameOver: payload
        });
      }
    });

    this.unsubscribeModalStore = modalStore.subscribe(state => {
      if (state.isOpen) {
        logService.GAME_MODE('[OnlineGameMode] Modal opened. Pausing timer.');
        timeService.pauseGameTimer();
        timeService.stopTurnTimer();
      } else {
        const uiState = get(uiStateStore);
        if (!uiState.isGameOver && this.turnDuration > 0) {
          logService.GAME_MODE('[OnlineGameMode] Modal closed. Resuming timer.');
          // Тут можна додати логіку відновлення таймера, якщо потрібно
        }
      }
    });
  }

  cleanup(): void {
    if (this.unsubscribeSync) this.unsubscribeSync();
    if (this.unsubscribeSettings) this.unsubscribeSettings();
    if (this.unsubscribeReplay) this.unsubscribeReplay();
    if (this.unsubscribeCloseModal) this.unsubscribeCloseModal();
    if (this.unsubscribeNoMoves) this.unsubscribeNoMoves();
    if (this.unsubscribeGameOver) this.unsubscribeGameOver();
    if (this.unsubscribeModalStore) this.unsubscribeModalStore();
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
    await this.syncCurrentState();
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

  // Делегування методів контролеру
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

  private async handleRestartRequest(): Promise<void> {
    if (this.matchController) {
      await this.matchController.handleRestartRequest();
    }
  }

  private async syncCurrentState(overrides: Partial<SyncableGameState> = {}): Promise<void> {
    if (!this.stateSync) return;
    const boardState = get(boardStore);
    const playerState = get(playerStore);
    const scoreState = get(scoreStore);
    const settings = get(gameSettingsStore);
    const gameOverState = get(gameOverStore);

    if (!boardState || !playerState || !scoreState) return;

    await this.stateSync.pushState({
      boardState,
      playerState,
      scoreState,
      settings: {
        blockModeEnabled: settings.blockModeEnabled,
        autoHideBoard: settings.autoHideBoard,
        boardSize: settings.boardSize,
        turnDuration: settings.turnDuration,
        settingsLocked: settings.settingsLocked
      },
      gameOver: gameOverState.isGameOver ? gameOverState.gameResult : null,
      version: Date.now(),
      updatedAt: Date.now(),
      ...overrides
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

    // Запускаємо таймер тільки якщо немає відкритих модалок
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
        notificationService.show({ type: 'warning', messageRaw: 'Суперник покинув гру' });
        break;
      case 'connection_lost':
        notificationService.show({ type: 'error', messageRaw: 'Втрачено з\'єднання з сервером' });
        break;
    }
  }
}