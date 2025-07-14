import { writable } from 'svelte/store';
import { getRandomComputerMove } from '../lib/ai.js';
import { get } from 'svelte/store';

/**
 * @param {number} size
 */
function createEmptyBoard(size) {
  return Array.from({ length: size }, () => Array(size).fill(0));
}

/**
 * @param {number} size
 */
function getRandomCell(size) {
  return {
    row: Math.floor(Math.random() * size),
    col: Math.floor(Math.random() * size)
  };
}

/**
 * @param {number} row
 * @param {number} col
 * @param {number} size
 * @param {{row:number,col:number}[]} blockedCells
 */
function getAvailableMoves(row, col, size, blockedCells = []) {
  const moves = [];
  /**
   * @param {number} r
   * @param {number} c
   */
  const isBlocked = (r, c) => blockedCells.some(cell => cell.row === r && cell.col === c);
  if (row > 0 && !isBlocked(row - 1, col)) moves.push({ row: row - 1, col });
  if (row < size - 1 && !isBlocked(row + 1, col)) moves.push({ row: row + 1, col });
  if (col > 0 && !isBlocked(row, col - 1)) moves.push({ row, col: col - 1 });
  if (col < size - 1 && !isBlocked(row, col + 1)) moves.push({ row, col: col + 1 });
  return moves;
}

/**
 * @typedef {Object} ModalButton
 * @property {string} text
 * @property {boolean} [primary]
 * @property {() => void} [onClick]
 */
/**
 * @typedef {Object} ModalState
 * @property {boolean} isOpen
 * @property {string} title
 * @property {string} content
 * @property {ModalButton[]} buttons
 */
/**
 * @typedef {Object} AppState
 * @property {string} currentView
 * @property {number} boardSize
 * @property {string} gameMode
 * @property {string} language
 * @property {string} theme
 * @property {string} style
 * @property {{ showMoves: boolean, language: string, theme: string, style: string }} settings
 * @property {number[][]} board
 * @property {number} playerRow
 * @property {number} playerCol
 * @property {{row: number, col: number}[]} blockedCells
 * @property {{row: number, col: number}[]} availableMoves
 * @property {boolean} blockModeEnabled
 */

/** @type {import('svelte/store').Writable<AppState>} */
export const appState = writable({
  currentView: 'mainMenu',
  boardSize: 3,
  gameMode: 'vsComputer',
  language: localStorage.getItem('lang') || 'uk',
  theme: localStorage.getItem('theme') || 'dark',
  style: localStorage.getItem('style') || 'classic',
  settings: {
    showMoves: true,
    language: localStorage.getItem('lang') || 'uk',
    theme: localStorage.getItem('theme') || 'dark',
    style: localStorage.getItem('style') || 'classic',
  },
  board: createEmptyBoard(3),
  playerRow: 1,
  playerCol: 1,
  blockedCells: [],
  availableMoves: getAvailableMoves(1, 1, 3, []),
  blockModeEnabled: false
});

/**
 * @param {Partial<typeof appState>} newSettings
 */
export function updateSettings(newSettings) {
  appState.update(state => ({
    ...state,
    settings: { ...state.settings, ...newSettings }
  }));
}

/**
 * @param {number} newSize
 */
export function setBoardSize(newSize) {
  const { row, col } = getRandomCell(newSize);
  appState.update(state => {
    const board = createEmptyBoard(newSize);
    board[row][col] = 1;
    return {
      ...state,
      boardSize: newSize,
      board,
      playerRow: row,
      playerCol: col,
      blockedCells: [],
      availableMoves: getAvailableMoves(row, col, newSize, []),
      blockModeEnabled: state.blockModeEnabled,
    };
  });
}

/**
 * @param {number} newRow
 * @param {number} newCol
 */
export function movePlayer(newRow, newCol) {
  appState.update(state => {
    const { board, boardSize, playerRow, playerCol, blockedCells } = state;
    const isAvailable = getAvailableMoves(playerRow, playerCol, boardSize, blockedCells)
      .some(move => move.row === newRow && move.col === newCol);
    if (isAvailable) {
      const newBoard = board.map(row => row.slice());
      newBoard[playerRow][playerCol] = 0;
      newBoard[newRow][newCol] = 1;
      return {
        ...state,
        board: newBoard,
        playerRow: newRow,
        playerCol: newCol,
        availableMoves: getAvailableMoves(newRow, newCol, boardSize, blockedCells)
      };
    }
    return state;
  });
}

/**
 * @param {number} row
 * @param {number} col
 */
export function toggleBlockCell(row, col) {
  appState.update(state => {
    const blocked = state.blockedCells.some(cell => cell.row === row && cell.col === col);
    let newBlockedCells;
    if (blocked) {
      newBlockedCells = state.blockedCells.filter(cell => !(cell.row === row && cell.col === col));
    } else {
      newBlockedCells = [...state.blockedCells, { row, col }];
    }
    return {
      ...state,
      blockedCells: newBlockedCells,
      availableMoves: getAvailableMoves(state.playerRow, state.playerCol, state.boardSize, newBlockedCells)
    };
  });
}

export function toggleBlockMode() {
  appState.update(state => ({ ...state, blockModeEnabled: !state.blockModeEnabled }));
}

export function resetGame() {
  appState.update(state => {
    const { boardSize } = state;
    const { row, col } = getRandomCell(boardSize);
    const board = createEmptyBoard(boardSize);
    board[row][col] = 1;
    return {
      ...state,
      board,
      playerRow: row,
      playerCol: col,
      blockedCells: [],
      availableMoves: getAvailableMoves(row, col, boardSize, []),
    };
  });
}

/**
 * Виконує хід комп'ютера у режимі vsComputer
 */
export function makeComputerMove() {
  setTimeout(() => {
    const current = get(appState);
    const move = getRandomComputerMove(current.board, current.blockedCells, current.boardSize);
    if (move) {
      movePlayer(move.row, move.col);
      if (current.blockModeEnabled) {
        toggleBlockCell(move.row, move.col);
      }
    }
  }, 600);
} 