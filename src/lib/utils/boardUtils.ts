// src/lib/utils/boardUtils.ts

import { logService } from '$lib/services/logService';
import type { Direction, Move } from '$lib/utils/gameUtils';

/**
 * Тип для налаштувань гри
 */
type SettingsState = {
  blockModeEnabled: boolean;
  blockOnVisitCount: number;
};

/**
 * Створює порожню дошку заданого розміру
 * @param size - розмір дошки (N x N)
 * @returns двовимірний масив, заповнений нулями
 */
export function createEmptyBoard(size: number): number[][] {
  return Array.from({ length: size }, () => Array(size).fill(0));
}

/**
 * Генерує випадкову позицію на дошці
 * @param size - розмір дошки
 * @returns об'єкт з координатами
 */
export function getRandomCell(size: number): { row: number; col: number } {
  return {
    row: Math.floor(Math.random() * size),
    col: Math.floor(Math.random() * size)
  };
}

/**
 * Розраховує доступні ходи для ферзя з заданої позиції
 */
export function getAvailableMoves(
  row: number | null,
  col: number | null,
  size: number,
  cellVisitCounts: Record<string, number> = {},
  blockOnVisitCount: number = 0,
  board: number[][] | undefined,
  blockModeEnabled: boolean, // <-- Новий параметр
  lastPlayerMove: { direction: string, distance: number } | null
): Move[] {
  if (row === null || col === null) {
    logService.logic('getAvailableMoves: Початкові координати не задані, ходів немає.');
    return [];
  }

  logService.logic(`getAvailableMoves: Початок розрахунку для позиції (${row}, ${col})`, {
    size,
    cellVisitCounts,
    blockModeEnabled,
    blockOnVisitCount
  });

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
  
  const isOccupied = (r: number, c: number) => {
    if (!board) return false;
    return board[r] && board[r][c] !== 0;
  };

  for (const { dr, dc, direction } of directions) {
    for (let dist = 1; dist < size; dist++) {
      const nr = row + dr * dist;
      const nc = col + dc * dist;
      if (nr < 0 || nc < 0 || nr >= size || nc >= size) {
        logService.logic(`  [${direction}]: Вихід за межі дошки на відстані ${dist}.`);
        break;
      }

      const blocked = isCellBlocked(nr, nc, cellVisitCounts, { blockModeEnabled, blockOnVisitCount });
      
      if (!blocked) {
        let isPenalty = false;
        if (lastPlayerMove && !blockModeEnabled) {
          isPenalty = isMirrorMove(direction, dist, lastPlayerMove.direction, lastPlayerMove.distance);
        }
        logService.logic(`  [${direction}]: Знайдено доступний хід на (${nr}, ${nc}), відстань ${dist}.`);
        moves.push({ row: nr, col: nc, direction, distance: dist, isPenalty });
      } else {
        logService.logic(`  [${direction}]: Клітинка (${nr}, ${nc}) заблокована. Продовжуємо пошук в цьому напрямку.`);
        // Не перериваємо цикл, а продовжуємо шукати доступні клітинки далі
      }
    }
  }
  logService.logic(`getAvailableMoves: Розрахунок завершено. Знайдено ходів: ${moves.length}`, moves);
  return moves;
}

/**
 * Перевіряє чи є хід "дзеркальним" відносно попереднього ходу комп'ютера
 * @param currentDirection - напрямок поточного ходу гравця
 * @param currentDistance - відстань поточного ходу гравця
 * @param computerDirection - напрямок попереднього ходу комп'ютера
 * @param computerDistance - відстань попереднього ходу комп'ютера
 * @returns true якщо хід є "дзеркальним"
 */
export function isMirrorMove(
  currentDirection: string,
  currentDistance: number,
  computerDirection: string,
  computerDistance: number
): boolean {
  // Визначаємо протилежні напрямки
  const oppositeDirections: Record<string, string> = {
    'up': 'down',
    'down': 'up',
    'left': 'right',
    'right': 'left',
    'up-left': 'down-right',
    'up-right': 'down-left',
    'down-left': 'up-right',
    'down-right': 'up-left'
  };

  const isOpposite = oppositeDirections[currentDirection] === computerDirection;

  // Перевіряємо чи поточний хід у протилежному напрямку
  if (!isOpposite) {
    return false;
  }

  // Перевіряємо чи відстань гравця менша або дорівнює відстані комп'ютера
  return currentDistance <= computerDistance;
}

/**
 * Визначає, чи є клітинка заблокованою на основі кількості відвідувань.
 */
export function isCellBlocked(row: number, col: number, cellVisitCounts: Record<string, number>, settings: SettingsState): boolean {
  const visitCount = cellVisitCounts[`${row}-${col}`] || 0;
  return settings.blockModeEnabled && visitCount > settings.blockOnVisitCount;
}

/**
 * Повертає CSS-клас "пошкодження" для клітинки.
 */
export function getDamageClass(row: number, col: number, cellVisitCounts: Record<string, number>, settings: SettingsState): string {
  if (!settings.blockModeEnabled || settings.blockOnVisitCount === 0) return '';
  const visitCount = cellVisitCounts[`${row}-${col}`] || 0;
  if (visitCount > 0 && visitCount <= settings.blockOnVisitCount) {
    return `cell-damage-${visitCount}`;
  }
  return '';
} 