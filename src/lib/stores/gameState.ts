/**
 * @file Manages the core, persistent state of the game board and logic.
 * This is the single source of truth for the game's current situation.
 */
import { writable } from 'svelte/store';
import { createEmptyBoard, getRandomCell, getAvailableMoves } from '$lib/utils/boardUtils.ts';

// Імпортуємо типи з gameLogicService
import type { Direction, Move } from '$lib/utils/gameUtils';
import { logService } from '../services/logService.js';

const initialBoardSize = 4;

export type PlayerType = 'human' | 'ai' | 'remote' | 'computer';

export interface BonusEntry {
  points: number;
  reason: string;
  timestamp: number;
}

export interface Player {
  id: number;
  type: PlayerType;
  name: string;
  score: number;
  color: string;
  isComputer: boolean;
  penaltyPoints: number;
  bonusPoints: number;
  bonusHistory: BonusEntry[];
}

export interface GameSettings {
  boardSize: number;
  blockModeEnabled: boolean;
  autoHideBoard: boolean;
  lockSettings: boolean;
}

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
  /** @deprecated Масив доступних ходів тепер є derived store в derivedState.ts */
  availableMoves: Move[];
  /** Масив гравців (людина, комп'ютер, онлайн). */
  players: Player[];
  /** Індекс поточного гравця у масиві players. */
  currentPlayerIndex: number;
  /** Чи завершена гра. */
  isGameOver: boolean;
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
  /** Бонус за відстань (ходи на відстань більше 1). */
  distanceBonus?: number;
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
  /** Налаштування гри, раніше в localGameStore */
  settings: GameSettings;
  /** Рахунки на початок раунду для локальної гри */
  scoresAtRoundStart: number[];
}

export interface GameStateConfig {
  size?: number;
  players?: Player[];
  testMode?: boolean;
}

import { get } from 'svelte/store';
import { testModeStore } from './testModeStore';

// --- Player and Color Helpers (from localGameStore) ---
const generateId = () => Date.now() + Math.random();

const availableColors = [
  '#e63946', '#457b9d', '#2a9d8f', '#f4a261',
  '#e76f51', '#9b5de5', '#f15bb5', '#00bbf9'
];

const getRandomColor = () => availableColors[Math.floor(Math.random() * availableColors.length)];

const getRandomUnusedColor = (usedColors: string[]) => {
  const unused = availableColors.filter(c => !usedColors.includes(c));
  if (unused.length === 0) return getRandomColor();
  return unused[Math.floor(Math.random() * unused.length)];
};

const availableNames = ['Alik', 'Noah', 'Jack', 'Mateo', 'Lucas', 'Sofia', 'Olivia', 'Nora', 'Lucia', 'Emilia'];

const getRandomUnusedName = (usedNames: string[]) => {
  const unused = availableNames.filter(name => !usedNames.includes(name));
  if (unused.length === 0) return `Player ${usedNames.length + 1}`;
  return unused[Math.floor(Math.random() * unused.length)];
};


export function createInitialState(config: GameStateConfig = {}): GameState {
  const size = config.size ?? initialBoardSize;
  const players = config.players ?? [
    { id: 1, type: 'human', name: 'Гравець', score: 0, color: '#e63946', isComputer: false, penaltyPoints: 0, bonusPoints: 0, bonusHistory: [] },
    { id: 2, type: 'ai', name: 'Комп\'ютер', score: 0, color: '#457b9d', isComputer: true, penaltyPoints: 0, bonusPoints: 0, bonusHistory: [] }
  ];
  
  const testModeActive = config.testMode ?? false;
  const testModeState = get(testModeStore);
  const { row: initialRow, col: initialCol } =
    testModeActive && testModeState.startPositionMode === 'manual' && testModeState.manualStartPosition
    ? { row: testModeState.manualStartPosition.y, col: testModeState.manualStartPosition.x }
    : testModeActive && testModeState.startPositionMode === 'predictable'
    ? { row: 0, col: 0 }
    : getRandomCell(size);
  const board = createEmptyBoard(size);
  board[initialRow][initialCol] = 1;
  
  return {
    gameId: Date.now(),
    boardSize: size,
    board,
    playerRow: initialRow,
    playerCol: initialCol,
    availableMoves: [],
    players,
    currentPlayerIndex: 0,
    isGameOver: false,
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
    distanceBonus: 0,
    isFirstMove: true,
    wasResumed: false,
    settings: {
      boardSize: 4,
      blockModeEnabled: false,
      autoHideBoard: false,
      lockSettings: false
    },
    scoresAtRoundStart: players.map(p => p.score),
  };
}

