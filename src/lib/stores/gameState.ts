// file: src/lib/stores/gameState.ts
import { writable } from 'svelte/store';
import { createEmptyBoard, getRandomCell, getAvailableMoves } from '$lib/utils/boardUtils.ts';
import type { Direction, Move } from '$lib/utils/gameUtils';
import { logService } from '../services/logService.js';
import { get } from 'svelte/store';
import { testModeStore } from './testModeStore';

const initialBoardSize = 4;

export interface Player {
  id: number;
  type: any;
  name: string;
  score: number;
  color: string;
  isComputer: boolean;
  penaltyPoints: number;
  bonusPoints: number;
  bonusHistory: any[];
}

export interface MoveHistoryEntry { pos: {row: number, col: number}, blocked: {row: number, col: number}[], visits?: any, blockModeEnabled?: boolean }
export interface GameState {
  gameId: number;
  boardSize: number;
  board: number[][];
  playerRow: number|null;
  playerCol: number|null;
  availableMoves: Move[];
  players: Player[];
  currentPlayerIndex: number;
  isGameOver: boolean;
  penaltyPoints: number;
  movesInBlockMode: number;
  jumpedBlockedCells: number;
  finishedByFinishButton: boolean;
  cellVisitCounts: any;
  moveHistory: MoveHistoryEntry[];
  moveQueue: Array<{player: number, direction: string, distance: number}>;
  gameOverReasonKey: string | null;
  gameOverReasonValues: Record<string, any> | null;
  baseScore?: number;
  sizeBonus?: number;
  blockModeBonus?: number;
  jumpBonus?: number;
  finishBonus?: number;
  noMovesBonus?: number;
  distanceBonus?: number;
  totalPenalty?: number;
  totalScore?: number;
  noMovesClaimsCount: number;
  noMovesClaimed: boolean;
  isFirstMove: boolean;
  wasResumed: boolean;
  settings: any;
  scoresAtRoundStart: number[];
  isComputerMoveInProgress: boolean;
}

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

export function createInitialState(config: any = {}): GameState {
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
    scoresAtRoundStart: players.map((p: any) => p.score),
    isComputerMoveInProgress: false,
  };
}

function createGameStateStore() {
  const { subscribe, update, set } = writable<GameState | null>(null);

  return {
    subscribe,
    set,
    update,

    addPlayer: () => {
      update(state => {
        if (!state || state.players.length >= 8) return state;
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
        if (!state || state.players.length <= 2) return state;
        return { ...state, players: state.players.filter(p => p.id !== playerId) };
      });
    },

    updatePlayer: (playerId: number, updatedData: Partial<Player>) => {
      update(state => {
        if (!state) return null;
        return {
          ...state,
          players: state.players.map(p =>
            p.id === playerId ? { ...p, ...updatedData } : p
          )
        };
      });
    },

    updateSettings: (newSettings: Partial<any>) => {
      update(state => {
        if (!state) return null;
        return {
          ...state,
          settings: { ...state.settings, ...newSettings }
        }
      });
    },

    snapshotScores: () => {
      update(state => {
        if (!state) return null;
        const scores = state.players.map(p => p.bonusPoints - p.penaltyPoints);
        return { ...state, scoresAtRoundStart: scores };
      });
    },
    
    resetScores: () => {
      update(state => {
        if (!state) return null;
        return {
          ...state,
          players: state.players.map(p => ({ ...p, score: 0, penaltyPoints: 0, bonusPoints: 0, bonusHistory: [] as any[] }))
        }
      });
    },

    addPlayerPenaltyPoints: (playerId: number, penaltyPointsToAdd: number) => {
      update(state => {
        if (!state) return null;
        return {
          ...state,
          players: state.players.map(p =>
            p.id === playerId ? { ...p, penaltyPoints: p.penaltyPoints + penaltyPointsToAdd } : p
          )
        }
      });
    },
    
    addPlayerBonusPoints: (playerId: number, bonusPointsToAdd: number, reason: string = '') => {
      update(state => {
        if (!state) return null;
        return {
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
        }
      });
    },

    addPlayerBonus: (playerId: number, bonusPointsToAdd: number, reason: string = '') => {
      update(state => {
        if (!state) return null;
        return {
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
        }
      });
    },

    addPlayerPenalty: (playerId: number, penaltyPointsToAdd: number) => {
      update(state => {
        if (!state) return null;
        return {
          ...state,
          players: state.players.map(p =>
            p.id === playerId ? { ...p, penaltyPoints: p.penaltyPoints + penaltyPointsToAdd } : p
          )
        }
      });
    },

    reset: (config?: any) => {
      set(createInitialState(config));
    },

    resetBlockModeState: () => {
      update(state => {
        if (!state) return null;
        logService.state('Скидання стану Block Mode');
        const resetHistoryEntry = {
          pos: { row: state.playerRow, col: state.playerCol },
          blocked: [] as {row: number, col: number}[],
          visits: {},
          blockModeEnabled: true
        };
        return {
          ...state,
          cellVisitCounts: {},
          movesInBlockMode: 0,
          moveHistory: [...state.moveHistory, resetHistoryEntry]
        };
      });
    },

    destroy: () => {
      set(null);
    }
  };
}

export const gameState = createGameStateStore();