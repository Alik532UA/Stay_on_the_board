import { writable, derived } from 'svelte/store';
import { getRandomComputerMove } from '$lib/ai.js';
import { get } from 'svelte/store';
import { modalStore } from './modalStore.js';
import { closeModal } from './modalStore.js';
import { _ as t } from 'svelte-i18n';
import { speakText, langMap } from '$lib/speech.js';
import { settingsStore, toggleShowBoard } from './settingsStore.js';
import { navigateToMainMenu } from '$lib/utils/navigation.js';
/**
 * @typedef {{ [key: string]: string; uk: string; en: string; crh: string; nl: string; }} LangMapType
 */
/** @type {LangMapType} */
// @ts-ignore
langMap;

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
 * @param {{ [key: string]: number }} cellVisitCounts
 * @param {number} blockOnVisitCount
 */
function getAvailableMoves(row, col, size, cellVisitCounts = {}, blockOnVisitCount = 0) {
  if (row === null || col === null) return [];
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
  /** @type {{ [key: string]: number }} */
  const visitMap = cellVisitCounts;
  /**
   * @param {number} r
   * @param {number} c
   */
  const isBlocked = (r, c) => {
    const visitCount = visitMap[`${r}-${c}`] || 0;
    return visitCount > blockOnVisitCount;
  };

  for (const [dr, dc] of directions) {
    for (let dist = 1; dist < size; dist++) {
      const nr = row + dr * dist;
      const nc = col + dc * dist;

      // Перевіряємо, чи не вийшли ми за межі дошки
      if (nr < 0 || nc < 0 || nr >= size || nc >= size) {
        break;
      }

      // КЛЮЧОВЕ ВИПРАВЛЕННЯ: не break при заблокованій клітинці, а просто не додаємо її як хід
      if (!isBlocked(nr, nc)) {
        moves.push({ row: nr, col: nc });
      }
      // цикл продовжується навіть якщо клітинка заблокована
    }
  }
  return moves;
}

/**
 * @typedef {Object} ModalButton
 * @property {string} text
 * @property {boolean} [primary]
 * @property {() => void} [onClick]
 * @property {string} [customClass] // Додаю для стилізації кнопок
 * @property {boolean} [isHot] // Додаю для фокусу
 * @property {string} [hotKey] // <-- ДОДАНО
 */
/**
 * @typedef {Object} ModalState
 * @property {boolean} isOpen
 * @property {string} title
 * @property {string} content
 * @property {ModalButton[]} buttons
 */
/**
 * @typedef {'human' | 'ai' | 'remote'} PlayerType
 */

/**
 * @typedef {Object} Player
 * @property {number} id
 * @property {PlayerType} type
 * @property {string} name
 */
/**
 * @typedef {Object} AppState
 * @property {string} currentView
 * @property {number} boardSize
 * @property {string} gameMode
 * @property {string} language
 * @property {string} theme
 * @property {string} style
 * @property {{ showMoves: boolean, showBoard: boolean, speechEnabled: boolean, language: string, theme: string, style: string, selectedVoiceURI?: string }} settings
 * @property {number[][]} board
 * @property {number|null} playerRow
 * @property {number|null} playerCol
 * @property {{row: number, col: number}[]} blockedCells
 * @property {{row: number, col: number}[]} availableMoves
 * @property {boolean} blockModeEnabled
 * @property {Direction|null|undefined} selectedDirection
 * @property {number|null|undefined} selectedDistance
 * @property {number[]} availableDistances
 * @property {Player[]} players
 * @property {number} currentPlayerIndex
 * @property {{direction: Direction, distance: number}|null} lastMove
 * @property {{direction: Direction, distance: number}|null} computerLastMoveDisplay
 * @property {{direction: Direction, distance: number}|null} lastComputerMove
 * @property {boolean} distanceManuallySelected
 * @property {{row: number, col: number}[]} visitedCells
 * @property {boolean} isGameOver
 * @property {number} score
 * @property {number} movesInBlockMode
 * @property {number} jumpedBlockedCells
 * @property {number} penaltyPoints
 * @property {boolean} finishedByNoMovesButton
 * @property {number} gameId // <-- ДОДАНО
 * @property {{ [key: string]: number }} cellVisitCounts // <-- ДОДАНО
 * @property {{pos: {row: number, col: number}, blocked: {row: number, col: number}[]}[]} moveHistory // Масив для збереження позиції та заблокованих клітинок на кожному кроці
 * @property {boolean} isReplayMode // Прапорець, що вказує на режим перегляду
 * @property {number} replayCurrentStep // Поточний крок у реплеї
 * @property {boolean} isAutoPlaying // Прапорець для автовідтворення
 * @property {boolean} limitReplayPath // Новий прапорець для обмеження шляху реплею
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

/** @type {Record<string, Direction>} */
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

