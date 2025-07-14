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
  console.log('[getAllValidMoves] Function called', {
    boardSize,
    blockedCellsCount: blockedCells.length
  });
  
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
  
  console.log('[getAllValidMoves] Piece found:', piece);
  
  if (!piece) {
    console.log('[getAllValidMoves] No piece found on board');
    return [];
  }
  
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
  
  console.log('[getAllValidMoves] Generated moves:', moves);
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
  console.log('[getRandomComputerMove] Function called', {
    boardSize,
    blockedCellsCount: blockedCells.length
  });
  
  const moves = getAllValidMoves(board, blockedCells, boardSize);
  
  console.log('[getRandomComputerMove] Available moves:', moves);
  
  if (!moves.length) {
    console.log('[getRandomComputerMove] No valid moves available');
    return null;
  }
  
  const selectedMove = moves[Math.floor(Math.random() * moves.length)];
  console.log('[getRandomComputerMove] Selected move:', selectedMove);
  
  return selectedMove;
} 