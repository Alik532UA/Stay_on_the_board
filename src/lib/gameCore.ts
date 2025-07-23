// Чисті функції та константи для ігрової логіки (без залежності від стану)

export type Direction = 'up'|'down'|'left'|'right'|'up-left'|'up-right'|'down-left'|'down-right';
export interface Move {
  row: number;
  col: number;
  direction: Direction;
  distance: number;
}
export interface GameState {
  score: number;
  penaltyPoints: number;
  boardSize: number;
  movesInBlockMode: number;
  jumpedBlockedCells: number;
  finishedByFinishButton: boolean;
  noMovesClaimsCount: number;
}

export function createEmptyBoard(size: number): number[][] {
  return Array.from({ length: size }, () => Array(size).fill(0));
}

export function getRandomCell(size: number): { row: number; col: number } {
  return {
    row: Math.floor(Math.random() * size),
    col: Math.floor(Math.random() * size)
  };
}

export function getAvailableMoves(
  row: number,
  col: number,
  size: number,
  cellVisitCounts: Record<string, number> = {},
  blockOnVisitCount: number = 0
): Move[] {
  if (row === null || col === null) return [];
  const moves: Move[] = [];
  const directions: { dr: number; dc: number; direction: Direction }[] = [
    { dr: -1, dc: 0, direction: 'up' },
    { dr: 1, dc: 0, direction: 'down' },
    { dr: 0, dc: -1, direction: 'left' },
    { dr: 0, dc: 1, direction: 'right' },
    { dr: -1, dc: -1, direction: 'up-left' },
    { dr: -1, dc: 1, direction: 'up-right' },
    { dr: 1, dc: -1, direction: 'down-left' },
    { dr: 1, dc: 1, direction: 'down-right' },
  ];
  const visitMap = cellVisitCounts;
  const isBlocked = (r: number, c: number) => {
    const visitCount = visitMap[`${r}-${c}`] || 0;
    return visitCount > blockOnVisitCount;
  };

  for (const { dr, dc, direction } of directions) {
    for (let dist = 1; dist < size; dist++) {
      const nr = row + dr * dist;
      const nc = col + dc * dist;
      if (nr < 0 || nc < 0 || nr >= size || nc >= size) {
        break;
      }
      if (!isBlocked(nr, nc)) {
        moves.push({ row: nr, col: nc, direction, distance: dist });
      }
    }
  }
  return moves;
}

export const dirMap: Record<Direction, [number, number]> = {
  'up': [-1, 0],
  'down': [1, 0],
  'left': [0, -1],
  'right': [0, 1],
  'up-left': [-1, -1],
  'up-right': [-1, 1],
  'down-left': [1, -1],
  'down-right': [1, 1]
};

export const numToDir: Record<string, Direction> = {
  '1': 'down-left',
  '2': 'down',
  '3': 'down-right',
  '4': 'left',
  '6': 'right',
  '7': 'up-left',
  '8': 'up',
  '9': 'up-right'
};

export const oppositeDirections: Record<Direction, Direction> = {
  'up': 'down',
  'down': 'up',
  'left': 'right',
  'right': 'left',
  'up-left': 'down-right',
  'down-right': 'up-left',
  'up-right': 'down-left',
  'down-left': 'up-right'
};

export interface FinalScore {
  baseScore: number;
  totalPenalty: number;
  sizeBonus: number;
  blockModeBonus: number;
  noMovesBonus: number;
  finishBonus: number; // <-- ДОДАНО
  jumpBonus: number;
  totalScore: number;
}

export function calculateFinalScore(state: GameState): FinalScore {
  const { score, penaltyPoints, boardSize, movesInBlockMode, jumpedBlockedCells } = state;
  
  const baseScore = score;
  const totalPenalty = penaltyPoints;
  // Нова формула sizeBonus: (baseScore + (boardSize*boardSize/100)*baseScore) - baseScore, округлити вниз
  let sizeBonus = 0;
  let percent = 0;
  if (baseScore > 0) {
    percent = (boardSize * boardSize) / 100;
    sizeBonus = Math.round(baseScore * percent);
  }
  const blockModeBonus = movesInBlockMode;
  // noMovesBonus: якщо користувач натиснув "Ходів немає"
  const noMovesBonus = boardSize * (state.noMovesClaimsCount || 0);
  // finishBonus: якщо користувач натиснув "Завершити"
  const finishBonus = state.finishedByFinishButton ? boardSize : 0;
  const jumpBonus = jumpedBlockedCells;

  // Загальний рахунок тепер включає обидва бонуси
  const totalScore = baseScore + sizeBonus + blockModeBonus + jumpBonus - totalPenalty + noMovesBonus + finishBonus;

  console.log('[calculateFinalScore]', { baseScore, boardSize, percent, sizeBonus, blockModeBonus, jumpBonus, totalPenalty, noMovesBonus, finishBonus, totalScore });
  
  return {
    baseScore,
    totalPenalty,
    sizeBonus,
    blockModeBonus,
    jumpBonus,
    noMovesBonus,
    // finishBonus переносимо в кінець
    totalScore,
    finishBonus
  };
} 

/**
 * Підраховує кількість заблокованих клітинок, через які "перестрибнув" хід.
 * @param {number} startRow - Початковий рядок.
 * @param {number} startCol - Початковий стовпець.
 * @param {number} endRow - Кінцевий рядок.
 * @param {number} endCol - Кінцевий стовпець.
 * @param {Record<string, number>} cellVisitCounts - Карта відвіданих клітинок.
 * @param {number} blockOnVisitCount - Лічильник, після якого клітинка вважається заблокованою.
 * @returns {number} Кількість перестрибнутих заблокованих клітинок.
 */
export function countJumpedCells(
  startRow: number,
  startCol: number,
  endRow: number,
  endCol: number,
  cellVisitCounts: Record<string, number>,
  blockOnVisitCount: number
): number {
  let jumpedCount = 0;
  const dr = Math.sign(endRow - startRow);
  const dc = Math.sign(endCol - startCol);
  const distance = Math.max(Math.abs(endRow - startRow), Math.abs(endCol - startCol));

  // Ітеруємо по всіх клітинках на шляху, не включаючи кінцеву
  for (let i = 1; i < distance; i++) {
    const currentRow = startRow + i * dr;
    const currentCol = startCol + i * dc;
    const visitCount = cellVisitCounts[`${currentRow}-${currentCol}`] || 0;
    if (visitCount > blockOnVisitCount) {
      jumpedCount++;
    }
  }
  return jumpedCount;
} 