/** @type {Record<Direction, Direction>} */
const oppositeDirections = {
  'up': 'down',
  'down': 'up',
  'left': 'right',
  'right': 'left',
  'up-left': 'down-right',
  'down-right': 'up-left',
  'up-right': 'down-left',
  'down-left': 'up-right'
};

const isBrowser = typeof window !== 'undefined' && typeof localStorage !== 'undefined';
const lang = isBrowser ? localStorage.getItem('lang') : null;
const theme = isBrowser ? localStorage.getItem('theme') : null;
const style = isBrowser ? (localStorage.getItem('style') === 'ubuntu' ? 'purple' :
  localStorage.getItem('style') === 'peak' ? 'green' :
  localStorage.getItem('style') === 'cs2' ? 'blue' :
  localStorage.getItem('style') === 'glass' ? 'gray' :
  localStorage.getItem('style') === 'material' ? 'orange' : localStorage.getItem('style')) : null;

// Випадкова стартова позиція ферзя
const initialBoardSize = 3;
export const appState = writable(/** @type {AppState} */({
  currentView: 'mainMenu',
  boardSize: initialBoardSize,
  gameMode: 'vsComputer',
  language: lang || 'uk',
  theme: theme || 'dark',
  style: style || 'purple',
  settings: {
    showMoves: true,
    showBoard: true,
    speechEnabled: false,
    language: lang || 'uk',
    theme: theme || 'dark',
    style: style || 'purple',
  },
  board: createEmptyBoard(initialBoardSize), // Порожня дошка
  playerRow: null, // Немає гравця
  playerCol: null, // Немає гравця
  blockedCells: /** @type {{row:number,col:number}[]} */ ([]),
  availableMoves: /** @type {{row:number,col:number}[]} */ ([]), // Немає ходів
  blockModeEnabled: false,
  selectedDirection: null,
  selectedDistance: null,
  players: [
    { id: 1, type: 'human', name: 'Гравець' },
    { id: 2, type: 'ai', name: 'Комп\'ютер' }
  ],
  currentPlayerIndex: 0,
  lastMove: null,
  computerLastMoveDisplay: null,
  lastComputerMove: null,
  distanceManuallySelected: false,
  visitedCells: [],
  isGameOver: false,
  score: 0,
  movesInBlockMode: 0,
  jumpedBlockedCells: 0,
  penaltyPoints: 0, // <-- ДОДАНО
  finishedByNoMovesButton: false,
  gameId: 1,
  availableDistances: Array.from({ length: initialBoardSize - 1 }, (_, i) => i + 1), // [1, 2] for size 3
  cellVisitCounts: {}, // <-- ДОДАНО
  moveHistory: [{ pos: { row: 0, col: 0 }, blocked: [] }], // Починаємо історію з першої клітинки
  isReplayMode: false,
  replayCurrentStep: 0,
  isAutoPlaying: false,
  limitReplayPath: true,
}));

/**
 * Похідний стор, який автоматично генерує масив доступних відстаней
 * на основі поточного розміру дошки.
 */
export const availableDistances = derived(
  appState,
  ($appState) => {
    const size = $appState.boardSize;
    if (size <= 1) {
      return [];
    }
    // Створюємо масив чисел від 1 до (size - 1)
    return Array.from({ length: size - 1 }, (_, i) => i + 1);
  }
);

/**
 * Виконує переміщення фігури та повертає оновлені частини стану.
 * Ця функція є єдиним джерелом правди для логіки ходу.
 * @param {AppState} state - Поточний стан гри.
 * @param {number} newRow - Новий рядок для фігури.
 * @param {number} newCol - Новий стовпець для фігури.
 * @returns {Partial<AppState>} Об'єкт з оновленими частинами стану.
 */
