import { writable, derived } from 'svelte/store';
import { getRandomComputerMove } from '$lib/ai.js';
import { get } from 'svelte/store';
import { modalStore } from './modalStore.js';
import { closeModal } from './modalStore.js';
import { speakMove, langMap } from '$lib/speech.js';
import { settingsStore } from './settingsStore.js';
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
 * @typedef {Object} AppState
 * @property {string} currentView
 * @property {number} boardSize
 * @property {string} gameMode
 * @property {string} language
 * @property {string} theme
 * @property {string} style
 * @property {{ showMoves: boolean, showBoard: boolean, speechEnabled: boolean, language: string, theme: string, style: string, selectedVoiceURI?: string }} settings
 * @property {number[][]} board
 * @property {number} playerRow
 * @property {number} playerCol
 * @property {{row: number, col: number}[]} blockedCells
 * @property {{row: number, col: number}[]} availableMoves
 * @property {boolean} blockModeEnabled
 * @property {Direction|null|undefined} selectedDirection
 * @property {number|null|undefined} selectedDistance
 * @property {number[]} availableDistances
 * @property {number} currentPlayer
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
const style = isBrowser ? localStorage.getItem('style') : null;

// Випадкова стартова позиція ферзя
const initialBoardSize = 3;
const { row: initialRow, col: initialCol } = getRandomCell(initialBoardSize);
console.log('[appState] Стартова позиція ферзя:', { initialRow, initialCol });
export const appState = writable(/** @type {AppState} */({
  currentView: 'mainMenu',
  boardSize: initialBoardSize,
  gameMode: 'vsComputer',
  language: lang || 'uk',
  theme: theme || 'dark',
  style: style || 'ubuntu',
  settings: {
    showMoves: true,
    showBoard: true,
    speechEnabled: false,
    language: lang || 'uk',
    theme: theme || 'dark',
    style: style || 'ubuntu',
  },
  board: (() => {
    const b = createEmptyBoard(initialBoardSize);
    b[initialRow][initialCol] = 1;
    return b;
  })(),
  playerRow: initialRow,
  playerCol: initialCol,
  blockedCells: /** @type {{row:number,col:number}[]} */ ([]),
  availableMoves: /** @type {{row:number,col:number}[]} */ (getAvailableMoves(initialRow, initialCol, initialBoardSize, [])),
  blockModeEnabled: false,
  selectedDirection: null,
  selectedDistance: null,
  currentPlayer: 1, // 1 — гравець, 2 — комп'ютер
  lastMove: null,
  computerLastMoveDisplay: null, // { direction, distance }
  lastComputerMove: null, // **НОВЕ**
  distanceManuallySelected: false,
  visitedCells: /** @type {{row:number,col:number}[]} */ ([]),
  isGameOver: false,
  score: 0,
  movesInBlockMode: 0, // НОВЕ
  jumpedBlockedCells: 0, // НОВЕ
  penaltyPoints: 0, // НОВЕ
  finishedByNoMovesButton: false, // НОВЕ
  gameId: 1, // <-- ДОДАНО
  availableDistances: [], // ДОДАНО для відповідності типу AppState
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
  const { board, playerRow, playerCol, boardSize, blockModeEnabled, visitedCells, blockedCells } = state;

  // 1. Створюємо копію дошки та переміщуємо фігуру
  const newBoard = board.map(row => row.slice());
  newBoard[playerRow][playerCol] = 0;
  newBoard[newRow][newCol] = 1;

  // 2. Оновлюємо відвідані та заблоковані клітинки
  let newVisitedCells = [...visitedCells];
  let newBlockedCells = [...blockedCells];

  if (blockModeEnabled) {
    const prevCell = { row: playerRow, col: playerCol };

    // **КЛЮЧОВЕ ВИПРАВЛЕННЯ:** Додаємо попередню клітинку до списку заблокованих,
    // якщо її там ще немає. Це забезпечує накопичення.
    if (!newBlockedCells.some(c => c.row === prevCell.row && c.col === prevCell.col)) {
      newBlockedCells.push(prevCell);
    }
    
    // Оновлюємо також і visitedCells для консистентності, хоча основна логіка тепер
    // залежить від newBlockedCells.
    if (!newVisitedCells.some(c => c.row === prevCell.row && c.col === prevCell.col)) {
        newVisitedCells.push(prevCell);
    }
  }

  // 3. Розраховуємо нові доступні ходи, використовуючи оновлений список блокувань
  const newAvailableMoves = getAvailableMoves(newRow, newCol, boardSize, newBlockedCells);

  /** @type {Partial<AppState>} */
  const result = {
    board: newBoard,
    playerRow: newRow,
    playerCol: newCol,
    blockedCells: newBlockedCells,
    visitedCells: newVisitedCells,
    availableMoves: newAvailableMoves,
    lastMove: null,
  };
  return result;
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
export function setBoardSize(newSize) {
  console.log('[setBoardSize] Function called with size:', newSize);
  
  const cell = getRandomCell(newSize);
  const row = cell.row;
  const col = cell.col;
  
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
      visitedCells: [],
      // --- Ключове виправлення: Повне скидання стану ---
      selectedDirection: null,
      selectedDistance: null,
      distanceManuallySelected: false,
      currentPlayer: 1, // Завжди починає гравець
      lastMove: null,
      computerLastMoveDisplay: null,
      lastComputerMove: null,
      score: 0,
      movesInBlockMode: 0,
      jumpedBlockedCells: 0,
      penaltyPoints: 0,
      finishedByNoMovesButton: false,
      isGameOver: false,
      gameId: (state.gameId || 0) + 1, // Оновлюємо ID гри для Svelte
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
    const blocked = state.blockedCells.some(cell => cell.row === row && cell.col === col);
    let newBlockedCells;
    if (blocked) {
      newBlockedCells = state.blockedCells.filter(cell => !(cell.row === row && cell.col === col));
    } else {
      newBlockedCells = [...state.blockedCells, { row, col }];
    }
    const newAvailableMoves = getAvailableMoves(state.playerRow, state.playerCol, state.boardSize, newBlockedCells);
    return {
      ...state,
      blockedCells: newBlockedCells,
      availableMoves: newAvailableMoves,
    };
  });
}

export function toggleBlockMode() {
  appState.update(state => ({ ...state, blockModeEnabled: !state.blockModeEnabled }));
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
  appState.update(state => {
    const boardSize = state.boardSize;
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
      visitedCells: [],
      // --- Ключове виправлення: Повне скидання стану ---
      selectedDirection: null,
      selectedDistance: null,
      distanceManuallySelected: false,
      currentPlayer: 1, // Завжди починає гравець
      lastMove: null,
      computerLastMoveDisplay: null,
      lastComputerMove: null,
      score: 0,
      movesInBlockMode: 0,
      jumpedBlockedCells: 0,
      penaltyPoints: 0,
      finishedByNoMovesButton: false,
      isGameOver: false,
      gameId: (state.gameId || 0) + 1, // Оновлюємо ID гри
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
 * Виконує хід комп'ютера у режимі vsComputer
 */
export function makeComputerMove() {
  console.log('[makeComputerMove] Function called');
  const current = get(appState);
  const move = getRandomComputerMove(current.board, current.blockedCells, current.boardSize);
  if (move) {
    appState.update(state => {
      const moveUpdates = performMove(state, move.row, move.col);
      const directionKey = Object.prototype.hasOwnProperty.call(numToDir, move.direction) ? /** @type {Direction} */(numToDir[move.direction]) : /** @type {Direction} */(move.direction);
      return {
        ...state,
        ...moveUpdates,
        currentPlayer: 1,
        lastMove: null,
        computerLastMoveDisplay: { direction: directionKey, distance: move.distance },
        lastComputerMove: { direction: directionKey, distance: move.distance },
      };
    });
    const directionKey = Object.prototype.hasOwnProperty.call(numToDir, move.direction) ? /** @type {Direction} */(numToDir[move.direction]) : /** @type {Direction} */(move.direction);
    const latestSettings = get(settingsStore);
    if (latestSettings.speechEnabled) {
      const langCode = langMap[latestSettings.language] || 'uk-UA';
      speakMove('computer', directionKey, move.distance, langCode, latestSettings.selectedVoiceURI ?? null);
    }
  } else {
    modalStore.showModal({
      title: 'Комп\'ютер не може зробити хід',
      content: 'Ви можете очистити поле і продовжити гру, або завершити її зараз і отримати бонусні бали.',
      buttons: [
        { text: `Продовжити`, primary: true, isHot: true, onClick: continueGameAndClearBlocks, customClass: 'green-btn' },
        { text: `Завершити (+${current.boardSize} балів)`, customClass: 'blue-btn', onClick: finishGameWithBonus }
      ]
    });
  }
}

export function toggleShowMoves() {
  settingsStore.update(settings => ({ ...settings, showMoves: !settings.showMoves }));
}
export function toggleShowBoard() {
  settingsStore.update(settings => ({ ...settings, showBoard: !(settings.showBoard ?? true) }));
}
export function toggleSpeech() {
  settingsStore.update(settings => {
    return { ...settings, speechEnabled: !settings.speechEnabled };
  });
}
/**
 * Встановлює напрямок і керує відстанню при повторних кліках.
 * @param {string} dir - Новий напрямок, наприклад, 'up', 'down-left'.
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
    let newDistance;
    let newManuallySelected;

    // Випадок 1: Гравець вибрав новий напрямок.
    if (selectedDirection !== dir) {
      newDistance = 1; // Завжди починаємо з відстані 1.
      newManuallySelected = false; // Скидаємо прапорець ручного вибору.
    } 
    // Випадок 2: Гравець клікнув на той самий напрямок.
    else {
      // Якщо відстань була встановлена вручну, ми не змінюємо її.
      // Гравець має вибрати інший напрямок, щоб скинути цей стан. selectedDistance може бути null.
      if (distanceManuallySelected) {
        newDistance = selectedDistance;
        newManuallySelected = true;
      } 
      // Якщо вибір не був ручним, застосовуємо логіку інкременту.
      else {
        // Якщо відстань не встановлена або досягла максимуму, скидаємо на 1.
        if (selectedDistance === null || selectedDistance === undefined || selectedDistance >= maxDist) {
          newDistance = 1;
        } 
        // В іншому випадку, просто збільшуємо на 1.
        else {
          newDistance = selectedDistance + 1;
        }
        newManuallySelected = false; // Прапорець залишається false.
      }
    }

    return {
      ...state,
      selectedDirection: /** @type {Direction} */(dir),
      selectedDistance: newDistance,
      distanceManuallySelected: newManuallySelected,
      computerLastMoveDisplay: null // Приховуємо показ ходу комп'ютера при виборі гравця.
    };
  });
}

