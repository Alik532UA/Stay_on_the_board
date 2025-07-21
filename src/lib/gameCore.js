// Чисті функції та константи для ігрової логіки (без залежності від стану)

/**
 * @param {number} size
 */
export function createEmptyBoard(size) {
  return Array.from({ length: size }, () => Array(size).fill(0));
}

/**
 * @param {number} size
 */
export function getRandomCell(size) {
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
export function getAvailableMoves(row, col, size, cellVisitCounts = {}, blockOnVisitCount = 0) {
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
      if (nr < 0 || nc < 0 || nr >= size || nc >= size) {
        break;
      }
      if (!isBlocked(nr, nc)) {
        moves.push({ row: nr, col: nc });
      }
    }
  }
  return moves;
}

/** @type {Record<import('./stores/gameStore').Direction, [number, number]>} */
export const dirMap = {
  'up': [-1, 0],
  'down': [1, 0],
  'left': [0, -1],
  'right': [0, 1],
  'up-left': [-1, -1],
  'up-right': [-1, 1],
  'down-left': [1, -1],
  'down-right': [1, 1]
};

/** @type {Record<string, import('./stores/gameStore').Direction>} */
export const numToDir = {
  '1': 'down-left',
  '2': 'down',
  '3': 'down-right',
  '4': 'left',
  '6': 'right',
  '7': 'up-left',
  '8': 'up',
  '9': 'up-right'
};

/** @type {Record<import('./stores/gameStore').Direction, import('./stores/gameStore').Direction>} */
export const oppositeDirections = {
  'up': 'down',
  'down': 'up',
  'left': 'right',
  'right': 'left',
  'up-left': 'down-right',
  'down-right': 'up-left',
  'up-right': 'down-left',
  'down-left': 'up-right'
};

/**
 * Розрахунок фінального рахунку
 * @param {import('./stores/gameStore').AppState} state
 * @returns {{ baseScore: number, totalPenalty: number, sizeBonus: number, blockModeBonus: number, noMovesBonus: number, jumpBonus: number, totalScore: number }}
 */
export function calculateFinalScore(state) {
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