function performMove(state, newRow, newCol) {
  if (newRow === null || newCol === null) return state;
  const { board, playerRow, playerCol, boardSize, blockModeEnabled } = state;
  if (playerRow === null || playerCol === null) return {};
  const newBoard = board.map(row => row.slice());
  newBoard[playerRow][playerCol] = 0;
  newBoard[newRow][newCol] = 1;

  let newBlockedCells = [...state.blockedCells];
  if (blockModeEnabled) {
    const prevCell = { row: playerRow, col: playerCol };
    if (!newBlockedCells.some(c => c.row === prevCell.row && c.col === prevCell.col)) {
      newBlockedCells.push(prevCell);
    }
  }

  const newVisitCounts = { ...state.cellVisitCounts };
  if (state.blockModeEnabled && playerRow !== null && playerCol !== null) {
    const cellKey = `${playerRow}-${playerCol}`;
    newVisitCounts[cellKey] = (newVisitCounts[cellKey] || 0) + 1;
  }

  // КЛЮЧОВА ЗМІНА: Ми більше не розраховуємо доступні ходи тут.
  // Це буде зроблено в окремому етапі.

  return {
    board: newBoard,
    playerRow: newRow,
    playerCol: newCol,
    blockedCells: newBlockedCells,
    cellVisitCounts: newVisitCounts,
    moveHistory: [...(state.moveHistory || []), { pos: { row: newRow, col: newCol }, blocked: newBlockedCells }],
    // Рядок availableMoves: newAvailableMoves, видалено.
  };
}

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
export async function setBoardSize(newSize) {
  settingsStore.updateSettings({ showBoard: true }); // <-- ДОДАНО
  appState.update(state => {
    const { row, col } = getRandomCell(newSize);
    const board = createEmptyBoard(newSize);
    board[row][col] = 1;
    const initialAvailableMoves = getAvailableMoves(row, col, newSize, {}, 0);
    return {
      ...state,
      boardSize: newSize,
      board,
      playerRow: row,
      playerCol: col,
      availableMoves: initialAvailableMoves, // Починаємо з порожніми ходами
      blockedCells: [],
      visitedCells: [],
      selectedDirection: null,
      selectedDistance: null,
      players: [
        { id: 1, type: 'human', name: 'Гравець' },
        { id: 2, type: 'ai', name: 'Комп\'ютер' }
      ],
      currentPlayerIndex: 0,
      lastMove: null,
      computerLastMoveDisplay: null,
      lastComputerMove: null,
      score: 0,
      penaltyPoints: 0, // <-- ДОДАНО
      isGameOver: false,
      gameId: (state.gameId || 0) + 1,
      availableDistances: Array.from({ length: newSize - 1 }, (_, i) => i + 1),
      cellVisitCounts: {}, // <-- ДОДАНО
      moveHistory: [{ pos: { row, col }, blocked: [] }], // Починаємо історію з першої клітинки
      isReplayMode: false,
      replayCurrentStep: 0,
      isAutoPlaying: false,
      limitReplayPath: true,
    };
  });
  setTimeout(() => {
    appState.update(state => {
      if (state.playerRow === null || state.playerCol === null) return state;
      const initialAvailableMoves = getAvailableMoves(state.playerRow, state.playerCol, state.boardSize, state.cellVisitCounts, get(settingsStore).blockOnVisitCount);
      return { ...state, availableMoves: initialAvailableMoves };
    });
  }, 300);
}

/**
 * @param {number} newRow
 * @param {number} newCol
 */
