import type { GameState, Player } from '$lib/stores/gameState';
import type { FinalScoreDetails } from '$lib/models/score';
import type { MoveDirectionType } from '$lib/models/Figure';

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
  determineWinner(state: GameState, reasonKey: string): {
    winners: number[];
    winningPlayerIndex: number;
  };

  /**
   * Створює контент для модального вікна завершення гри.
   * @param reasonKey - Ключ причини завершення.
   * @param reasonValues - Додаткові значення.
   * @param finalScoreDetails - Деталі фінального рахунку.
   * @param state - Поточний стан гри.
   * @returns Об'єкт з контентом для модального вікна.
   */
  createGameOverModalContent(
    reasonKey: string,
    reasonValues: Record<string, any> | null,
    finalScoreDetails: FinalScoreDetails,
    state: GameState
  ): { titleKey: string; content: any };
}