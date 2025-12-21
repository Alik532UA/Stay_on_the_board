/**
 * @file A simple event bus for decoupling game logic from side effects.
 * Services can dispatch events, and handlers can subscribe to them to perform actions.
 * 
 * @description Цей модуль також підтримує систему нагород через спеціалізовані події.
 */

import type { GameOverPayload, PlayerScoreResult } from '$lib/stores/gameOverStore';
import type { ModalState } from '$lib/stores/modalStore';
import type { MoveDirectionType } from '$lib/models/Piece';

/**
 * Тип payload для показу модального вікна.
 */
export type ShowModalPayload = Partial<ModalState> & { dataTestId: string };

/**
 * Payload для озвучення ходу.
 */
export interface SpeakMovePayload {
  move: {
    direction: string;
    distance: number;
  };
  lang?: string;
  voiceURI?: string | null;
  onEndCallback?: () => void;
}

/**
 * Payload для підтвердження зміни розміру дошки.
 */
export interface BoardResizePayload {
  newSize: number;
}

/**
 * Payload для показу модального вікна "Немає ходів".
 */
export interface ShowNoMovesModalPayload {
  playerType: 'human' | 'computer';
  scoreDetails: any; // Можна уточнити тип, якщо він експортується (FinalScoreDetails)
  boardSize: number;
  playerScores?: Array<PlayerScoreResult & { playerName: string; playerColor: string; isWinner?: boolean; isLoser?: boolean }>;
}

/**
 * Payload для додавання нового ходу в чергу анімації.
 */
export interface NewMoveAddedPayload {
  player: number;
  direction: MoveDirectionType;
  distance: number;
  to: { row: number; col: number };
}

/**
 * Всі типи подій гри та їх payloads.
 */
export interface GameEventPayloads {
  // Reward Events
  MOVE_COMPLETED: {
    playerId: number;
    playerName: string;
    direction: string;
    distance: number;
    newScore: number;
    jumpedBlockedCells: number;
    totalMoves: number;
  };
  GAME_FINISHED: {
    gameMode: string;
    finalScore: number;
    totalMoves: number;
    playerId: number;
    playerName: string;
    isWinner: boolean;
    reason: string;
  };
  SCORE_MILESTONE_REACHED: {
    playerId: number;
    milestone: number;
    currentScore: number;
  };
  JUMP_STREAK_ACHIEVED: {
    playerId: number;
    streakCount: number;
  };
  ROUND_WON: {
    playerId: number;
    roundNumber: number;
    roundScore: number;
  };
  NO_MOVES_CLAIMED: {
    playerId: number;
    wasCorrect: boolean;
    bonusAwarded: number;
  };

  // UI & Game Flow Events
  GameOver: GameOverPayload;
  CloseModal: void;
  ShowModal: ShowModalPayload;
  SpeakMove: SpeakMovePayload;
  ReplayGame: void;
  RequestReplay: void;
  BoardResizeConfirmed: BoardResizePayload;
  ShowNoMovesModal: ShowNoMovesModalPayload;
  new_move_added: NewMoveAddedPayload;

  // Legacy/Other Events (Типізовано як словник замість any для безпеки)
  GameStateChanged: Record<string, unknown>;
  PlayerTurnStarted: Record<string, unknown>;
  PlayerTurnEnded: Record<string, unknown>;
}

export type GameEventType = keyof GameEventPayloads;

type GameEventListener<T> = (payload: T) => void;

class GameEventBus {
  private listeners: Map<GameEventType, GameEventListener<any>[]> = new Map();

  /**
   * Subscribes a listener to a specific event type.
   * @param eventType The type of event to listen for.
   * @param listener The callback function to execute when the event is dispatched.
   * @returns An unsubscribe function.
   */
  subscribe<K extends GameEventType>(
    eventType: K,
    listener: GameEventListener<GameEventPayloads[K]>
  ): () => void {
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
   * @param args The data to pass to the listeners (optional if payload is void).
   */
  dispatch<K extends GameEventType>(
    eventType: K,
    ...args: GameEventPayloads[K] extends void ? [payload?: void] : [payload: GameEventPayloads[K]]
  ): void {
    const payload = args[0];
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