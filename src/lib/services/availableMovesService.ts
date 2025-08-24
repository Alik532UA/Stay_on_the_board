// src/lib/services/availableMovesService.ts
import { get } from 'svelte/store';
import { gameState } from '$lib/stores/gameState';
import { settingsStore } from '$lib/stores/settingsStore';
import { Figure, MoveDirection } from '$lib/models/Figure';
import { isCellBlocked } from '$lib/utils/boardUtils';

export const availableMovesService = {
  getAvailableMoves() {
    const state = get(gameState);
    if (!state || state.playerRow === null || state.playerCol === null) {
      return [];
    }

    const settings = get(settingsStore);
    const { playerRow, playerCol, boardSize, cellVisitCounts } = state;
    const availableMoves = [];
    const figure = new Figure(playerRow, playerCol, boardSize);

    for (const direction of Object.values(MoveDirection)) {
      for (let distance = 1; distance < boardSize; distance++) {
        const newPosition = figure.calculateNewPosition(direction, distance);

        if (!figure.isValidPosition(newPosition.row, newPosition.col)) {
          break;
        }

        if (isCellBlocked(newPosition.row, newPosition.col, cellVisitCounts, settings)) {
          // Важливо: Не перериваємо цикл (`break`), а продовжуємо (`continue`).
          // Це дозволяє фігурі "перестрибувати" через зайняті клітинки,
          // аналізуючи всі можливі ходи в поточному напрямку до краю дошки.
          continue;
        }

        availableMoves.push({
          direction,
          distance,
          row: newPosition.row,
          col: newPosition.col,
        });
      }
    }
    return availableMoves;
  }
};