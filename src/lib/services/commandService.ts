/**
 * @file This service subscribes to the gameEventBus and executes commands (side effects).
 * It acts as the bridge between decoupled game logic and the actual side effect implementations.
 */
import { gameEventBus } from './gameEventBus';
import { sideEffectService } from './sideEffectService';
import { logService } from './logService';

class CommandService {
  constructor() {
    this.subscribeToEvents();
  }

  private subscribeToEvents() {
    gameEventBus.subscribe('GameOver', (payload) => this.handleGameOver(payload));
    gameEventBus.subscribe('CloseModal', () => this.handleCloseModal());
    gameEventBus.subscribe('ShowModal', (payload) => this.handleShowModal(payload));
    gameEventBus.subscribe('SpeakMove', (payload) => this.handleSpeakMove(payload));
  }

  private handleGameOver(payload: any) {
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

  private handleShowModal(payload: any) {
    logService.logicMove('CommandService: Handling ShowModal event', payload);
    sideEffectService.execute({
      type: 'ui/showModal',
      payload: payload
    });
  }

  private handleSpeakMove(payload: any) {
    logService.logicMove('CommandService: Handling SpeakMove event', payload);
    sideEffectService.execute({
      type: 'speak',
      payload: payload
    });
  }
}

// Initialize the service to start listening for events.
export const commandService = new CommandService();