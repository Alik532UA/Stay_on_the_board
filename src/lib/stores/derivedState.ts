// src/lib/stores/derivedState.ts
import { derived } from 'svelte/store';
import { gameState } from './gameState';
import { settingsStore } from './settingsStore';
import { languages } from '$lib/constants';
import { animationStore } from './animationStore';
import { availableMovesService } from '$lib/services/availableMovesService';

/**
 * @private
 * Допоміжна функція для розбиття масиву на частини.
 * @param {T[]} arr
 * @param {number} n
 * @returns {T[][]}
 * @template T
 */
function chunk<T>(arr: T[], n: number): T[][] {
  const res = [];
  for (let i = 0; i < arr.length; i += n) res.push(arr.slice(i, i + n));
  return res;
}

/**
 * @typedef {import('$lib/utils/gameUtils').Direction} Direction
 * @typedef {object} ComputerMove
 * @property {Direction} direction
 * @property {number} distance
 */

/**
 * Derived store, що завжди містить останній хід комп'ютера.
 * @type {import('svelte/store').Readable<ComputerMove | null>}
 */
export const lastComputerMove = derived(
  gameState,
  ($gameState) => {
    if (!$gameState || !$gameState.lastMove) {
      return null;
    }
    const { lastMove } = $gameState;
    if (lastMove && $gameState.players[lastMove.player]?.type === 'ai') {
      return {
        direction: lastMove.direction,
        distance: lastMove.distance
      };
    }
    return null;
  }
);

/**
 * Derived стор, що визначає, чи заблокована кнопка підтвердження ходу.
 * @type {import('svelte/store').Readable<boolean>}
 */
export const isConfirmButtonDisabled = derived(
  [gameState],
  ([$gameState]) => {
    if (!$gameState) return true;
    const isPlayerTurn = $gameState.players[$gameState.currentPlayerIndex]?.type === 'human';
    const { selectedDirection, selectedDistance, isComputerMoveInProgress } = $gameState;

    return !isPlayerTurn || isComputerMoveInProgress || !selectedDirection || !selectedDistance;
  }
);

/**
 * Визначає, чи зараз хід гравця (людини).
 * @type {import('svelte/store').Readable<boolean>}
 */
export const isPlayerTurn = derived(gameState, $gameState =>
  $gameState ? $gameState.players[$gameState.currentPlayerIndex]?.type === 'human' : false
);

/**
 * Реактивно обчислює доступні ходи на основі поточного стану гри.
 * @type {import('svelte/store').Readable<import('$lib/services/gameLogicService').Move[]>}
 */
export const availableMoves = derived(
  [gameState],
  ([$gameState]) => {
    if (!$gameState) return [];
    // availableMovesService залежить від gameState, тому виклик getAvailableMoves() завжди актуальний
    return availableMovesService.getAvailableMoves();
  }
);

/**
 * Отримує колір попереднього гравця в локальній грі.
 * @type {import('svelte/store').Readable<string | null>}
 */
export const previousPlayerColor = derived(
  [gameState],
  ([$gameState]) => {
    if (!$gameState) return null;

    const currentPlayerIndex = $gameState.currentPlayerIndex;
    const playersCount = $gameState.players.length;
    if (playersCount === 0) return null;

    const previousPlayerIndex = (currentPlayerIndex + playersCount - 1) % playersCount;
    const previousPlayer = $gameState.players[previousPlayerIndex];
    
    return previousPlayer?.color || null;
  }
);

/**
 * Обчислює масив доступних відстаней для поточного розміру дошки.
 * @type {import('svelte/store').Readable<number[]>}
 */
export const availableDistances = derived(gameState, $gameState =>
  $gameState ? Array.from({ length: $gameState.boardSize - 1 }, (_, i) => i + 1) : []
);

/**
 * Розбиває кнопки відстаней на рядки для адаптивного відображення.
 * @type {import('svelte/store').Readable<number[][]>}
 */
export const distanceRows = derived(availableDistances, $availableDistances => {
  const dists = $availableDistances;
  if (dists.length <= 4) return [dists];
  if (dists.length === 5) return [dists.slice(0, 3), dists.slice(3)];
  if (dists.length === 6) return [dists.slice(0, 3), dists.slice(3)];
  if (dists.length === 7) return [dists.slice(0, 4), dists.slice(4)];
  if (dists.length === 8) return [dists.slice(0, 4), dists.slice(4)];
  return chunk(dists, 4);
});

/**
 * Derived стор, що містить SVG поточного вибраного прапора.
 * @type {import('svelte/store').Readable<string>}
 */
export const currentLanguageFlagSvg = derived(
  settingsStore,
  $settingsStore => {
    return languages.find(lang => lang.code === $settingsStore.language)?.svg || languages[0].svg;
  }
);

