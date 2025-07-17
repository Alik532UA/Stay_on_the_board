import { writable, derived } from 'svelte/store';
import { getRandomComputerMove } from '$lib/ai.js';
import { get } from 'svelte/store';
import { modalStore } from './modalStore.js';
import { closeModal } from './modalStore.js';
import { speakMove, langMap } from '$lib/speech.js';
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
 * @param {{row:number,col:number}[]} blockedCells
 */
function getAvailableMoves(row, col, size, blockedCells = []) {
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
 * @property {number|null} playerRow
 * @property {number|null} playerCol
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
 * @property {boolean} isFirstComputerMovePending // <-- ДОДАНО
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
  board: createEmptyBoard(initialBoardSize), // Порожня дошка
  playerRow: null, // Немає гравця
  playerCol: null, // Немає гравця
  blockedCells: /** @type {{row:number,col:number}[]} */ ([]),
  availableMoves: /** @type {{row:number,col:number}[]} */ ([]), // Немає ходів
  blockModeEnabled: false,
  selectedDirection: null,
  selectedDistance: null,
  currentPlayer: 1,
  lastMove: null,
  computerLastMoveDisplay: null,
  lastComputerMove: null,
  distanceManuallySelected: false,
  visitedCells: /** @type {{row:number,col:number}[]} */ ([]),
  isGameOver: false,
  score: 0,
  movesInBlockMode: 0,
  jumpedBlockedCells: 0,
  penaltyPoints: 0,
  finishedByNoMovesButton: false,
  gameId: 1,
  availableDistances: [],
  isFirstComputerMovePending: true, // <-- ДОДАНО
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
  const { board, playerRow, playerCol, boardSize, blockModeEnabled, currentPlayer } = state;
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

  // КЛЮЧОВА ЗМІНА: Ми більше не розраховуємо доступні ходи тут.
  // Це буде зроблено в окремому етапі.

  return {
    board: newBoard,
    playerRow: newRow,
    playerCol: newCol,
    blockedCells: newBlockedCells,
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
    
    return {
      ...state,
      boardSize: newSize,
      board,
      playerRow: row,
      playerCol: col,
      availableMoves: [], // Починаємо з порожніми ходами
      blockedCells: [],
      visitedCells: [],
      selectedDirection: null,
      selectedDistance: null,
      currentPlayer: 1,
      lastMove: null,
      computerLastMoveDisplay: null,
      lastComputerMove: null,
      score: 0,
      penaltyPoints: 0, // <-- ДОДАНО
      isGameOver: false,
      gameId: (state.gameId || 0) + 1,
      isFirstComputerMovePending: true, // <-- ДОДАНО
    };
  });

  // ПІСЛЯ оновлення стану, з затримкою додаємо доступні ходи
  setTimeout(() => {
    appState.update(state => {
      // Виправлення: захист від null
      if (state.playerRow === null || state.playerCol === null) return state;
      const initialAvailableMoves = getAvailableMoves(state.playerRow, state.playerCol, state.boardSize, []);
      return { ...state, availableMoves: initialAvailableMoves };
    });
  }, 300); // Затримка для появи ферзя
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
    const isAvailable = getAvailableMoves(Number(playerRow), Number(playerCol), boardSize, blockedCells)
      .some(move => move.row === Number(newRow) && move.col === Number(newCol));
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
      newAvailableMoves = getAvailableMoves(state.playerRow, state.playerCol, state.boardSize, newBlockedCells);
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
    const initialAvailableMoves = getAvailableMoves(row, col, boardSize, []);
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
      currentPlayer: 1,
      lastMove: null,
      computerLastMoveDisplay: null,
      lastComputerMove: null,
      score: 0,
      penaltyPoints: 0, // <-- ДОДАНО
      isGameOver: false,
      gameId: (state.gameId || 0) + 1,
      isFirstComputerMovePending: true, // <-- ДОДАНО
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
  // Додаємо перевірку на null для координат
  if (!selectedDirection || !selectedDistance || playerRow === null || playerCol === null) return;
  const dir = /** @type {Direction} */ (selectedDirection);
  if (!dirMap[dir]) return;
  const [dr, dc] = dirMap[dir];
  const newRow = playerRow + dr * selectedDistance;
  const newCol = playerCol + dc * selectedDistance;
  if (newRow === null || newCol === null) return;
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

  // 1. Оновлюємо стан для ходу гравця, що запускає його анімацію.
  //    Також прибираємо доступні ходи, щоб вони не заважали.
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
      currentPlayer: 2,
      computerLastMoveDisplay: null,
      availableMoves: [], // Прибираємо старі доступні ходи
    };
  });

  // 2. НЕГАЙНО (без await) запускаємо хід комп'ютера.
  //    Це дозволяє анімації гравця і логіці комп'ютера виконуватися паралельно.
  if (get(appState).gameMode === 'vsComputer') {
    makeComputerMove();
  }
}