/**
 * Встановлює відстань вручну, активуючи відповідний прапорець.
 * @param {number} dist
 */
export function setDistance(dist) {
  appState.update(state => ({
    ...state,
    selectedDistance: dist,
    distanceManuallySelected: true, // Це найважливіший рядок тут
    computerLastMoveDisplay: null
  }));
}
export function confirmMove() {
  if (typeof window === 'undefined') return;

  const state = get(appState);
  const {
    selectedDirection,
    selectedDistance,
    lastComputerMove,
    playerRow,
    playerCol,
    boardSize,
    blockedCells,
    settings,
    blockModeEnabled
  } = state;

  if (!selectedDirection || !selectedDistance) return;

  const dir = /** @type {Direction} */ (selectedDirection);
  if (!dirMap[dir]) return;

  const [dr, dc] = dirMap[dir];
  const newRow = playerRow + dr * selectedDistance;
  const newCol = playerCol + dc * selectedDistance;

  const isOutsideBoard = newRow < 0 || newRow >= boardSize || newCol < 0 || newCol >= boardSize;
  const isCellBlocked = blockedCells.some(cell => cell.row === newRow && cell.col === newCol);
  
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
  
  let scoreChange = 1;
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
    const reason = isOutsideBoard ? 'Ви вийшли за межі дошки.' : 'Ви спробували стати на заблоковану клітинку.';
    const finalScoreDetails = calculateFinalScore(state);
    appState.update(s => ({ ...s, isGameOver: true, score: finalScoreDetails.totalScore }));
    modalStore.showModal({
      title: 'Гру завершено!',
      content: { reason: reason, scoreDetails: finalScoreDetails },
      buttons: [{ text: 'Грати ще раз', primary: true, onClick: resetAndCloseModal, isHot: true }]
    });
    return;
  }
  // --- Кінець логіки перевірки ---

  // Оновлюємо стан ТІЛЬКИ для ходу гравця
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
      currentPlayer: 2, // Передаємо хід комп'ютеру
      lastMove: null,
      computerLastMoveDisplay: null,
    };
  });
}

