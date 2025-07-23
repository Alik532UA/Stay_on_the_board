import { describe, it, expect } from 'vitest';
import {
  createEmptyBoard,
  getRandomCell,
  getAvailableMoves,
  calculateFinalScore,
  countJumpedCells
} from './gameCore';

// createEmptyBoard(size)
describe('createEmptyBoard', () => {
  it('створює дошку правильного розміру, заповнену нулями', () => {
    const size = 4;
    const board = createEmptyBoard(size);
    expect(board.length).toBe(size);
    expect(board.every(row => row.length === size)).toBe(true);
    expect(board.flat().every(cell => cell === 0)).toBe(true);
  });
});

// getRandomCell(size)
describe('getRandomCell', () => {
  it('повертає координати в межах дошки', () => {
    const size = 5;
    for (let i = 0; i < 20; i++) {
      const { row, col } = getRandomCell(size);
      expect(row).toBeGreaterThanOrEqual(0);
      expect(row).toBeLessThan(size);
      expect(col).toBeGreaterThanOrEqual(0);
      expect(col).toBeLessThan(size);
    }
  });
});

// getAvailableMoves(...)
describe('getAvailableMoves', () => {
  it('повертає всі доступні ходи з центру дошки 3x3', () => {
    const size = 3;
    const moves = getAvailableMoves(1, 1, size, {}, 0);
    expect(moves.length).toBeGreaterThan(0);
  });

  it('повертає правильні ходи з кута дошки', () => {
    const size = 3;
    const moves = getAvailableMoves(0, 0, size, {}, 0);
    expect(moves.length).toBeGreaterThan(0);
  });

  it('враховує заблоковані клітинки (cellVisitCounts)', () => {
    const size = 3;
    const cellVisitCounts = { '1-2': 1 };
    const moves = getAvailableMoves(1, 1, size, cellVisitCounts, 0);
    expect(moves.some(move => move.row === 1 && move.col === 2)).toBe(false);
  });
});

// calculateFinalScore(...)
describe('calculateFinalScore', () => {
  it('правильно рахує бали без бонусів', () => {
    const state = { score: 10, penaltyPoints: 0, boardSize: 3, movesInBlockMode: 0, finishedByNoMovesButton: false, jumpedBlockedCells: 0, finishedByFinishButton: false, noMovesClaimsCount: 0 };
    const result = calculateFinalScore(state);
    expect(result.totalScore).toBe(10);
  });

  it('правильно рахує бали з бонусами', () => {
    const state = { score: 10, penaltyPoints: 0, boardSize: 5, movesInBlockMode: 2, finishedByNoMovesButton: true, jumpedBlockedCells: 3, finishedByFinishButton: false, noMovesClaimsCount: 0 };
    const result = calculateFinalScore(state);
    expect(result.totalScore).toBeGreaterThan(10);
  });
});

// countJumpedCells(...)
describe('countJumpedCells', () => {
  it('повертає 0, якщо на шляху немає заблокованих клітинок', () => {
    const cellVisitCounts = { '1-1': 0, '2-2': 0 };
    const result = countJumpedCells(0, 0, 3, 3, cellVisitCounts, 0);
    expect(result).toBe(0);
  });

  it('рахує заблоковані клітинки на шляху', () => {
    const cellVisitCounts = { '1-1': 2, '2-2': 1 };
    const result = countJumpedCells(0, 0, 3, 3, cellVisitCounts, 0);
    expect(result).toBe(1); // тільки '1-1' заблокована
  });

  it('ігнорує кінцеву клітинку', () => {
    const cellVisitCounts = { '1-1': 2, '2-2': 2, '3-3': 2 };
    const result = countJumpedCells(0, 0, 3, 3, cellVisitCounts, 1);
    expect(result).toBe(2); // '1-1' і '2-2' заблоковані, '3-3' не враховується
  });

  it('працює для горизонтального руху', () => {
    const cellVisitCounts = { '0-1': 2, '0-2': 0 };
    const result = countJumpedCells(0, 0, 0, 3, cellVisitCounts, 1);
    expect(result).toBe(1); // тільки '0-1' заблокована
  });
}); 