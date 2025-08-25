import type { GameState } from '$lib/stores/gameState';
import type { Player } from '$lib/models/player';
import type { FinalScoreDetails } from '$lib/models/score';
import type { MoveDirectionType } from '$lib/models/Figure';
import type { SideEffect } from '$lib/services/sideEffectService';

/**
 * @file Визначає загальний інтерфейс для всіх ігрових режимів.
 * Це дозволяє абстрагувати логіку, специфічну для кожного режиму (локальна гра, гра проти ШІ, онлайн),
 * від загального оркестратора гри.
 */
export interface IGameMode {
  /**
   * Ініціалізує або перезапускає режим гри.
   * @param options - Опції для ініціалізації, наприклад, новий розмір дошки.
   */
  initialize(options?: { newSize?: number }): void;

  /**
   * Обробляє хід гравця.
   * @param direction - Напрямок ходу.
   * @param distance - Відстань ходу.
   * @returns Promise, що вирішується масивом побічних ефектів.
   */
  handlePlayerMove(direction: MoveDirectionType, distance: number): Promise<void>;

  /**
   * Обробляє заявку гравця про відсутність ходів.
   * @returns Promise, що вирішується після обробки заявки.
   */
  claimNoMoves(): Promise<void>;

  /**
   * Обробляє ситуацію, коли у гравця або комп'ютера немає ходів.
   * @param playerType - Тип гравця ('human' або 'computer').
   */
  handleNoMoves(playerType: 'human' | 'computer'): Promise<void>;

  /**
   * Повертає конфігурацію гравців для цього режиму.
   * @returns Масив об'єктів гравців.
   */
  getPlayersConfiguration(): Player[];

  /**
   * Визначає переможця(ів) на основі кінцевого стану гри.
   * @param state - Кінцевий стан гри.
   * @returns Об'єкт з інформацією про переможця.
   */

}