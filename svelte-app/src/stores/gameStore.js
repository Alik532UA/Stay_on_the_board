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
  const directions = [
    [-1, 0],  // вгору
    [1, 0],   // вниз
    [0, -1],  // вліво
    [0, 1],   // вправо
    [-1, -1], // вгору-вліво
    [-1, 1],  // вгору-вправо
    [1, -1],  // вниз-вліво
    [1, 1],   // вниз-вправо
  ];
  /**
   * @param {number} r
   * @param {number} c
   */
  const isBlocked = (r, c) => blockedCells.some(cell => cell.row === r && cell.col === c);

  for (const [dr, dc] of directions) {
    for (let dist = 1; dist < size; dist++) {
      const nr = row + dr * dist;
      const nc = col + dc * dist;
      if (nr < 0 || nc < 0 || nr >= size || nc >= size) break;
      if (isBlocked(nr, nc)) break;
      moves.push({ row: nr, col: nc });
    }
  }
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
 * @property {{ showMoves: boolean, showBoard: boolean, speechEnabled: boolean, language: string, theme: string, style: string }} settings
 * @property {number[][]} board
 * @property {number} playerRow
 * @property {number} playerCol
 * @property {{row: number, col: number}[]} blockedCells
 * @property {{row: number, col: number}[]} availableMoves
 * @property {boolean} blockModeEnabled
 * @property {string|null} selectedDirection
 * @property {number|null} selectedDistance
 * @property {number[]} availableDistances
 * @property {number} currentPlayer
 */

/**
 * @typedef {'up'|'down'|'left'|'right'|'up-left'|'up-right'|'down-left'|'down-right'} Direction
 */

/** @type {Record<Direction, [number, number]>} */
const dirMap = {
  'up': [-1, 0],
  'down': [1, 0],
  'left': [0, -1],
  'right': [0, 1],
  'up-left': [-1, -1],
  'up-right': [-1, 1],
  'down-left': [1, -1],
  'down-right': [1, 1]
};

// Додаю підтримку string чисел ('1'-'9') для ai.js
const numToDir = {
  '1': 'down-left',
  '2': 'down',
  '3': 'down-right',
  '4': 'left',
  '6': 'right',
  '7': 'up-left',
  '8': 'up',
  '9': 'up-right'
};

const isBrowser = typeof window !== 'undefined' && typeof localStorage !== 'undefined';
const lang = isBrowser ? localStorage.getItem('lang') : null;
const theme = isBrowser ? localStorage.getItem('theme') : null;
const style = isBrowser ? localStorage.getItem('style') : null;

/** @type {import('svelte/store').Writable<AppState>} */
// Випадкова стартова позиція ферзя
const initialBoardSize = 3;
const { row: initialRow, col: initialCol } = getRandomCell(initialBoardSize);
console.log('[appState] Стартова позиція ферзя:', { initialRow, initialCol });
export const appState = writable({
  currentView: 'mainMenu',
  boardSize: initialBoardSize,
  gameMode: 'vsComputer',
  language: lang || 'uk',
  theme: theme || 'dark',
  style: style || 'classic',
  settings: {
    showMoves: true,
    showBoard: true,
    speechEnabled: false,
    language: lang || 'uk',
    theme: theme || 'dark',
    style: style || 'classic',
  },
  board: (() => {
    const b = createEmptyBoard(initialBoardSize);
    b[initialRow][initialCol] = 1;
    return b;
  })(),
  playerRow: initialRow,
  playerCol: initialCol,
  blockedCells: [],
  availableMoves: getAvailableMoves(initialRow, initialCol, initialBoardSize, []),
  blockModeEnabled: false,
  selectedDirection: null,
  selectedDistance: null,
  availableDistances: [1,2],
  currentPlayer: 1, // 1 — гравець, 2 — комп'ютер
  lastMove: null,
  computerLastMoveDisplay: null, // { direction, distance }
  distanceManuallySelected: false,
});

/**
 * @param {Partial<AppState>} newSettings
 */
export function updateSettings(newSettings) {
  appState.update(state => ({
    ...state,
    settings: { ...state.settings, ...newSettings }
  }));
}

/**
 * @param {string} mode
 */
export function setGameMode(mode) {
  console.log('[setGameMode] Setting game mode:', mode);
  appState.update(state => ({ ...state, gameMode: mode }));
}

/**
 * @param {number} newSize
 */
