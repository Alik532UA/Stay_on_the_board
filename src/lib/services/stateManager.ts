/**
 * Централізований сервіс для управління станом гри.
 * Єдине місце для всіх мутацій стану з валідацією та логуванням.
 */

import { get } from 'svelte/store';
import { playerInputStore } from '../stores/playerInputStore.js';
import { animationStore } from '../stores/animationStore.js';
import { logService } from './logService.js';
import { gameState } from '../stores/gameState.js';
import { validatePlayerMove } from './gameLogicService.js';
import { validateScoreUpdate } from './scoreService.js';

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
        const { errors: moveErrors, warnings: moveWarnings } = validatePlayerMove(changes, get(gameState));
        errors.push(...moveErrors);
        warnings.push(...moveWarnings);
        break;
      case 'UPDATE_SCORE':
        const { errors: scoreErrors, warnings: scoreWarnings } = validateScoreUpdate(changes, get(gameState));
        errors.push(...scoreErrors);
        warnings.push(...scoreWarnings);
        break;
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Застосовує зміни до стану
   * @param action - Назва дії
   * @param changes - Зміни стану
   * @param reason - Причина зміни
   * @returns Promise<boolean> - Чи успішно застосовано зміни
   */
  async applyChanges(action: string, changes: GameStateChanges, reason: string = ''): Promise<boolean> {
    try {
      const validation = await this.validateChanges(action, changes);
      if (!validation.isValid) {
        logService.state('StateManager validation failed', { action, reason, errors: validation.errors });
        return false;
      }
      if (validation.warnings.length > 0) {
        logService.state('StateManager validation warnings', { action, reason, warnings: validation.warnings });
      }

      gameState.update((currentState: any) => ({
        ...currentState,
        ...changes
      }));

      this.addToHistory({ action, changes, timestamp: new Date(), reason });

      logService.state(`Applied change: ${action}`, { reason, changes });

      return true;
    } catch (error) {
      logService.state('StateManager applyChanges failed', { action, reason, error });
      return false;
    }
  }

  /**
   * Застосовує зміни до playerInputStore
   */
  applyPlayerInputChanges(changes: GameStateChanges, reason: string = ''): void {}

  /**
   * Застосовує зміни до animationStore
   */
  applyAnimationChanges(changes: GameStateChanges, reason: string = ''): void {}

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
      gameState.update((currentState: any) => {
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
  getCurrentState(): any {
    return get(gameState);
  }

  /**
   * Валідує цілісність стану
   * @returns Promise<ValidationResult> - Результат валідації
   */
  async validateStateIntegrity(): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      const currentState = this.getCurrentState();

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