function createGameStateStore() {
  const { subscribe, update, set } = writable<GameState>(createInitialState());

  return {
    subscribe,
    set,
    update,

    // --- Player Management ---
    addPlayer: () => {
      update(state => {
        if (state.players.length >= 8) return state;
        const usedColors = state.players.map(p => p.color);
        const usedNames = state.players.map(p => p.name);
        const newPlayer: Player = {
          id: generateId(),
          name: getRandomUnusedName(usedNames),
          color: getRandomUnusedColor(usedColors),
          score: 0,
          isComputer: false,
          type: 'human',
          penaltyPoints: 0,
          bonusPoints: 0,
          bonusHistory: []
        };
        return { ...state, players: [...state.players, newPlayer] };
      });
    },

    removePlayer: (playerId: number) => {
      update(state => {
        if (state.players.length <= 2) return state;
        return { ...state, players: state.players.filter(p => p.id !== playerId) };
      });
    },

    updatePlayer: (playerId: number, updatedData: Partial<Player>) => {
      update(state => {
        return {
          ...state,
          players: state.players.map(p =>
            p.id === playerId ? { ...p, ...updatedData } : p
          )
        };
      });
    },

    // --- Settings Management ---
    updateSettings: (newSettings: Partial<GameSettings>) => {
      update(state => ({
        ...state,
        settings: { ...state.settings, ...newSettings }
      }));
    },

    // --- Score Management ---
    snapshotScores: () => {
      update(state => {
        const scores = state.players.map(p => p.bonusPoints - p.penaltyPoints);
        return { ...state, scoresAtRoundStart: scores };
      });
    },
    
    resetScores: () => {
      update(state => ({
        ...state,
        players: state.players.map(p => ({ ...p, score: 0, penaltyPoints: 0, bonusPoints: 0, bonusHistory: [] as BonusEntry[] }))
      }));
    },

    addPlayerPenaltyPoints: (playerId: number, penaltyPointsToAdd: number) => {
      update(state => ({
        ...state,
        players: state.players.map(p =>
          p.id === playerId ? { ...p, penaltyPoints: p.penaltyPoints + penaltyPointsToAdd } : p
        )
      }));
    },
    
    addPlayerBonusPoints: (playerId: number, bonusPointsToAdd: number, reason: string = '') => {
      update(state => ({
        ...state,
        players: state.players.map(p =>
          p.id === playerId ? {
            ...p,
            bonusPoints: p.bonusPoints + bonusPointsToAdd,
            bonusHistory: [...p.bonusHistory, {
              points: bonusPointsToAdd,
              reason: reason,
              timestamp: Date.now()
            }]
          } : p
        )
      }));
    },

    addPlayerBonus: (playerId: number, bonusPointsToAdd: number, reason: string = '') => {
      update(state => ({
        ...state,
        players: state.players.map(p =>
          p.id === playerId ? {
            ...p,
            bonusPoints: p.bonusPoints + bonusPointsToAdd,
            bonusHistory: [...p.bonusHistory, {
              points: bonusPointsToAdd,
              reason: reason,
              timestamp: Date.now()
            }]
          } : p
        )
      }));
    },

    addPlayerPenalty: (playerId: number, penaltyPointsToAdd: number) => {
      update(state => ({
        ...state,
        players: state.players.map(p =>
          p.id === playerId ? { ...p, penaltyPoints: p.penaltyPoints + penaltyPointsToAdd } : p
        )
      }));
    },

    // --- General ---
    reset: (config?: GameStateConfig) => {
      set(createInitialState(config));
    }
  };
}

export const gameState = createGameStateStore();