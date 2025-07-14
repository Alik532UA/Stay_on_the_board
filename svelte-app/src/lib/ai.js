/**
 * @typedef {{row: number, col: number}} Cell
 * @typedef {{row: number, col: number, direction: string, distance: number}} Move
 */

/**
 * Повертає всі валідні ходи для фігури на дошці
 * @param {number[][]} board
 * @param {Cell[]} blockedCells
 * @param {number} boardSize
 * @returns {Move[]}
 */
export function getAllValidMoves(board, blockedCells, boardSize) {
  const directions = [
    { dr: -1, dc: -1, dir: '7' }, { dr: -1, dc: 0, dir: '8' }, { dr: -1, dc: 1, dir: '9' },
    { dr: 0, dc: -1, dir: '4' }, { dr: 0, dc: 1, dir: '6' },
    { dr: 1, dc: -1, dir: '1' }, { dr: 1, dc: 0, dir: '2' }, { dr: 1, dc: 1, dir: '3' }
  ];
  // Знаходимо фігуру (1)
  let piece = null;
  for (let r = 0; r < boardSize; r++) {
    for (let c = 0; c < boardSize; c++) {
      if (board[r][c] === 1) piece = { row: r, col: c };
    }
  }
  if (!piece) return [];
  const moves = [];
  for (const { dr, dc, dir } of directions) {
    for (let dist = 1; dist < boardSize; dist++) {
      const nr = piece.row + dr * dist;
      const nc = piece.col + dc * dist;
      if (nr < 0 || nc < 0 || nr >= boardSize || nc >= boardSize) break;
      if (blockedCells.some(cell => cell.row === nr && cell.col === nc)) break;
      moves.push({ row: nr, col: nc, direction: dir, distance: dist });
    }
  }
  return moves;
}

/**
 * Повертає випадковий валідний хід для комп'ютера
 * @param {number[][]} board
 * @param {Cell[]} blockedCells
 * @param {number} boardSize
 * @returns {Move|null}
 */
export function getRandomComputerMove(board, blockedCells, boardSize) {
  const moves = getAllValidMoves(board, blockedCells, boardSize);
  if (!moves.length) return null;
  return moves[Math.floor(Math.random() * moves.length)];
} 