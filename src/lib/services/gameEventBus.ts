/**
 * @file A simple event bus for decoupling game logic from side effects.
 * Services can dispatch events, and handlers can subscribe to them to perform actions.
 */

type GameEventType = string;
type GameEventPayload = any;
type GameEventListener = (payload: GameEventPayload) => void;

class GameEventBus {
  private listeners: Map<GameEventType, GameEventListener[]> = new Map();

  /**
   * Subscribes a listener to a specific event type.
   * @param eventType The type of event to listen for.
   * @param listener The callback function to execute when the event is dispatched.
   * @returns An unsubscribe function.
   */
  subscribe(eventType: GameEventType, listener: GameEventListener): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }
    this.listeners.get(eventType)!.push(listener);

    return () => {
      const eventListeners = this.listeners.get(eventType);
      if (eventListeners) {
        const index = eventListeners.indexOf(listener);
        if (index > -1) {
          eventListeners.splice(index, 1);
        }
      }
    };
  }

  /**
   * Dispatches an event to all subscribed listeners.
   * @param eventType The type of event to dispatch.
   * @param payload The data to pass to the listeners.
   */
  dispatch(eventType: GameEventType, payload?: GameEventPayload): void {
    if (this.listeners.has(eventType)) {
      this.listeners.get(eventType)!.forEach(listener => listener(payload));
    }
  }
}

export const gameEventBus = new GameEventBus();