export function movePlayer(newRow, newCol) {
  appState.update(state => {
    const { board, boardSize, playerRow, playerCol, blockedCells } = state;
    if (playerRow === null || playerCol === null) return state;
    if (typeof newRow !== 'number' || typeof newCol !== 'number') return state;
    const isAvailable = getAvailableMoves(Number(playerRow), Number(playerCol), boardSize, state.cellVisitCounts, get(settingsStore).blockOnVisitCount)
      .some(move => move.row === Number(newRow) && move.col === Number(newCol));
    if (isAvailable) {
      const newBoard = board.map(row => row.slice());
      newBoard[playerRow][playerCol] = 0;
      newBoard[newRow][newCol] = 1;
      const newAvailableMoves = [...getAvailableMoves(newRow, newCol, boardSize, state.cellVisitCounts, get(settingsStore).blockOnVisitCount)];
      // Визначаємо напрямок і відстань
      const dr = newRow - playerRow;
      const dc = newCol - playerCol;
      let direction = null;
      if (dr < 0 && dc < 0) direction = /** @type {Direction} */('up-left');
      else if (dr < 0 && dc === 0) direction = /** @type {Direction} */('up');
      else if (dr < 0 && dc > 0) direction = /** @type {Direction} */('up-right');
      else if (dr === 0 && dc < 0) direction = /** @type {Direction} */('left');
      else if (dr === 0 && dc > 0) direction = /** @type {Direction} */('right');
      else if (dr > 0 && dc < 0) direction = /** @type {Direction} */('down-left');
      else if (dr > 0 && dc === 0) direction = /** @type {Direction} */('down');
      else if (dr > 0 && dc > 0) direction = /** @type {Direction} */('down-right');
      const distance = Math.max(Math.abs(dr), Math.abs(dc));
      return {
        ...state,
        board: newBoard,
        playerRow: newRow,
        playerCol: newCol,
        availableMoves: newAvailableMoves,
        currentPlayer: 2,
        lastMove: (direction && distance) ? { direction: /** @type {Direction} */(direction), distance } : null,
        blockedCells: state.blockedCells,
        visitedCells: state.visitedCells,
        currentView: state.currentView,
        boardSize: state.boardSize,
        gameMode: state.gameMode,
        language: state.language,
        theme: state.theme,
        style: state.style,
        settings: { ...state.settings },
        blockModeEnabled: state.blockModeEnabled,
        selectedDirection: state.selectedDirection ?? null,
        selectedDistance: state.selectedDistance ?? null,
        availableDistances: state.availableDistances,
        computerLastMoveDisplay: state.computerLastMoveDisplay,
        distanceManuallySelected: state.distanceManuallySelected,
        score: state.score,
        isGameOver: state.isGameOver
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
    if (state.playerRow === null || state.playerCol === null) return state;
    const blocked = state.blockedCells.some(cell => cell.row === row && cell.col === col);
    let newBlockedCells;
    if (blocked) {
      newBlockedCells = state.blockedCells.filter(cell => !(cell.row === row && cell.col === col));
    } else {
      newBlockedCells = [...state.blockedCells, { row, col }];
    }
    // Додаємо захист від null для getAvailableMoves
    let newAvailableMoves = state.availableMoves;
    if (state.playerRow !== null && state.playerCol !== null) {
      newAvailableMoves = getAvailableMoves(state.playerRow, state.playerCol, state.boardSize, state.cellVisitCounts, get(settingsStore).blockOnVisitCount);
    }
    return {
      ...state,
      blockedCells: newBlockedCells,
      availableMoves: newAvailableMoves,
    };
  });
}

export function toggleBlockMode() {
  appState.update(state => {
    const newBlockModeState = !state.blockModeEnabled;
    // Оновлюємо і стан гри, і налаштування одночасно
    settingsStore.updateSettings({ blockModeEnabled: newBlockModeState });
    return { ...state, blockModeEnabled: newBlockModeState };
  });
}

/**
 * Скидає гру і закриває всі активні модальні вікна.
 * Використовується як обробник для кнопки "Грати ще раз".
 */
export function resetAndCloseModal() {
  resetGame();
  modalStore.closeModal();
}

export function resetGame() {
  settingsStore.updateSettings({ showBoard: true }); // <-- ДОДАНО
  appState.update(state => {
    const boardSize = state.boardSize;
    const { row, col } = getRandomCell(boardSize);
    const board = createEmptyBoard(boardSize);
    board[row][col] = 1;
    const initialAvailableMoves = getAvailableMoves(row, col, boardSize, {}, 0);
    return {
      ...state,
      board,
      playerRow: row,
      playerCol: col,
      availableMoves: initialAvailableMoves, // Встановлюємо правильні ходи
      blockedCells: [],
      visitedCells: [],
      selectedDirection: null,
      selectedDistance: null,
      players: [
        { id: 1, type: 'human', name: 'Гравець' },
        { id: 2, type: 'ai', name: 'Комп\'ютер' }
      ],
      currentPlayerIndex: 0,
      lastMove: null,
      computerLastMoveDisplay: null,
      lastComputerMove: null,
      score: 0,
      penaltyPoints: 0, // <-- ДОДАНО
      isGameOver: false,
      gameId: (state.gameId || 0) + 1,
      availableDistances: Array.from({ length: boardSize - 1 }, (_, i) => i + 1),
      cellVisitCounts: {}, // <-- ДОДАНО
      moveHistory: [{ pos: { row, col }, blocked: [] }],
      isReplayMode: false,
      replayCurrentStep: 0,
      isAutoPlaying: false,
      limitReplayPath: true,
    };
  });
}

/**
 * Розраховує фінальний рахунок з усіма бонусами.
 * @param {AppState} state - Поточний стан гри ($appState).
 * @returns {{baseScore: number, totalPenalty: number, sizeBonus: number, blockModeBonus: number, noMovesBonus: number, jumpBonus: number, totalScore: number}}
 */
function calculateFinalScore(state) {
  const { score, penaltyPoints, boardSize, movesInBlockMode, finishedByNoMovesButton, jumpedBlockedCells } = state;
  const baseScore = score;
  const totalPenalty = penaltyPoints;
  // 1. Бонус за розмір дошки
  const sizeBonusPercentage = (boardSize > 2) ? (boardSize - 2) * 10 : 0;
  const sizeBonus = Math.ceil(baseScore * (sizeBonusPercentage / 100));
  // 2. Бонус за режим заблокованих клітинок
  const blockModeBonus = movesInBlockMode;
  // 3. Бонус за кнопку "Ходів немає"
  const noMovesBonus = finishedByNoMovesButton ? boardSize : 0;
  // 4. Бонус за перестрибування
  const jumpBonus = jumpedBlockedCells;
  const totalScore = baseScore + sizeBonus + blockModeBonus + noMovesBonus + jumpBonus - totalPenalty;
  return {
    baseScore,
    totalPenalty, // НОВЕ
    sizeBonus,
    blockModeBonus,
    noMovesBonus,
    jumpBonus,
    totalScore
  };
}

/**
 * Передає хід наступному гравцеві та запускає логіку для нового гравця (напр., хід AI).
 */
function advanceTurn() {
  appState.update(state => {
    if (state.isGameOver) return state;
    const newIndex = (state.currentPlayerIndex + 1) % state.players.length;
    const nextPlayer = state.players[newIndex];
    const newState = { ...state, currentPlayerIndex: newIndex };
    if (nextPlayer.type === 'ai') {
      setTimeout(() => makeComputerMove(), 100);
    }
    return newState;
  });
}

/**
 * Підтверджує хід гравця (синхронно, лише оновлює стан)
 */
export async function confirmMove() {
  if (typeof window === 'undefined') return;
  const state = get(appState);
  const {
    selectedDirection,
    selectedDistance,
    playerRow,
    playerCol,
    lastComputerMove,
    boardSize,
    blockedCells,
    settings,
    blockModeEnabled
  } = state;
  if (!selectedDirection || !selectedDistance || playerRow === null || playerCol === null) return;
  const dir = /** @type {Direction} */ (selectedDirection);
  if (!dirMap[dir]) return;
  const [dr, dc] = dirMap[dir];
  const newRow = playerRow + dr * selectedDistance;
  const newCol = playerCol + dc * selectedDistance;
  if (newRow === null || newCol === null) return;
  const isOutsideBoard = newRow < 0 || newRow >= boardSize || newCol < 0 || newCol >= boardSize;
  const { blockOnVisitCount } = get(settingsStore);
  const visitCount = state.cellVisitCounts[`${newRow}-${newCol}`] || 0;
  const isCellBlocked = blockModeEnabled && visitCount > blockOnVisitCount;
  let jumpedCount = 0;
  if (selectedDistance > 1) {
    for (let i = 1; i < selectedDistance; i++) {
      const checkRow = playerRow + dr * i;
      const checkCol = playerCol + dc * i;
      if (blockedCells.some(cell => cell.row === checkRow && cell.col === checkCol)) {
        jumpedCount++;
      }
    }
  }
  const { showBoard, showQueen } = get(settingsStore);
  let scoreChange = 1;
  if (!showBoard) {
    scoreChange = 3; // Дошка прихована
  } else if (!showQueen) {
    scoreChange = 2; // Дошка видима, але ферзь прихований
  }
  let penaltyApplied = 0;
  if (
    lastComputerMove &&
    selectedDistance === lastComputerMove.distance &&
    selectedDirection === oppositeDirections[lastComputerMove.direction]
  ) {
    penaltyApplied = 2;
    console.log('[confirmMove] Penalty applied for reverse move.');
  }
  if (isOutsideBoard || isCellBlocked) {
    const reasonKey = isOutsideBoard ? 'modal.gameOverReasonOut' : 'modal.gameOverReasonBlocked';
    // --- Додаємо останній хід до історії, якщо це вихід за межі дошки ---
    if (isOutsideBoard) {
      appState.update(s => ({
        ...s,
        moveHistory: [...s.moveHistory, { pos: { row: newRow, col: newCol }, blocked: s.blockedCells }]
      }));
    }
    const finalScoreDetails = calculateFinalScore(get(appState));
    appState.update(s => ({ ...s, isGameOver: true, score: finalScoreDetails.totalScore }));
    modalStore.showModal({
      titleKey: 'modal.gameOverTitle',
      content: { reason: get(t)(reasonKey), scoreDetails: finalScoreDetails },
      buttons: [
        { textKey: 'modal.playAgain', primary: true, onClick: resetAndCloseModal, isHot: true },
        { textKey: 'modal.watchReplay', customClass: 'blue-btn', onClick: startReplay }
      ]
    });
    return;
  }
  // 1. Оновлюємо стан для ходу гравця, що запускає його анімацію.
  appState.update(s => {
    const moveUpdates = performMove(s, newRow, newCol);
    return {
      ...s,
      ...moveUpdates,
      score: s.score + scoreChange,
      penaltyPoints: s.penaltyPoints + penaltyApplied,
      movesInBlockMode: blockModeEnabled ? s.movesInBlockMode + 1 : s.movesInBlockMode,
      jumpedBlockedCells: s.jumpedBlockedCells + jumpedCount,
      selectedDirection: null,
      selectedDistance: null,
      distanceManuallySelected: false,
      computerLastMoveDisplay: null,
      availableMoves: [], // Прибираємо старі доступні ходи
    };
  });
  // 2. Передаємо хід наступному гравцеві через новий ігровий цикл.
  advanceTurn();
}

export async function makeComputerMove() {
  const current = get(appState);
  // Перевіряємо, чи зараз хід AI
  if (current.isGameOver || current.players[current.currentPlayerIndex]?.type !== 'ai') return;
  const move = getRandomComputerMove(current.board, current.cellVisitCounts, get(settingsStore).blockOnVisitCount, current.boardSize);
  if (move) {
    const directionKey = Object.prototype.hasOwnProperty.call(numToDir, move.direction) ? /** @type {Direction} */(numToDir[move.direction]) : /** @type {Direction} */(move.direction);
    appState.update(state => ({
      ...state,
      computerLastMoveDisplay: { direction: directionKey, distance: move.distance },
      lastComputerMove: { direction: directionKey, distance: move.distance },
    }));
    await new Promise(resolve => setTimeout(resolve, 900));
    appState.update(state => {
      const moveUpdates = performMove(state, move.row, move.col);
      return {
        ...state,
        ...moveUpdates,
      };
    });
    await new Promise(resolve => setTimeout(resolve, 600));
    // 6. ЕТАП 3: Оновлюємо доступні ходи для гравця
    appState.update(state => {
      if (state.playerRow === null || state.playerCol === null) return state;
      const newAvailableMoves = getAvailableMoves(state.playerRow, state.playerCol, state.boardSize, state.cellVisitCounts, get(settingsStore).blockOnVisitCount);
      return { ...state, availableMoves: newAvailableMoves };
    });
    // 7. ЕТАП 4: Перевірка першого ходу та приховування дошки
    const latestState = get(appState);
    // Видаляємо блок автоприховування дошки та змінити нумерацію коментаря
    // 8. Передаємо хід наступному гравцеві
    advanceTurn();
    // Озвучування ходу (залишається в кінці)
    const latestSettings = get(settingsStore);
    if (latestSettings.speechEnabled) {
      const $t = get(t);
      const direction = $t(`speech.directions.${directionKey}`) || directionKey;
      let textToSpeak;
      if (move.distance === 1) {
        textToSpeak = `${direction}.`;
      } else {
        textToSpeak = `${move.distance} ${direction}.`;
      }
      let langCode = 'uk-UA';
      if (Object.prototype.hasOwnProperty.call(langMap, latestSettings.language)) {
        // @ts-ignore
        langCode = langMap[latestSettings.language];
      }
      speakText(textToSpeak, langCode, latestSettings.selectedVoiceURI ?? null);
    }
  } else {
    // ... (існуюча логіка, коли у комп'ютера немає ходів)
    const previewScoreDetails = calculateFinalScore({ ...current, finishedByNoMovesButton: true });
    const $t = get(t);
    modalStore.showModal({
      titleKey: 'modal.computerNoMovesTitle',
      content: {
        reason: $t('modal.computerNoMovesContent'),
        scoreDetails: previewScoreDetails
      },
      buttons: [
        {
          textKey: 'modal.continueGame',
          primary: true,
          isHot: true,
          onClick: continueGameAndClearBlocks,
          customClass: 'green-btn'
        },
        {
          text: $t('modal.finishGameWithBonus', { values: { bonus: current.boardSize } }),
          customClass: 'blue-btn',
          onClick: finishGameWithBonus
        },
        {
          textKey: 'modal.watchReplay',
          customClass: 'blue-btn',
          onClick: startReplay
        }
      ]
    });
    // Видаляємо ручне повернення currentPlayer
  }
}

/**
 * Перевіряє, чи є доступні ходи, і показує відповідне модальне вікно
 */
export function noMoves() {
  const state = get(appState);
  // Перевірка, чи дійсно немає ходів
  if (state.availableMoves.length === 0) {
    // Показуємо попередній рахунок з бонусом
    const previewScoreDetails = calculateFinalScore({ ...state, finishedByNoMovesButton: true });
    const $t = get(t);
    modalStore.showModal({
      titleKey: 'modal.playerNoMovesTitle',
      content: {
        reason: $t('modal.playerNoMovesContent'),
        scoreDetails: previewScoreDetails
      },
      buttons: [
        {
          textKey: 'modal.continueGame',
          primary: true,
          isHot: true,
          onClick: continueGameAndClearBlocks,
          customClass: 'green-btn'
        },
        {
          text: $t('modal.finishGameWithBonus', { values: { bonus: state.boardSize } }),
          customClass: 'blue-btn',
          onClick: finishGameWithBonus
        },
        {
          textKey: 'modal.watchReplay',
          customClass: 'blue-btn',
          onClick: startReplay
        }
      ]
    });
  } else {
    // Ходи є. Гравець програв.
    const finalScoreDetails = calculateFinalScore(state);
    const $t = get(t);
    modalStore.showModal({
      titleKey: 'modal.errorTitle',
      content: {
        reason: $t('modal.errorContent', { values: { count: state.availableMoves.length } }),
        scoreDetails: finalScoreDetails
      },
      buttons: [{ textKey: 'modal.playAgain', primary: true, onClick: resetAndCloseModal, isHot: true }]
    });
  }
}

/**
 * Продовжує гру, очищуючи всі заблоковані клітинки.
 */
export function continueGameAndClearBlocks() {
  appState.update(state => {
    if (state.playerRow === null || state.playerCol === null) return state;
    // Скидаємо лічильники відвідувань
    /** @type {{ [key: string]: number }} */
    const newVisitCounts = {};
    // Перераховуємо доступні ходи для чистої дошки
    const newAvailableMoves = getAvailableMoves(
      state.playerRow,
      state.playerCol,
      state.boardSize,
      newVisitCounts,
      get(settingsStore).blockOnVisitCount
    );
    // Закриваємо модальне вікно
    closeModal();
    return {
      ...state,
      cellVisitCounts: newVisitCounts,
      availableMoves: newAvailableMoves,
      lastComputerMove: null,
      computerLastMoveDisplay: null,
    };
  });
}

/**
 * Завершує гру, нараховуючи бонусний рахунок за правильне завершення (окремо від бонусу за "Ходів немає").
 */
export function finishGameWithBonus() {
  const finishBonus = 3;
  appState.update(s => ({ ...s, finishedByNoMovesButton: true }));
  const state = get(appState);
  const baseScoreDetails = calculateFinalScore(state);
  const finalScoreDetails = {
    ...baseScoreDetails,
    finishBonus,
    totalScore: baseScoreDetails.totalScore + finishBonus
  };
  modalStore.showModal({
    titleKey: 'modal.gameOverTitle',
    content: {
      reason: get(t)('modal.gameOverReasonBonus'),
      scoreDetails: finalScoreDetails
    },
    buttons: [
      { textKey: 'modal.playAgain', primary: true, isHot: true, onClick: resetAndCloseModal, customClass: 'green-btn' },
      { textKey: 'modal.watchReplay', customClass: 'blue-btn', onClick: startReplay },
      { textKey: 'gameBoard.mainMenu', customClass: 'blue-btn', onClick: navigateToMainMenu }
    ]
  });
}

/**
 * Достроково завершує гру та фіксує поточний рахунок.
 */
export function cashOutAndEndGame() {
  const state = get(appState);
  if (state.isGameOver) return; // Запобіжник від повторного виклику

  // Розраховуємо фінальний рахунок на основі поточного стану
  const finalScoreDetails = calculateFinalScore(state);

  // Оновлюємо стан, позначаючи гру як завершену
  appState.update(s => ({ 
    ...s, 
    isGameOver: true, 
    score: finalScoreDetails.totalScore 
  }));

  // Показуємо модальне вікно з результатами
  modalStore.showModal({
    titleKey: 'modal.gameOverTitle',
    content: {
      reason: get(t)('modal.gameOverReasonCashOut'),
      scoreDetails: finalScoreDetails
    },
    buttons: [
      { textKey: 'modal.playAgain', primary: true, isHot: true, onClick: resetAndCloseModal, customClass: 'green-btn' },
      { textKey: 'modal.watchReplay', customClass: 'blue-btn', onClick: startReplay },
      { textKey: 'gameBoard.mainMenu', customClass: 'blue-btn', onClick: navigateToMainMenu }
    ]
  });
}

// --- Додаю setDirection та setDistance для GameControls.svelte ---
/**
 * Встановлює напрямок ходу з автологікою вибору відстані
 * @param {Direction} dir
 */
export function setDirection(dir) {
  appState.update(state => {
    const {
      selectedDirection,
      selectedDistance,
      distanceManuallySelected,
      boardSize
    } = state;

    const maxDist = boardSize - 1;
    let newDistance = selectedDistance;
    let newManuallySelected = distanceManuallySelected;

    // Випадок 1: Гравець вибрав новий напрямок.
    if (selectedDirection !== dir) {
      // Якщо відстань НЕ була обрана вручну, встановлюємо її за замовчуванням.
      if (!distanceManuallySelected) {
        newDistance = 1;
        newManuallySelected = false;
      }
      // Якщо відстань була обрана вручну, ми її НЕ змінюємо.
    }
    // Випадок 2: Гравець клікнув на той самий напрямок (логіка інкременту).
    else {
      // Якщо відстань була встановлена вручну, ми ігноруємо інкремент.
      if (distanceManuallySelected) {
        // Нічого не робимо, відстань залишається тією ж.
      }
      // Якщо вибір не був ручним, застосовуємо логіку інкременту.
      else {
        if (selectedDistance === null || selectedDistance === undefined || selectedDistance >= maxDist) {
          newDistance = 1;
        } else {
          newDistance = selectedDistance + 1;
        }
        newManuallySelected = false;
      }
    }

    return {
      ...state,
      selectedDirection: /** @type {Direction} */(dir),
      selectedDistance: newDistance,
      distanceManuallySelected: newManuallySelected,
      computerLastMoveDisplay: null // Приховуємо показ ходу комп'ютера
    };
  });
}

/**
 * Встановлює відстань ходу вручну
 * @param {number} dist
 */
export function setDistance(dist) {
  appState.update(state => ({ 
    ...state, 
    selectedDistance: dist, 
    distanceManuallySelected: true, // Це важливо
    computerLastMoveDisplay: null 
  }));
}

/**
 * Відображає хід комп'ютера в UI (для центральної кнопки)
 * @param {Direction} direction
 * @param {number} distance
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

// === REPLAY LOGIC ===
/** @type {ReturnType<typeof setInterval> | null} */
let autoPlayInterval = null;

export function startReplay() {
  modalStore.closeModal();
  appState.update(state => ({
    ...state,
    isReplayMode: true,
    replayCurrentStep: 0,
  }));
}

export function stopReplay() {
  if (autoPlayInterval) clearInterval(autoPlayInterval);
  appState.update(state => ({
    ...state,
    isReplayMode: false,
    isAutoPlaying: false,
  }));
  const state = get(appState);
  const finalScoreDetails = calculateFinalScore(state);
  const lastMove = state.moveHistory.length > 0 ? state.moveHistory.at(-1) : null;
  const reasonKey = lastMove && (
    lastMove.pos.row < 0 || lastMove.pos.row >= state.boardSize ||
    lastMove.pos.col < 0 || lastMove.pos.col >= state.boardSize
  )
    ? 'modal.gameOverReasonOut'
    : 'modal.gameOverReasonBlocked';
  modalStore.showModal({
    titleKey: 'modal.gameOverTitle',
    content: { reason: get(t)(reasonKey), scoreDetails: finalScoreDetails },
    buttons: [
      { textKey: 'modal.playAgain', primary: true, onClick: resetAndCloseModal, isHot: true, customClass: 'green-btn' },
      { textKey: 'modal.watchReplay', customClass: 'blue-btn', onClick: startReplay }
    ]
  });
}

/**
 * Перейти до кроку реплею
 * @param {number} step
 */
export function goToReplayStep(step) {
  appState.update(state => {
    const newStep = Math.max(0, Math.min(step, (state.moveHistory?.length || 1) - 1));
    return { ...state, replayCurrentStep: newStep };
  });
}

export function toggleAutoPlay() {
  const state = get(appState);
  if (state.isAutoPlaying) {
    if (autoPlayInterval) clearInterval(autoPlayInterval);
    appState.update(s => ({ ...s, isAutoPlaying: false }));
  } else {
    // Якщо запис дійшов кінця, скидаємо на початок
    if (state.replayCurrentStep >= (state.moveHistory?.length || 1) - 1) {
      goToReplayStep(0);
    }
    appState.update(s => ({ ...s, isAutoPlaying: true }));
    autoPlayInterval = setInterval(() => {
      const currentState = get(appState);
      if (currentState.replayCurrentStep < (currentState.moveHistory?.length || 1) - 1) {
        goToReplayStep(currentState.replayCurrentStep + 1);
      } else {
        if (autoPlayInterval) clearInterval(autoPlayInterval);
        appState.update(s => ({ ...s, isAutoPlaying: false }));
      }
    }, 1000);
  }
} 

export function toggleLimitReplayPath() {
  appState.update(state => ({
    ...state,
    limitReplayPath: !state.limitReplayPath,
  }));
} 