export function setBoardSize(newSize) {
  console.log('[setBoardSize] Function called with size:', newSize);
  
  const { row, col } = getRandomCell(newSize);
  appState.update(state => {
    const board = createEmptyBoard(newSize);
    board[row][col] = 1;
    
    console.log('[setBoardSize] Setting up new game', {
      boardSize: newSize,
      playerRow: row,
      playerCol: col,
      gameMode: state.gameMode
    });
    
    return {
      ...state,
      boardSize: newSize,
      board,
      playerRow: row,
      playerCol: col,
      blockedCells: [],
      availableMoves: getAvailableMoves(row, col, newSize, []),
      blockModeEnabled: state.blockModeEnabled,
      distanceManuallySelected: false,
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
      const newAvailableMoves = [...getAvailableMoves(newRow, newCol, boardSize, blockedCells)];
      // Визначаємо напрямок і відстань
      const dr = newRow - playerRow;
      const dc = newCol - playerCol;
      let direction = null;
      if (dr < 0 && dc < 0) direction = 'up-left';
      else if (dr < 0 && dc === 0) direction = 'up';
      else if (dr < 0 && dc > 0) direction = 'up-right';
      else if (dr === 0 && dc < 0) direction = 'left';
      else if (dr === 0 && dc > 0) direction = 'right';
      else if (dr > 0 && dc < 0) direction = 'down-left';
      else if (dr > 0 && dc === 0) direction = 'down';
      else if (dr > 0 && dc > 0) direction = 'down-right';
      const distance = Math.max(Math.abs(dr), Math.abs(dc));
      return {
        ...state,
        board: newBoard,
        playerRow: newRow,
        playerCol: newCol,
        availableMoves: newAvailableMoves,
        currentPlayer: 2,
        lastMove: direction && distance ? { direction, distance } : state.lastMove
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
  console.log('[makeComputerMove] Function called');
  
  // Перевіряємо, чи ми в браузері
  if (typeof window === 'undefined') {
    console.log('[makeComputerMove] Not in browser environment, skipping computer move');
    return;
  }
  
  // Використовуємо requestAnimationFrame замість setTimeout для кращої інтеграції з браузером
  const executeMove = () => {
    const current = get(appState);
    console.log('[makeComputerMove] Current state:', {
      playerRow: current.playerRow,
      playerCol: current.playerCol,
      boardSize: current.boardSize,
      blockedCells: current.blockedCells
    });
    
    const move = getRandomComputerMove(current.board, current.blockedCells, current.boardSize);
    
    if (move) {
      console.log('[makeComputerMove] Computer move selected:', move);
      console.log('[makeComputerMove] Перед оновленням: move', move, 'playerRow:', current.playerRow, 'playerCol:', current.playerCol, 'blockedCells:', current.blockedCells);
      appState.update(state => {
        const newBoard = state.board.map(row => row.slice());
        newBoard[state.playerRow][state.playerCol] = 0;
        newBoard[move.row][move.col] = 1;
        const newAvailableMoves = [...getAvailableMoves(move.row, move.col, state.boardSize, state.blockedCells)];
        console.log('[makeComputerMove] Після getAvailableMoves:', newAvailableMoves);
        console.log('[makeComputerMove] Оновлені доступні ходи після ходу компʼютера:', newAvailableMoves);
        // Додаю мапінг числового напрямку на рядковий
        let direction = move.direction;
        if ((typeof direction === 'number' || typeof direction === 'string') && numToDir[direction]) {
          direction = numToDir[direction];
        }
        const newState = {
          ...state,
          board: newBoard,
          playerRow: move.row,
          playerCol: move.col,
          availableMoves: newAvailableMoves,
          currentPlayer: 1, // після ходу комп'ютера — хід гравця
          lastMove: null, // Скидаємо останній хід після ходу комп'ютера
          computerLastMoveDisplay: { direction, distance: move.distance } // Додаємо для UI
        };
        // Якщо увімкнено режим блокування, блокуємо клітинку
        if (state.blockModeEnabled) {
          console.log('[makeComputerMove] Blocking cell after computer move');
          const newBlockedCells = [...state.blockedCells, { row: move.row, col: move.col }];
          newState.blockedCells = newBlockedCells;
          newState.availableMoves = [...getAvailableMoves(move.row, move.col, state.boardSize, newBlockedCells)];
          console.log('[makeComputerMove] Оновлені доступні ходи після блокування:', newState.availableMoves);
        }
        return newState;
      });
    } else {
      console.log('[makeComputerMove] No valid moves available for computer');
    }
  };
  
  // Затримка 600мс перед виконанням ходу
  setTimeout(() => {
    requestAnimationFrame(executeMove);
  }, 600);
}

export function toggleShowMoves() {
  appState.update(state => ({
    ...state,
    settings: { ...state.settings, showMoves: !state.settings.showMoves }
  }));
}
export function toggleShowBoard() {
  appState.update(state => ({
    ...state,
    settings: { ...state.settings, showBoard: !(state.settings.showBoard ?? true) }
  }));
}
export function toggleSpeech() {
  appState.update(state => ({
    ...state,
    settings: { ...state.settings, speechEnabled: !(state.settings.speechEnabled ?? false) }
  }));
}
/**
 * @param {string} dir
 */
export function setDirection(dir) {
  appState.update(state => {
    let newDistance = state.selectedDistance;
    let newDirection = dir;
    let manually = state.distanceManuallySelected;
    const maxDist = state.boardSize - 1;
    // Якщо напрямок змінюється і відстань не була вибрана вручну — скидаємо до 1
    if (state.selectedDirection !== dir) {
      if (!state.distanceManuallySelected) {
        newDistance = 1;
      }
      manually = state.distanceManuallySelected; // не скидаємо вручну вибрану
    } else {
      // Якщо натискаємо той самий напрямок
      if (!state.distanceManuallySelected) {
        if (!state.selectedDistance) {
          newDistance = 1;
        } else if (state.selectedDistance < maxDist) {
          newDistance = state.selectedDistance + 1;
        } else {
          newDistance = 1;
        }
      }
    }
    return {
      ...state,
      selectedDirection: newDirection,
      selectedDistance: newDistance,
      distanceManuallySelected: manually,
      computerLastMoveDisplay: null
    };
  });
}
/**
 * @param {number} dist
 */
export function setDistance(dist) {
  appState.update(state => ({
    ...state,
    selectedDistance: dist,
    distanceManuallySelected: true,
    computerLastMoveDisplay: null
  }));
}
export function confirmMove() {
  // Перевіряємо, чи ми в браузері
  if (typeof window === 'undefined') {
    console.log('[confirmMove] Not in browser environment, skipping move');
    return;
  }
  
  const state = get(appState);
  
  // Додаємо логування для відстеження проблеми
  console.log('[confirmMove] Function called', {
    selectedDirection: state.selectedDirection,
    selectedDistance: state.selectedDistance,
    playerRow: state.playerRow,
    playerCol: state.playerCol,
    boardSize: state.boardSize
  });
  
  if (!state.selectedDirection || !state.selectedDistance) {
    console.log('[confirmMove] Missing direction or distance, returning early');
    return;
  }

  // Обчислення нових координат (8 напрямків)
  /** @type {Direction|null} */
  let dir = null;
  if (
    typeof state.selectedDirection === 'string' &&
    Object.prototype.hasOwnProperty.call(dirMap, state.selectedDirection)
  ) {
    dir = /** @type {Direction} */ (state.selectedDirection);
  }
  
  if (!dir) {
    console.log('[confirmMove] Invalid direction:', state.selectedDirection);
    return;
  }
  
  const [dr, dc] = dirMap[dir];
  const newRow = state.playerRow + dr * state.selectedDistance;
  const newCol = state.playerCol + dc * state.selectedDistance;

  console.log('[confirmMove] Calculated new position', {
    direction: dir,
    directionVector: [dr, dc],
    distance: state.selectedDistance,
    newRow,
    newCol,
    boardSize: state.boardSize
  });

  // Перевірка меж дошки
  if (
    newRow >= 0 && newRow < state.boardSize &&
    newCol >= 0 && newCol < state.boardSize
  ) {
    console.log('[confirmMove] Position is within board bounds, executing move');
    
    // Перевірка, чи клітинка не заблокована
    const isBlocked = state.blockedCells.some(cell => cell.row === newRow && cell.col === newCol);
    if (isBlocked) {
      console.log('[confirmMove] Target cell is blocked, move cancelled');
      return;
    }
    
    // Виконуємо хід напряму, без використання movePlayer
    appState.update(s => {
      const newBoard = s.board.map(row => row.slice());
      newBoard[s.playerRow][s.playerCol] = 0;
      newBoard[newRow][newCol] = 1;
      let newBlockedCells = s.blockedCells;
      if (s.blockModeEnabled) {
        // Додаємо попередню позицію, якщо її ще немає у blockedCells
        const wasBlocked = s.blockedCells.some(cell => cell.row === s.playerRow && cell.col === s.playerCol);
        if (!wasBlocked) {
          newBlockedCells = [...s.blockedCells, { row: s.playerRow, col: s.playerCol }];
        }
      }
      const newAvailableMoves = [...getAvailableMoves(newRow, newCol, s.boardSize, newBlockedCells)];
      console.log('[confirmMove] Оновлені доступні ходи:', newAvailableMoves);
      return {
        ...s,
        board: newBoard,
        playerRow: newRow,
        playerCol: newCol,
        blockedCells: newBlockedCells,
        selectedDirection: null,
        selectedDistance: null,
        availableMoves: newAvailableMoves,
        currentPlayer: 2, // після ходу гравця — хід комп'ютера
        lastMove: null, // Скидаємо останній хід після підтвердження ходу
        computerLastMoveDisplay: null // Очищаємо показ ходу комп'ютера при підтвердженні
      };
    });
    
    // Якщо гра проти комп'ютера, виконуємо хід комп'ютера
    if (state.gameMode === 'vsComputer') {
      makeComputerMove();
    } else {
      console.log('[confirmMove] Game mode is not vsComputer:', state.gameMode);
    }
  } else {
    console.log('[confirmMove] Position is outside board bounds, move cancelled');
  }
}
export function noMoves() {
  // Тут має бути логіка для ситуації "немає куди ходити"
  console.log('Гравець повідомив: немає куди ходити');
} 

/**
 * Відображає хід комп'ютера в UI (для центральної кнопки)
 */
export function showComputerMove(direction, distance) {
  appState.update(state => ({
    ...state,
    computerLastMoveDisplay: { direction, distance }
  }));
}

/**
 * Очищає показ ходу комп'ютера
 */
export function clearComputerMove() {
  appState.update(state => ({
    ...state,
    computerLastMoveDisplay: null
  }));
} 