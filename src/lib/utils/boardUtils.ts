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
 * Розраховує доступні ходи для ферзя з заданої позиції
 */

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

export function getMovePath(
  start: { row: number; col: number },
  end: { row: number; col: number }
): { row: number; col: number }[] {
  const path = [];
  let { row, col } = start;
  const { row: endRow, col: endCol } = end;

  const rowStep = Math.sign(endRow - row);
  const colStep = Math.sign(endCol - col);

  while (row !== endRow || col !== endCol) {
    row += rowStep;
    col += colStep;
    if (row !== endRow || col !== endCol) {
      path.push({ row, col });
    }
  }

  return path;
} 
