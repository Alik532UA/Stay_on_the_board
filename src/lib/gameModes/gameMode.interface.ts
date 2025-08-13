import type { GameState, Player } from '$lib/stores/gameState';
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
   * Ініціалізує режим гри з початковим станом.
   * @param initialState - Початковий стан гри.
   */
  initialize(initialState: GameState): void;

  /**
   * Обробляє хід гравця.
   * @param direction - Напрямок ходу.
   * @param distance - Відстань ходу.
   * @returns Promise, що вирішується масивом побічних ефектів.
   */
  handlePlayerMove(direction: MoveDirectionType, distance: number): Promise<SideEffect[]>;

  /**
   * Обробляє заявку гравця про відсутність ходів.
   * @returns Promise, що вирішується після обробки заявки.
   */
  claimNoMoves(): Promise<SideEffect[]>;

  /**
   * Обробляє ситуацію, коли у гравця або комп'ютера немає ходів.
   * @param playerType - Тип гравця ('human' або 'computer').
   */
  handleNoMoves(playerType: 'human' | 'computer'): Promise<SideEffect[]>;

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
  determineWinner(state: GameState, reasonKey: string): {
    winners: number[];
    winningPlayerIndex: number;
  };

}