/**
 * Derived store, що містить дані поточного гравця.
 * @type {import('svelte/store').Readable<import('./gameState').Player | null>}
 */
export const currentPlayer = derived(
  [gameState],
  ([$gameState]) => {
    if (!$gameState) return null;
    return $gameState.players[$gameState.currentPlayerIndex];
  }
);

/**
 * Обчислює колір поточного гравця для локальної гри.
 * @type {import('svelte/store').Readable<string | null>}
 */
export const currentPlayerColor = derived(
  [gameState],
  ([$gameState]) => {
    if (!$gameState) return null;
    const currentPlayerIndex = $gameState.currentPlayerIndex;
    const currentPlayer = $gameState.players[currentPlayerIndex];
    return currentPlayer?.color || null;
  }
);

// ===== НОВІ DERIVED STORES ДЛЯ ВІЗУАЛЬНИХ ДАНИХ =====

/**
 * Візуальна позиція ферзя з анімаційною затримкою.
 * Показує проміжні стани під час ходів для кращого UX.
 * @type {import('svelte/store').Readable<{row: number|null, col: number|null}>}
 */
export const visualPosition = derived(
  [gameState, animationStore],
  ([$gameState, $animationStore]) => {
    if (!$gameState) return { row: null, col: null };
    if ($animationStore.visualMoveQueue && $animationStore.visualMoveQueue.length > 0) {
      const lastAnimatedMove = $animationStore.visualMoveQueue[$animationStore.visualMoveQueue.length - 1];
      return {
        row: lastAnimatedMove.to?.row ?? $gameState.playerRow,
        col: lastAnimatedMove.to?.col ?? $gameState.playerCol
      };
    }
    return {
      row: $gameState.playerRow,
      col: $gameState.playerCol
    };
  }
);

/**
 * Візуальні лічильники відвідувань клітин, синхронізовані з анімацією.
 * Обчислює стан "пошкодження" клітинок на основі того, що гравець бачить на екрані.
 * @type {import('svelte/store').Readable<Record<string, number>>}
 */
export const visualCellVisitCounts = derived(
  [visualPosition, gameState, animationStore],
  ([$visualPosition, $gameState, $animationStore]) => {
    if (!$gameState) return {};
    if (!$animationStore.isAnimating) {
      return $gameState.cellVisitCounts;
    }

    if (!$visualPosition || $visualPosition.row === null || $visualPosition.col === null) {
      return $gameState.moveHistory[0]?.visits || {};
    }

    const relevantHistoryEntry = [...$gameState.moveHistory].reverse().find(entry =>
      entry.pos.row === $visualPosition.row && entry.pos.col === $visualPosition.col
    );

    if (relevantHistoryEntry && relevantHistoryEntry.visits) {
      return relevantHistoryEntry.visits;
    }

    return $gameState.moveHistory[$gameState.moveHistory.length - 1]?.visits || {};
  }
);

/**
 * Візуальний стан дошки (комбінує логічні дані з візуальними прапорцями).
 * Централізований derived store для всіх візуальних даних дошки.
 * @type {import('svelte/store').Readable<any>}
 */
export const visualBoardState = derived(
  [gameState, animationStore],
  ([$gameState, $animationStore]) => {
    if (!$gameState) {
      return {
        position: { row: null, col: null },
        cellVisitCounts: {},
        availableMoves: [],
        board: [],
        boardSize: 0,
        isAnimating: false,
        isGameOver: false,
        currentPlayerIndex: 0
      };
    }
    return {
      position: {
        row: $gameState.playerRow,
        col: $gameState.playerCol
      },
      cellVisitCounts: $gameState.cellVisitCounts,
      availableMoves: $gameState.availableMoves,
      board: $gameState.board,
      boardSize: $gameState.boardSize,
      isAnimating: $animationStore.isAnimating,
      isGameOver: $gameState.isGameOver,
      currentPlayerIndex: $gameState.currentPlayerIndex
    };
  }
);

/**
 * Derived store, що завжди містить останній хід гравця.
 * @type {import('svelte/store').Readable<ComputerMove | null>}
 */
export const lastPlayerMove = derived(
  gameState,
  ($gameState) => {
    if (!$gameState || !$gameState.lastMove) {
      return null;
    }
    const { lastMove } = $gameState;
    if (lastMove && $gameState.players[lastMove.player]?.type === 'human') {
      return {
        direction: lastMove.direction,
        distance: lastMove.distance
      };
    }
    return null;
  }
);

/**
 * Визначає, чи є пауза між ходами (наприклад, для анімації).
 * @type {import('svelte/store').Readable<boolean>}
 */
export const isPauseBetweenMoves = derived(
  animationStore,
  $animationStore => $animationStore.isAnimating && $animationStore.animationQueue.length === 0
);
