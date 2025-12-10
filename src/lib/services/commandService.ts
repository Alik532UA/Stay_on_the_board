import { gameEventBus, type ShowModalPayload, type SpeakMovePayload, type BoardResizePayload } from './gameEventBus';
import { sideEffectService } from './sideEffectService';
import { logService } from './logService';
import { userActionService } from './userActionService';
import type { GameOverPayload } from '$lib/stores/gameOverStore';

class CommandService {
  constructor() {
    this.subscribeToEvents();
  }

  private subscribeToEvents() {
    gameEventBus.subscribe('GameOver', (payload) => this.handleGameOver(payload));
    gameEventBus.subscribe('CloseModal', () => this.handleCloseModal());
    gameEventBus.subscribe('ShowModal', (payload) => this.handleShowModal(payload));
    gameEventBus.subscribe('SpeakMove', (payload) => this.handleSpeakMove(payload));
    gameEventBus.subscribe('ReplayGame', () => this.handleReplayGame());
    gameEventBus.subscribe('RequestReplay', () => this.handleRequestReplay());
    gameEventBus.subscribe('BoardResizeConfirmed', (payload) => this.handleBoardResizeConfirmed(payload));
  }

  private handleGameOver(payload: GameOverPayload) {
    logService.logicMove('CommandService: Handling GameOver event', payload);
    sideEffectService.execute({
      type: 'ui/showGameOverModal',
      payload: payload
    });
  }

  private handleCloseModal() {
    logService.logicMove('CommandService: Handling CloseModal event');
    sideEffectService.execute({
      type: 'ui/closeModal'
    });
  }

  private handleShowModal(payload: ShowModalPayload) {
    logService.logicMove('CommandService: Handling ShowModal event', payload);
    sideEffectService.execute({
      type: 'ui/showModal',
      payload: payload
    });
  }

  private handleSpeakMove(payload: SpeakMovePayload) {
    logService.logicMove('CommandService: Handling SpeakMove event', payload);
    sideEffectService.execute({
      type: 'speak_move',
      payload: {
        move: payload.move as { direction: import('$lib/models/Piece').MoveDirectionType; distance: number },
        lang: payload.lang || 'uk',
        voiceURI: payload.voiceURI || null,
        onEndCallback: payload.onEndCallback
      }
    });
  }

  private handleReplayGame() {
    logService.logicMove('CommandService: Handling ReplayGame event');
    userActionService.requestRestart();
  }

  private handleRequestReplay() {
    logService.logicMove('CommandService: Handling RequestReplay event');
    userActionService.requestReplay();
  }

  private handleBoardResizeConfirmed(payload: BoardResizePayload) {
    logService.logicMove('CommandService: Handling BoardResizeConfirmed event', payload);
    userActionService.requestRestartWithSize(payload.newSize);
  }
}

// Initialize the service to start listening for events.
export const commandService = new CommandService();