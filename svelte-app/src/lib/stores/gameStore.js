import { writable, derived } from 'svelte/store';
import { getRandomComputerMove } from '$lib/ai.js';
import { get } from 'svelte/store';
import { modalStore } from './modalStore.js';
import { closeModal } from './modalStore.js';
import { speakMove, langMap } from '$lib/speech.js';

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
 * @property {string|null|undefined} selectedDirection
 * @property {number|null|undefined} selectedDistance
 * @property {number[]} availableDistances
 * @property {number} currentPlayer
 * @property {{direction:string, distance:number}|null|undefined} lastMove
 * @property {{direction:string, distance:number}|null|undefined} computerLastMoveDisplay
 * @property {boolean} distanceManuallySelected
 * @property {{row: number, col: number}[]} visitedCells
 * @property {boolean} isGameOver
 * @property {number} score
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
  gameId: 0,
});

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
      availableMoves: getAvailableMoves(row, col, newSize, []),
      blockModeEnabled: state.blockModeEnabled,
      distanceManuallySelected: false,
      currentView: state.currentView,
      gameMode: state.gameMode,
      language: state.language,
      theme: state.theme,
      style: state.style,
      settings: { ...state.settings },
      selectedDirection: null,
      selectedDistance: null,
      availableDistances: [1,2],
      currentPlayer: 1,
      lastMove: null,
      computerLastMoveDisplay: null,
      lastComputerMove: null,
      score: 0,
      isGameOver: false,
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
        lastMove: (direction && distance) ? { direction, distance } : null,
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
      gameId: state.gameId + 1,
      board,
      playerRow: row,
      playerCol: col,
      blockedCells: [],
      availableMoves: getAvailableMoves(row, col, boardSize, []),
      visitedCells: [],
      currentView: state.currentView,
      boardSize: state.boardSize,
      gameMode: state.gameMode,
      language: state.language,
      theme: state.theme,
      style: state.style,
      settings: { ...state.settings },
      blockModeEnabled: state.blockModeEnabled,
      selectedDirection: null,
      selectedDistance: null,
      distanceManuallySelected: false,
      currentPlayer: 1,
      lastMove: null,
      computerLastMoveDisplay: null,
      lastComputerMove: null,
      score: 0,
      movesInBlockMode: 0, // Скидаємо
      jumpedBlockedCells: 0, // Скидаємо
      penaltyPoints: 0,
      finishedByNoMovesButton: false, // Скидаємо
      isGameOver: false,
    };
  });
}