// --- Реактивний ефект для запуску ходу комп'ютера ---
appState.subscribe(state => {
  if (state.currentPlayer === 2 && state.gameMode === 'vsComputer' && !state.isGameOver) {
    const COMPUTER_MOVE_DELAY = 1000; // 1 секунда для дебагу
    console.log(`[Effect] Player's turn ended. Waiting ${COMPUTER_MOVE_DELAY}ms to make computer's move.`);
    setTimeout(() => {
      makeComputerMove();
    }, COMPUTER_MOVE_DELAY);
  }
});

/**
 * Продовжує гру, очищуючи всі заблоковані клітинки.
 */
export function continueGameAndClearBlocks() {
  appState.update(state => {
    // Очищуємо заблоковані клітинки
    const newBlockedCells = /** @type {{row: number, col: number}[]} */ ([]);
    // Перераховуємо доступні ходи для чистої дошки
    const newAvailableMoves = getAvailableMoves(state.playerRow, state.playerCol, state.boardSize, newBlockedCells);

    // Закриваємо модальне вікно
    closeModal();

    return {
      ...state,
      blockedCells: newBlockedCells,
      availableMoves: newAvailableMoves,
    };
  });
}

/**
 * Завершує гру, нараховуючи бонусні бали за правильне завершення (окремо від бонусу за "Ходів немає").
 * @returns {void}
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
  appState.update(s => ({ ...s, isGameOver: true, score: finalScoreDetails.totalScore }));
  modalStore.showModal({
    title: 'Гру завершено!',
    content: {
      reason: 'Ви вирішили завершити гру та забрати бонус.',
      scoreDetails: finalScoreDetails
    },
    buttons: [
      { text: 'Грати ще раз', primary: true, isHot: true, onClick: resetAndCloseModal, customClass: 'green-btn' },
      { textKey: 'gameBoard.mainMenu', customClass: 'blue-btn', onClick: navigateToMainMenu }
    ]
  });
}

export function noMoves() {
  const state = get(appState);
  // Перевірка, чи дійсно немає ходів
  if (state.availableMoves.length === 0) {
    // Показуємо попередній рахунок з бонусом
    const previewScoreDetails = calculateFinalScore({ ...state, finishedByNoMovesButton: true });
    modalStore.showModal({
      title: 'Ходів немає. Що робити далі?',
      content: {
        reason: 'Ви можете очистити поле і продовжити гру, або завершити її зараз і отримати бонусні бали.',
        scoreDetails: previewScoreDetails
      },
      buttons: [
        {
          text: `Продовжити`,
          primary: true,
          isHot: true,
          onClick: continueGameAndClearBlocks,
          customClass: 'green-btn'
        },
        {
          text: `Завершити (+${state.boardSize} балів)`,
          customClass: 'blue-btn',
          onClick: finishGameWithBonus
        }
      ]
    });
  } else {
    // Ходи є. Гравець програв.
    // Розраховуємо фінальний рахунок перед показом модального вікна
    const finalScoreDetails = calculateFinalScore(state);
    appState.update(s => ({ ...s, isGameOver: true, score: finalScoreDetails.totalScore }));
    modalStore.showModal({
      title: 'Помилка!',
      content: {
        reason: `У вас ще є доступні ходи (${state.availableMoves.length} шт.). Ви програли.`,
        scoreDetails: finalScoreDetails
      },
      buttons: [{ text: 'Грати ще раз', primary: true, onClick: resetAndCloseModal, isHot: true }]
    });
  }
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