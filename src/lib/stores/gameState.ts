/**
 * @file Manages the core, persistent state of the game board and logic.
 * This is the single source of truth for the game's current situation.
 */
import { writable } from 'svelte/store';
import { createEmptyBoard, getRandomCell, getAvailableMoves } from '$lib/utils/boardUtils.ts';

// Імпортуємо типи з gameLogicService
import type { Direction, Move } from '$lib/services/gameLogicService';

const initialBoardSize = 4;

export type PlayerType = 'human' | 'ai' | 'remote';
export interface Player { id: number; type: PlayerType; name: string; }
export type CellVisitCounts = Record<string, number>;
export interface MoveHistoryEntry { pos: {row: number, col: number}, blocked: {row: number, col: number}[], visits?: CellVisitCounts, blockModeEnabled?: boolean }
export interface GameState {
  /** Унікальний ідентифікатор поточної гри, змінюється при кожному перезапуску. */
  gameId: number;
  /** Поточний розмір дошки (наприклад, 4 для 4x4). */
  boardSize: number;
  /** Двовимірний масив, що представляє ігрову дошку. */
  board: number[][];
  /** Поточний рядок, де знаходиться ферзь, або null якщо не встановлено. */
  playerRow: number|null;
  /** Поточна колонка, де знаходиться ферзь, або null якщо не встановлено. */
  playerCol: number|null;
  /** Масив доступних ходів для поточного стану. */
  availableMoves: Move[];
  /** Масив гравців (людина, комп'ютер, онлайн). */
  players: Player[];
  /** Індекс поточного гравця у масиві players. */
  currentPlayerIndex: number;
  /** Чи завершена гра. */
  isGameOver: boolean;
  /** Поточний рахунок. */
  score: number;
  /** Поточні штрафні очки. */
  penaltyPoints: number;
  /** Кількість ходів у block mode. */
  movesInBlockMode: number;
  /** Кількість перестрибнутих заблокованих клітин. */
  jumpedBlockedCells: number;
  /** Чи гру завершено кнопкою "Завершити". */
  finishedByFinishButton: boolean;
  /** Лічильник відвідувань кожної клітини (для block mode). */
  cellVisitCounts: CellVisitCounts;
  /** Історія ходів (для повторів, анімацій, undo). */
  moveHistory: MoveHistoryEntry[];
  /** Черга ходів для анімації. */
  moveQueue: Array<{player: number, direction: string, distance: number}>;
  /** Ключ причини завершення гри (для модалок). */
  gameOverReasonKey: string | null;
  /** Додаткові значення для причини завершення гри. */
  gameOverReasonValues: Record<string, any> | null;
  /** Базовий рахунок (для фінального підрахунку). */
  baseScore?: number;
  /** Бонус за розмір дошки. */
  sizeBonus?: number;
  /** Бонус за block mode. */
  blockModeBonus?: number;
  /** Бонус за перестрибування заблокованих клітин. */
  jumpBonus?: number;
  /** Бонус за завершення гри. */
  finishBonus?: number;
  /** Бонус за "немає ходів". */
  noMovesBonus?: number;
  /** Загальна сума штрафів. */
  totalPenalty?: number;
  /** Фінальний рахунок. */
  totalScore?: number;
  /** Кількість заявок "немає ходів". */
  noMovesClaimsCount: number;
  /** Чи заявлено "немає ходів" і гра в паузі. */
  noMovesClaimed: boolean;
  /** Чи це перший хід у грі. */
  isFirstMove: boolean;
  /** Чи гра була продовжена після паузи. */
  wasResumed: boolean;
}

export function createInitialState(size = initialBoardSize): GameState {
  const { row: initialRow, col: initialCol } = getRandomCell(size);
  const board = createEmptyBoard(size);
  board[initialRow][initialCol] = 1;
  return {
    gameId: Date.now(),
    boardSize: size,
    board,
    playerRow: initialRow,
    playerCol: initialCol,
    availableMoves: getAvailableMoves(initialRow, initialCol, size, {}, 0, board, false),
    players: [
      { id: 1, type: 'human', name: 'Гравець' },
      { id: 2, type: 'ai', name: 'Комп\'ютер' }
    ],
    currentPlayerIndex: 0,
    isGameOver: false,
    score: 0,
    penaltyPoints: 0,
    movesInBlockMode: 0,
    jumpedBlockedCells: 0,
    finishedByFinishButton: false,
    cellVisitCounts: {},
    moveHistory: [{ pos: { row: initialRow, col: initialCol }, blocked: [], visits: {}, blockModeEnabled: false }],
    gameOverReasonKey: null,
    gameOverReasonValues: null,
    moveQueue: [],
    noMovesClaimsCount: 0,
    noMovesClaimed: false,
    noMovesBonus: 0,
    isFirstMove: true,
    wasResumed: false,
  };
}

export const gameState = writable<GameState>(createInitialState()); 