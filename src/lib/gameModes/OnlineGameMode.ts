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
import { gameOverStore } from '$lib/stores/gameOverStore';
import type { IGameStateSync, GameStateSyncEvent, SyncableGameState } from '$lib/sync/gameStateSync.interface';
import { createFirebaseGameStateSync } from '$lib/sync/FirebaseGameStateSync';
import type { ScoreChangesData } from '$lib/types/gameMove';
import { roomService } from '$lib/services/roomService';
import type { MoveDirectionType } from '$lib/models/Piece';
import { notificationService } from '$lib/services/notificationService';
import { availableMovesService } from '$lib/services/availableMovesService';
import { gameEventBus } from '$lib/services/gameEventBus';
import type { Room } from '$lib/types/online';
import { modalService } from '$lib/services/modalService';
import { navigationService } from '$lib/services/navigationService';
import { base } from '$app/paths';

export class OnlineGameMode extends BaseGameMode {
  private stateSync: IGameStateSync | null = null;
  private unsubscribeSync: (() => void) | null = null;
  private unsubscribeSettings: (() => void) | null = null;
  private unsubscribeReplay: (() => void) | null = null;
  private unsubscribeCloseModal: (() => void) | null = null; // Нова підписка
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

    this.stateSync = createFirebaseGameStateSync();

    try {
      await this.stateSync.initialize(this.roomId);

      this.unsubscribeSync = this.stateSync.subscribe((event) => {
        this.handleSyncEvent(event);
      });

      this.unsubscribeSettings = gameSettingsStore.subscribe(settings => {
        if (!this.isApplyingRemoteState && this.roomId) {
          this.syncCurrentState();
        }
      });

      this.unsubscribeReplay = gameEventBus.subscribe('ReplayGame', () => {
        this.handleRestartRequest();
      });

      // Підписка на відкриття реплею (через RequestReplay, який викликає модалку)
      // ВАЖЛИВО: RequestReplay викликається ДО відкриття модалки.
      // Але ми також можемо слухати ShowModal, щоб бути точнішими.
      // Для простоти, використаємо RequestReplay як сигнал "хочу подивитись реплей".
      gameEventBus.subscribe('RequestReplay', () => {
        if (this.roomId && this.myPlayerId) {
          roomService.setWatchingReplay(this.roomId, this.myPlayerId, true);
        }
      });

      // Підписка на закриття модалки
      this.unsubscribeCloseModal = gameEventBus.subscribe('CloseModal', () => {
        if (this.roomId && this.myPlayerId) {
          roomService.setWatchingReplay(this.roomId, this.myPlayerId, false);
        }
      });

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
    if (this.unsubscribeReplay) {
      this.unsubscribeReplay();
      this.unsubscribeReplay = null;
    }
    if (this.unsubscribeCloseModal) {
      this.unsubscribeCloseModal();
      this.unsubscribeCloseModal = null;
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
    if (this.roomData) {
      const onlinePlayers = Object.values(this.roomData.players);
      return createOnlinePlayers(onlinePlayers, this.roomData.hostId);
    }
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
    if (!this.myPlayerId || !this.roomId) {
      logService.error('[OnlineGameMode] Cannot restart: missing ID or RoomID');
      return;
    }

    logService.GAME_MODE('[OnlineGameMode] Restart requested. Returning to lobby.');

    modalService.closeAllModals();

    await roomService.returnToLobby(this.roomId, this.myPlayerId);

    navigationService.goTo(`/online/lobby/${this.roomId}`);
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

    const currentBoard = get(boardStore);

    if (currentBoard && remoteState.boardState) {
      if (remoteState.boardState.moveHistory.length < currentBoard.moveHistory.length) {
        logService.GAME_MODE('[OnlineGameMode] Detected game reset. Resetting animation service.');
        animationService.reset();
      }
    }

    if (currentBoard && remoteState.boardState) {
      const oldQueueLength = currentBoard.moveQueue.length;
      const newQueueLength = remoteState.boardState.moveQueue.length;

      if (newQueueLength > oldQueueLength) {
        const newMoves = remoteState.boardState.moveQueue.slice(oldQueueLength);
        newMoves.forEach(move => {
          gameEventBus.dispatch('new_move_added', move);
        });
      }
    }

    if (remoteState.boardState) boardStore.set(remoteState.boardState);
    if (remoteState.playerState) playerStore.set(remoteState.playerState);
    if (remoteState.scoreState) scoreStore.set(remoteState.scoreState);

    if (remoteState.settings) {
      gameSettingsStore.updateSettings(remoteState.settings);
      if (remoteState.settings.turnDuration) {
        this.turnDuration = remoteState.settings.turnDuration;
      }
    }

    if (remoteState.gameOver) {
      const currentGameOver = get(gameOverStore);
      uiStateStore.update(s => ({ ...s, isGameOver: true }));

      if (!currentGameOver.isGameOver) {
        logService.GAME_MODE('[OnlineGameMode] Syncing GameOver state from server');
        gameOverStore.setGameOver(remoteState.gameOver);
        modalService.showGameOverModal(remoteState.gameOver!);
      }
    } else {
      uiStateStore.update(s => ({ ...s, isGameOver: false }));

      const currentGameOver = get(gameOverStore);
      if (currentGameOver.isGameOver) {
        logService.GAME_MODE('[OnlineGameMode] Clearing local GameOver state (server state is active)');
        gameOverStore.resetGameOverState();
        modalService.closeAllModals();
      }
    }

    availableMovesService.updateAvailableMoves();
    this.startTurn();

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