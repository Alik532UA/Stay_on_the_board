// src/lib/utils/initialPositionUtils.ts
import type { TestModeState } from '$lib/stores/testModeStore';

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
 * Визначає початкову позицію на дошці, враховуючи налаштування тестового режиму.
 * @param size - Розмір дошки.
 * @param testModeState - Поточний стан тестового режиму.
 * @returns Об'єкт з координатами { row, col }.
 */
export function getInitialPosition(
  size: number,
  testModeState: TestModeState
): { row: number; col: number } {
  if (
    testModeState.isEnabled &&
    testModeState.startPositionMode === 'manual' &&
    testModeState.manualStartPosition
  ) {
    return { row: testModeState.manualStartPosition.y, col: testModeState.manualStartPosition.x };
  }
  if (testModeState.isEnabled && testModeState.startPositionMode === 'predictable') {
    return { row: 0, col: 0 };
  }
  return getRandomCell(size);
}