/**
 * Розраховує фінальний рахунок з усіма бонусами.
 * @param {object} state - Поточний стан гри ($appState).
 * @returns {{baseScore: number, sizeBonus: number, blockModeBonus: number, noMovesBonus: number, jumpBonus: number, totalScore: number}}
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
        // Отримуємо всі основні оновлення стану від нашого хелпера
        const moveUpdates = performMove(state, move.row, move.col);

        // КЛЮЧОВЕ: уніфікуємо напрямок
        const directionKey = numToDir[move.direction] || move.direction;

        const newState = {
          ...state,
          ...moveUpdates, // Застосовуємо оновлення
          currentPlayer: 1, // Хід повертається до гравця
          lastMove: null,
          computerLastMoveDisplay: { direction: directionKey, distance: move.distance },
          lastComputerMove: { direction: directionKey, distance: move.distance }, // **НОВЕ**
        };
        // Блок перевірки на availableMoves.length === 0 ВИДАЛЕНО
        return newState;
      });
      // Озвучування також використовує directionKey
      const currentSettings = current.settings;
      if (currentSettings.speechEnabled) {
        const langCode = langMap[currentSettings.language] || 'uk-UA';
        speakMove('computer', directionKey, move.distance, langCode, currentSettings.selectedVoiceURI);
      }
    } else {
      console.log('[makeComputerMove] No valid moves available for computer. Player wins!');
      appState.update(state => ({ ...state, isGameOver: true }));
      modalStore.showModal({
        title: 'Перемога!',
        content: 'Комп\'ютер не може зробити хід. Ви перемогли!',
        buttons: [{ text: 'Грати ще раз', primary: true, onClick: resetAndCloseModal }]
      });
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
      // Гравець має вибрати інший напрямок, щоб скинути цей стан.
      if (distanceManuallySelected) {
        newDistance = selectedDistance;
        newManuallySelected = true;
      } 
      // Якщо вибір не був ручним, застосовуємо логіку інкременту.
      else {
        // Якщо відстань не встановлена або досягла максимуму, скидаємо на 1.
        if (selectedDistance === null || selectedDistance >= maxDist) {
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
      selectedDirection: dir,
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
    lastComputerMove, // **НОВЕ**
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
  // --- НОВИЙ КОД: штраф за зворотний хід ---
  let scoreChange = 1;
  let penaltyApplied = 0;
  // **ОНОВЛЕНА ПЕРЕВІРКА ШТРАФУ**
  if (
    lastComputerMove &&
    selectedDistance === lastComputerMove.distance &&
    selectedDirection === oppositeDirections[lastComputerMove.direction]
  ) {
    // scoreChange = -2; // Цей рядок видалено згідно нової логіки
    penaltyApplied = 2;
    console.log('[confirmMove] Penalty applied for reverse move.');
  }
  // --- КІНЕЦЬ НОВОГО КОДУ ---
  if (isOutsideBoard || isCellBlocked) {
    const reason = isOutsideBoard ? 'Ви вийшли за межі дошки.' : 'Ви спробували стати на заблоковану клітинку.';
    const finalScoreDetails = calculateFinalScore(state);
    appState.update(s => ({ ...s, isGameOver: true, score: finalScoreDetails.totalScore }));
    modalStore.showModal({
      title: 'Гру завершено!',
      content: { reason: reason, scoreDetails: finalScoreDetails },
      buttons: [{ text: 'Грати ще раз', primary: true, onClick: resetAndCloseModal }]
    });
    return;
  }
  appState.update(s => {
    const moveUpdates = performMove(s, newRow, newCol);
    return {
      ...s,
      ...moveUpdates,
      score: s.score + scoreChange, // Збільшуємо базовий рахунок на 1 за кожен успішний хід
      penaltyPoints: s.penaltyPoints + penaltyApplied,
      movesInBlockMode: blockModeEnabled ? s.movesInBlockMode + 1 : s.movesInBlockMode,
      jumpedBlockedCells: s.jumpedBlockedCells + jumpedCount,
      selectedDirection: null,
      selectedDistance: null,
      distanceManuallySelected: false,
      currentPlayer: 2,
      lastMove: null,
      computerLastMoveDisplay: null,
    };
  });
  // speakMove видалено з confirmMove
  if (state.gameMode === 'vsComputer') {
    makeComputerMove();
  }
}
/**
 * Продовжує гру, очищуючи всі заблоковані клітинки.
 */
export function continueGameAndClearBlocks() {
  appState.update(state => {
    // Очищуємо заблоковані клітинки
    const newBlockedCells = [];
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
 * Завершує гру, нараховуючи бонусні бали.
 */
export function finishGameWithBonus() {
  appState.update(s => ({ ...s, finishedByNoMovesButton: true }));
  const state = get(appState);
  const finalScoreDetails = calculateFinalScore(state);
  appState.update(s => ({ ...s, isGameOver: true, score: finalScoreDetails.totalScore }));
  modalStore.showModal({
    title: 'Гру завершено!',
    content: {
      reason: 'Ви вирішили завершити гру та забрати бонус.',
      scoreDetails: finalScoreDetails
    },
    buttons: [
      { text: 'Грати ще раз', primary: true, onClick: resetAndCloseModal }
    ]
  });
}

export function noMoves() {
  const state = get(appState);

  // Перевірка, чи дійсно немає ходів
  if (state.availableMoves.length === 0) {
    // Ходів дійсно немає. Показуємо модальне вікно з вибором.
    modalStore.showModal({
      title: 'Ходів немає. Що робити далі?',
      content: 'Ви можете очистити поле і продовжити гру, або завершити її зараз і отримати бонусні бали.',
      buttons: [
        {
          text: `Продовжити`,
          onClick: continueGameAndClearBlocks
        },
        {
          text: `Завершити (+${state.boardSize} балів)`,
          primary: true,
          onClick: finishGameWithBonus
        }
      ]
    });
  } else {
    // Ходи є. Показуємо інформаційне повідомлення.
    modalStore.showModal({
      title: 'Увага!',
      content: `У вас ще є доступні ходи (${state.availableMoves.length} шт.).`,
      buttons: [{ text: 'OK', primary: true, onClick: closeModal }]
    });
  }
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