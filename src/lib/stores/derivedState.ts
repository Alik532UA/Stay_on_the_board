// src/lib/stores/derivedState.ts
import { derived } from 'svelte/store';
import { boardStore } from './boardStore';
import { playerStore } from './playerStore';
import { uiStateStore } from './uiStateStore';
import { appSettingsStore } from './appSettingsStore';
import { timerStore } from './timerStore';
import { languages } from '$lib/constants';
import { animationStore } from './animationStore';
import { availableMovesStore } from './availableMovesStore';
import { logService } from '$lib/services/logService';

function chunk<T>(arr: T[], n: number): T[][] {
  const res = [];
  for (let i = 0; i < arr.length; i += n) res.push(arr.slice(i, i + n));
  return res;
}

export const lastComputerMove = derived(
  [boardStore, playerStore],
  ([$boardStore, $playerStore]) => {
    if (!$boardStore || !$playerStore || $boardStore.moveQueue.length === 0) return null;
    const lastMove = $boardStore.moveQueue[$boardStore.moveQueue.length - 1];
    if (lastMove && $playerStore.players[lastMove.player - 1]?.type === 'ai') {
      return {
        direction: lastMove.direction,
        distance: lastMove.distance
      };
    }
    return null;
  }
);

export const lastPlayerMove = derived(
  [boardStore, playerStore],
  ([$boardStore, $playerStore]) => {
    if (!$boardStore || !$playerStore || $boardStore.moveQueue.length === 0) return null;
    const lastMove = $boardStore.moveQueue[$boardStore.moveQueue.length - 1];
    if (lastMove && $playerStore.players[lastMove.player - 1]?.type === 'human') {
      return {
        direction: lastMove.direction,
        distance: lastMove.distance
      };
    }
    return null;
  }
);

export const isConfirmButtonDisabled = derived(
  [uiStateStore, playerStore],
  ([$uiStateStore, $playerStore]) => {
    if (!$uiStateStore || !$playerStore) return true;
    const isPlayerTurn = $playerStore.players[$playerStore.currentPlayerIndex]?.type === 'human';
    const { selectedDirection, selectedDistance, isComputerMoveInProgress } = $uiStateStore;
    return !isPlayerTurn || isComputerMoveInProgress || !selectedDirection || !selectedDistance;
  }
);

export const isPlayerTurn = derived(
  [playerStore],
  ([$playerStore]) => $playerStore ? $playerStore.players[$playerStore.currentPlayerIndex]?.type === 'human' : false
);

export const availableMoves = availableMovesStore;

export const previousPlayerColor = derived(
  [playerStore],
  ([$playerStore]) => {
    if (!$playerStore) return null;
    const { players, currentPlayerIndex } = $playerStore;
    if (players.length === 0) return null;
    const previousPlayerIndex = (currentPlayerIndex + players.length - 1) % players.length;
    return players[previousPlayerIndex]?.color || null;
  }
);

export const availableDistances = derived(boardStore, $boardStore =>
  $boardStore ? Array.from({ length: $boardStore.boardSize - 1 }, (_, i) => i + 1) : []
);

export const distanceRows = derived(availableDistances, $availableDistances => {
  const dists = $availableDistances;
  if (dists.length <= 4) return [dists];
  if (dists.length === 5) return [dists.slice(0, 3), dists.slice(3)];
  if (dists.length === 6) return [dists.slice(0, 3), dists.slice(3)];
  if (dists.length === 7) return [dists.slice(0, 4), dists.slice(4)];
  if (dists.length === 8) return [dists.slice(0, 4), dists.slice(4)];
  return chunk(dists, 4);
});

export const currentLanguageFlagSvg = derived(
  appSettingsStore,
  $appSettingsStore => {
    return languages.find(lang => lang.code === $appSettingsStore.language)?.svg || languages[0].svg;
  }
);

export const currentPlayer = derived(
  [playerStore],
  ([$playerStore]) => {
    if (!$playerStore) return null;
    return $playerStore.players[$playerStore.currentPlayerIndex];
  }
);

export const currentPlayerColor = derived(
  [playerStore],
  ([$playerStore]) => {
    if (!$playerStore) return null;
    const currentPlayer = $playerStore.players[$playerStore.currentPlayerIndex];
    return currentPlayer?.color || null;
  }
);

export const visualPosition = derived(
  [boardStore, animationStore],
  ([$boardStore, $animationStore]) => {
    if (!$boardStore) {
      logService.piece("(visualPosition) no boardStore, returning null");
      return { row: null, col: null };
    }

    let result;
    if (!$animationStore.isAnimating && $animationStore.animationQueue.length === 0) {
      result = { row: $boardStore.playerRow, col: $boardStore.playerCol };
      logService.piece(`(visualPosition) no animation, returning logical position: [${result.row}, ${result.col}]`);
    } else if ($animationStore.visualMoveQueue && $animationStore.visualMoveQueue.length > 0) {
      const lastAnimatedMove = $animationStore.visualMoveQueue[$animationStore.visualMoveQueue.length - 1];
      result = {
        row: lastAnimatedMove.to?.row ?? $boardStore.playerRow,
        col: lastAnimatedMove.to?.col ?? $boardStore.playerCol
      };
      logService.piece(`(visualPosition) animation in progress, returning animated position: [${result.row}, ${result.col}]`);
    } else {
      result = { row: $boardStore.playerRow, col: $boardStore.playerCol };
      logService.piece(`(visualPosition) fallback, returning logical position: [${result.row}, ${result.col}]`);
    }

    return result;
  }
);

export const visualCellVisitCounts = derived(
  [visualPosition, boardStore, animationStore],
  ([$visualPosition, $boardStore, $animationStore]) => {
    if (!$boardStore) return {};
    if (!$animationStore.isAnimating) {
      return $boardStore.cellVisitCounts;
    }
    if (!$visualPosition || $visualPosition.row === null || $visualPosition.col === null) {
      return $boardStore.moveHistory[0]?.visits || {};
    }
    const relevantHistoryEntry = [...$boardStore.moveHistory].reverse().find(entry =>
      entry.pos.row === $visualPosition.row && entry.pos.col === $visualPosition.col
    );
    if (relevantHistoryEntry && relevantHistoryEntry.visits) {
      return relevantHistoryEntry.visits;
    }
    return $boardStore.moveHistory[$boardStore.moveHistory.length - 1]?.visits || {};
  }
);

export const isPauseBetweenMoves = derived(
  animationStore,
  $animationStore => $animationStore.isAnimating && $animationStore.animationQueue.length === 0
);

// НАВІЩО: Додано нові похідні стори для таймерів, щоб UI міг на них реагувати.
export const remainingTime = derived(
  timerStore,
  $timerStore => $timerStore.remainingTime ?? 0
);

export const turnTimeLimit = derived(
  timerStore,
  $timerStore => $timerStore.turnTimeLeft ?? 0
);