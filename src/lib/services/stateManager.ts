/**
 * Централізований сервіс для управління станом гри.
 * Єдине місце для всіх мутацій стану з валідацією та логуванням.
 */

import { get } from 'svelte/store';
import { playerInputStore } from '../stores/playerInputStore.js';
import { animationStore } from '../stores/animationStore.js';
import { logService } from './logService.js';

// Відкладаємо імпорт gameState
let gameState: any = null;

export interface StateChange {
  action: string;
  changes: Record<string, any>;
  timestamp: Date;
  reason?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface GameStateChanges {
  playerRow?: number;
  playerCol?: number;
  board?: number[][];
  scores?: number[];
  gameStatus?: string;
  gameId?: number;
  [key: string]: any;
}

export class StateManager {
  private changeHistory: StateChange[] = [];
  private maxHistorySize: number = 100;
  private isProcessing: boolean = false;

  constructor() {
    this.changeHistory = [];
    this.maxHistorySize = 100;
    this.isProcessing = false;
  }

  /**
   * Отримує gameState з відкладеним імпортом
   */
  async getGameState(): Promise<any> {
    if (!gameState) {
      try {
        const module = await import('../stores/gameState.js');
        gameState = module.gameState;
      } catch (error) {
        console.error('Помилка імпорту gameState:', error);
        throw error;
      }
    }
    return gameState;
  }

  /**
   * Валідує зміни стану перед застосуванням
   */
  async validateChanges(action: string, changes: GameStateChanges): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Базова валідація
    if (!action || typeof action !== 'string') {
      errors.push('Action must be a non-empty string');
    }

    if (!changes || typeof changes !== 'object') {
      errors.push('Changes must be an object');
    }