export async function makeComputerMove() {
  const current = get(appState);
  if (current.isGameOver || current.currentPlayer !== 2) return;

  // 1. Розраховуємо хід комп'ютера
  const move = getRandomComputerMove(current.board, current.blockedCells, current.boardSize);
  
  if (move) {
    const directionKey = Object.prototype.hasOwnProperty.call(numToDir, move.direction) ? /** @type {Direction} */(numToDir[move.direction]) : /** @type {Direction} */(move.direction);
    
    // 2. ЕТАП 1: Миттєво оновлюємо UI (центральну кнопку)
    appState.update(state => ({
      ...state,
      computerLastMoveDisplay: { direction: directionKey, distance: move.distance },
      lastComputerMove: { direction: directionKey, distance: move.distance },
    }));

    // 3. Пауза, щоб гравець побачив хід на кнопці перед анімацією
    await new Promise(resolve => setTimeout(resolve, 900));

    // 4. ЕТАП 2: Оновлюємо стан дошки, що запускає анімацію фігури
    appState.update(state => {
      const moveUpdates = performMove(state, move.row, move.col);
      return {
        ...state,
        ...moveUpdates,
      };
    });

    // 5. Пауза, щоб анімація переміщення фігури комп'ютера завершилася
    await new Promise(resolve => setTimeout(resolve, 600));

    // 6. ЕТАП 3: ТІЛЬКИ ТЕПЕР оновлюємо доступні ходи для гравця і передаємо хід
    appState.update(state => {
      // Виправлення: захист від null
      if (state.playerRow === null || state.playerCol === null) return state;
      const newAvailableMoves = getAvailableMoves(state.playerRow, state.playerCol, state.boardSize, state.blockedCells);
      return { ...state, availableMoves: newAvailableMoves, currentPlayer: 1 };
    });

    // 7. ЕТАП 4: Перевірка першого ходу та приховування дошки
    const latestState = get(appState);
    if (latestState.isFirstComputerMovePending) {
      toggleShowBoard();
      appState.update(s => ({ ...s, isFirstComputerMovePending: false }));
    }

    // Озвучування ходу (залишається в кінці)
    const latestSettings = get(settingsStore);
    if (latestSettings.speechEnabled) {
      const langCode = langMap[latestSettings.language] || 'uk-UA';
      speakMove('computer', directionKey, move.distance, langCode, latestSettings.selectedVoiceURI ?? null);
    }
  } else {
    // ... (існуюча логіка, коли у комп'ютера немає ходів)
    const previewScoreDetails = calculateFinalScore({ ...current, finishedByNoMovesButton: true });
    
    modalStore.showModal({
      title: 'У комп\'ютера немає ходів',
      content: {
        reason: 'Комп\'ютер не може зробити хід. Ви можете продовжити гру, очистивши всі заблоковані клітинки, або завершити її зараз і отримати бонусні бали.',
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
          text: `Завершити (+${current.boardSize} балів)`,
          customClass: 'blue-btn',
          onClick: finishGameWithBonus
        }
      ]
    });
    appState.update(s => ({ ...s, currentPlayer: 1 }));
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
 * Продовжує гру, очищуючи всі заблоковані клітинки.
 */
export function continueGameAndClearBlocks() {
  appState.update(state => {
    if (state.playerRow === null || state.playerCol === null) return state;
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
      lastComputerMove: null, // <-- ДОДАНО: Скидаємо останній хід комп'ютера
      computerLastMoveDisplay: null, // <-- ДОДАНО: Очищуємо і його відображення
    };
  });
}

/**
 * Завершує гру, нараховуючи бонусні бали за правильне завершення (окремо від бонусу за "Ходів немає").
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
    title: 'Гру завершено!',
    content: {
      reason: 'Ви вирішили завершити гру і забрати свій рахунок.',
      scoreDetails: finalScoreDetails
    },
    buttons: [
      { text: 'Грати ще раз', primary: true, isHot: true, onClick: resetAndCloseModal, customClass: 'green-btn' },
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
