/**
 * @file A simple event bus for decoupling game logic from side effects.
 * Services can dispatch events, and handlers can subscribe to them to perform actions.
 * 
 * @description Цей модуль також підтримує систему нагород через спеціалізовані події.
 */

/**
 * Типи подій для системи нагород.
 */
export interface RewardEventPayloads {
  /** Хід успішно завершено */
  MOVE_COMPLETED: {
    playerId: number;
    playerName: string;
    direction: string;
    distance: number;
    newScore: number;
    jumpedBlockedCells: number;
    totalMoves: number;
  };

  /** Гра завершена */
  GAME_FINISHED: {
    gameMode: string;
    finalScore: number;
    totalMoves: number;
    playerId: number;
    playerName: string;
    isWinner: boolean;
    reason: string;
  };

  /** Досягнуто milestone рахунку */
  SCORE_MILESTONE_REACHED: {
    playerId: number;
    milestone: number;
    currentScore: number;
  };

  /** Серія стрибків через заблоковані клітинки */
  JUMP_STREAK_ACHIEVED: {
    playerId: number;
    streakCount: number;
  };

  /** Виграш раунду в локальній грі */
  ROUND_WON: {
    playerId: number;
    roundNumber: number;
    roundScore: number;
  };

  /** Немає ходів - успішно заявлено */
  NO_MOVES_CLAIMED: {
    playerId: number;
    wasCorrect: boolean;
    bonusAwarded: number;
  };
}

/**
 * Всі типи подій гри.
 */
export type GameEventType =
  | keyof RewardEventPayloads
  | 'CloseModal'
  | 'OpenModal'
  | 'GameStateChanged'
  | 'PlayerTurnStarted'
  | 'PlayerTurnEnded'
  | string; // Для зворотної сумісності

type GameEventPayload = any;
type GameEventListener<T = any> = (payload: T) => void;

class GameEventBus {
  private listeners: Map<GameEventType, GameEventListener[]> = new Map();

  /**
   * Subscribes a listener to a specific event type.
   * @param eventType The type of event to listen for.
   * @param listener The callback function to execute when the event is dispatched.
   * @returns An unsubscribe function.
   */
  subscribe<K extends keyof RewardEventPayloads>(
    eventType: K,
    listener: GameEventListener<RewardEventPayloads[K]>
  ): () => void;
  subscribe(eventType: GameEventType, listener: GameEventListener): () => void;
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
  dispatch<K extends keyof RewardEventPayloads>(
    eventType: K,
    payload: RewardEventPayloads[K]
  ): void;
  dispatch(eventType: GameEventType, payload?: GameEventPayload): void;
  dispatch(eventType: GameEventType, payload?: GameEventPayload): void {
    if (this.listeners.has(eventType)) {
      this.listeners.get(eventType)!.forEach(listener => listener(payload));
    }
  }

  /**
   * Видаляє всіх слухачів для певного типу події.
   * Корисно для очищення при демонтажі компонентів.
   */
  clearListeners(eventType?: GameEventType): void {
    if (eventType) {
      this.listeners.delete(eventType);
    } else {
      this.listeners.clear();
    }
  }
}

export const gameEventBus = new GameEventBus();