    // Специфічна валідація для різних дій
    switch (action) {
      case 'MOVE_PLAYER':
      case 'PERFORM_MOVE':
        await this.validatePlayerMove(changes, errors, warnings);
        break;
      case 'UPDATE_SCORE':
        await this.validateScoreUpdate(changes, errors, warnings);
        break;
      case 'END_GAME':
        await this.validateGameEnd(changes, errors, warnings);
        break;
      case 'RESET_GAME':
        await this.validateGameReset(changes, errors, warnings);
        break;
      case 'SET_COMPUTER_TURN':
      case 'SET_PLAYER_TURN':
      case 'SET_COMPUTER_MOVE_PROGRESS':
      case 'UPDATE_AVAILABLE_MOVES':
      case 'NO_MOVES_CLAIM':
      case 'CONTINUE_GAME':
      case 'FINALIZE_GAME':
      case 'FIRST_MOVE_COMPLETED':
      case 'ADVANCE_TURN':
        // Ці дії не потребують спеціальної валідації
        break;
      default:
        warnings.push(`Unknown action: ${action}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Валідує зміни позиції гравця
   */
  async validatePlayerMove(changes: GameStateChanges, errors: string[], warnings: string[]): Promise<void> {
    const currentState = await this.getCurrentState();

    // Валідація playerRow
    if (changes.playerRow !== undefined) {
      console.log('validatePlayerMove: перевіряємо playerRow:', changes.playerRow);
      if (typeof changes.playerRow !== 'number' || changes.playerRow < 0) {
        errors.push('playerRow must be a non-negative number');
      } else if (changes.playerRow >= currentState.boardSize) {
        errors.push('playerRow must be within board bounds');
      }
    }

    // Валідація playerCol
    if (changes.playerCol !== undefined) {
      console.log('validatePlayerMove: перевіряємо playerCol:', changes.playerCol);
      if (typeof changes.playerCol !== 'number' || changes.playerCol < 0) {
        errors.push('playerCol must be a non-negative number');
      } else if (changes.playerCol >= currentState.boardSize) {
        errors.push('playerCol must be within board bounds');
      }
    }

    // Перевіряємо, чи не виходить гравець за межі дошки
    if (changes.playerRow !== undefined && changes.playerCol !== undefined) {
      // Використовуємо поточну дошку для валідації руху
      const board = currentState.board;
      console.log('validatePlayerMove: перевіряємо клітинку на дошці:', {
        row: changes.playerRow,
        col: changes.playerCol,
        boardValue: board[changes.playerRow] ? board[changes.playerRow][changes.playerCol] : 'undefined'
      });
      // Гравець може рухатися тільки на порожні клітинки (значення 0)
      // Заблоковані клітинки мають значення більше 0
      if (board[changes.playerRow] && board[changes.playerRow][changes.playerCol] !== 0) {
        errors.push('Player cannot move to a blocked cell');
      }
    }
  }

  /**
   * Валідує зміни рахунку
   */
  async validateScoreUpdate(changes: GameStateChanges, errors: string[], warnings: string[]): Promise<void> {
    const currentState = await this.getCurrentState();

    if (changes.scores !== undefined) {
      if (!Array.isArray(changes.scores)) {
        errors.push('scores must be an array');
      } else if (changes.scores.length !== currentState.players.length) {
        errors.push('scores array length must match players count');
      } else {
        for (let i = 0; i < changes.scores.length; i++) {
          if (typeof changes.scores[i] !== 'number') {
            errors.push(`score[${i}] must be a number`);
          }
        }
      }
    }
  }

  /**
   * Валідує завершення гри
   */
  async validateGameEnd(changes: GameStateChanges, errors: string[], warnings: string[]): Promise<void> {
    if (changes.gameStatus !== undefined && !['playing', 'ended', 'paused'].includes(changes.gameStatus)) {
      errors.push('gameStatus must be one of: playing, ended, paused');
    }
  }

  /**
   * Валідує скидання гри
   */
  async validateGameReset(changes: GameStateChanges, errors: string[], warnings: string[]): Promise<void> {
    // Базова валідація для скидання гри
    if (changes.gameId !== undefined && typeof changes.gameId !== 'number') {
      errors.push('gameId must be a number');
    }
  }

  /**
   * Застосовує зміни до стану
   * @param action - Назва дії
   * @param changes - Зміни стану
   * @param reason - Причина зміни
   * @returns Promise<boolean> - Чи успішно застосовано зміни
   */
  async applyChanges(action: string, changes: GameStateChanges, reason: string = ''): Promise<boolean> {
    console.log('🎮 StateManager.applyChanges: початок з:', { action, changes, reason });

    try {
      // Валідація змін
      const validation = await this.validateChanges(action, changes);
      if (!validation.isValid) {
        console.error('❌ StateManager.applyChanges: валідація не пройшла:', validation.errors);
        return false;
      }

      if (validation.warnings.length > 0) {
        console.warn('⚠️ StateManager.applyChanges: попередження:', validation.warnings);
      }

      // Отримуємо поточний стан
      const currentState = await this.getCurrentState();
      const oldState = { ...currentState };

      // Застосовуємо зміни до gameState
      const gameStateInstance = await this.getGameState();
      gameStateInstance.update((currentState: any) => ({
        ...currentState,
        ...changes
      }));

      // Застосовуємо зміни до playerInputStore
      this.applyPlayerInputChanges(changes, reason);

      // Застосовуємо зміни до animationStore
      this.applyAnimationChanges(changes, reason);

      // Додаємо до історії
      this.addToHistory({
        action,
        changes,
        timestamp: new Date(),
        reason
      });

      // Логуємо зміни
      logService.state('State change applied', {
        action,
        oldState: { playerRow: oldState.playerRow, playerCol: oldState.playerCol },
        changes: { playerRow: changes.playerRow, playerCol: changes.playerCol },
        reason
      });

      console.log('✅ StateManager.applyChanges: успішно завершено');
      return true;

    } catch (error) {
      console.error('❌ StateManager.applyChanges: помилка:', error);
      return false;
    }
  }

  /**
   * Застосовує зміни до playerInputStore
   */
  applyPlayerInputChanges(changes: GameStateChanges, reason: string = ''): void {
    // Логіка застосування змін до playerInputStore
    console.log('🎮 StateManager.applyPlayerInputChanges:', { changes, reason });
  }

  /**
   * Застосовує зміни до animationStore
   */
  applyAnimationChanges(changes: GameStateChanges, reason: string = ''): void {
    // Логіка застосування змін до animationStore
    console.log('🎮 StateManager.applyAnimationChanges:', { changes, reason });
  }

  /**
   * Додає запис до історії змін
   */
  addToHistory(changeRecord: StateChange): void {
    this.changeHistory.push(changeRecord);
    
    // Обмежуємо розмір історії
    if (this.changeHistory.length > this.maxHistorySize) {
      this.changeHistory = this.changeHistory.slice(-this.maxHistorySize);
    }
  }

  /**
   * Отримує історію змін
   */
  getHistory(): StateChange[] {
    return [...this.changeHistory];
  }

  /**
   * Очищає історію змін
   */
  clearHistory(): void {
    this.changeHistory = [];
  }

  /**
   * Відміняє останню зміну
   * @returns Promise<boolean> - Чи успішно відмінено
   */
  async undoLastChange(): Promise<boolean> {
    if (this.changeHistory.length === 0) {
      console.warn('⚠️ StateManager.undoLastChange: історія порожня');
      return false;
    }

    try {
      const lastChange = this.changeHistory.pop();
      if (!lastChange) return false;

      console.log('🔄 StateManager.undoLastChange: відміняємо зміну:', lastChange);

      // Відміняємо зміни (спрощена логіка)
      const gameStateInstance = await this.getGameState();
      gameStateInstance.update((currentState: any) => {
        const revertedState = { ...currentState };
        
        // Відміняємо зміни (тут потрібна більш складна логіка)
        // Поки що просто логуємо
        console.log('🔄 StateManager.undoLastChange: відновлюємо стан');
        
        return revertedState;
      });

      return true;
    } catch (error) {
      console.error('❌ StateManager.undoLastChange: помилка:', error);
      return false;
    }
  }

  /**
   * Отримує поточний стан
   * @returns Promise<Object> - Поточний стан
   */
  async getCurrentState(): Promise<any> {
    const gameStateInstance = await this.getGameState();
    return get(gameStateInstance);
  }

  /**
   * Валідує цілісність стану
   * @returns Promise<ValidationResult> - Результат валідації
   */
  async validateStateIntegrity(): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      const currentState = await this.getCurrentState();

      // Перевіряємо основні поля
      if (!currentState.board || !Array.isArray(currentState.board)) {
        errors.push('Board is missing or invalid');
      }

      if (typeof currentState.boardSize !== 'number' || currentState.boardSize <= 0) {
        errors.push('Board size is invalid');
      }

      if (!currentState.players || !Array.isArray(currentState.players)) {
        errors.push('Players array is missing or invalid');
      }

      // Перевіряємо позиції гравців
      currentState.players.forEach((player: any, index: number) => {
        if (typeof player.row !== 'number' || typeof player.col !== 'number') {
          errors.push(`Player ${index} has invalid position`);
        }
      });

    } catch (error) {
      errors.push(`Failed to validate state: ${error}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
}

// Експортуємо єдиний екземпляр
export const stateManager = new StateManager(); 