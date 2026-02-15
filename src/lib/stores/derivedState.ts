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
import { derivedState } from './derivedState.svelte';

// Bridge pattern: Експортуємо старі стори, але запозичуємо логіку з Runes (SSoT)
// Це дозволяє поступово переходити на Runes без ламання існуючих компонентів.

export const lastComputerMove = derived(
  [uiStateStore, playerStore, boardStore],
  () => derivedState.lastComputerMove
);

export const lastPlayerMove = derived(
  [uiStateStore, playerStore, boardStore],
  () => derivedState.lastPlayerMove
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
  [playerStore, uiStateStore],
  () => derivedState.isPlayerTurn
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

function chunk<T>(arr: T[], n: number): T[][] {
  const res = [];
  for (let i = 0; i < arr.length; i += n) res.push(arr.slice(i, i + n));
  return res;
}

export const distanceRows = derived(availableDistances, $availableDistances => {
  const dists = $availableDistances;
  if (dists.length <= 4) return [dists];
  if (dists.length === 5) return [dists.slice(0, 3), dists.slice(3)];
  if (dists.length === 6) return [dists.slice(0, 3), dists.slice(3)];
  if (dists.length === 7) return [dists.slice(0, 4), dists.slice(4)];
  if (dists.length === 8) return [dists.slice(0, 4), dists.slice(4)];
  return chunk(dists, 4);
});

export const currentLanguageFlagComponent = derived(
  appSettingsStore,
  $appSettingsStore => {
    return languages.find(lang => lang.code === $appSettingsStore.language)?.component || languages[0].component;
  }
);

export const currentPlayer = derived(
  [playerStore],
  () => derivedState.currentPlayer
);

export const currentPlayerColor = derived(
  [playerStore],
  () => derivedState.currentPlayerColor
);

export const visualPosition = derived(
  [boardStore, animationStore],
  () => derivedState.visualPosition
);

export const visualCellVisitCounts = derived(
  [boardStore, animationStore],
  () => derivedState.visualCellVisitCounts
);

export const isPauseBetweenMoves = derived(
  animationStore,
  $animationStore => $animationStore.isAnimating && $animationStore.animationQueue.length === 0
);

export const remainingTime = derived(
  timerStore,
  () => derivedState.remainingTime
);

export const turnTimeLimit = derived(
  timerStore,
  $timerStore => ($timerStore as any).turnTimeLeft ?? 0
);

export const isGameOver = derived(
  uiStateStore,
  () => derivedState.isGameOver
);

export const isFirstMove = derived(
  uiStateStore,
  $uiStateStore => $uiStateStore.isFirstMove
);