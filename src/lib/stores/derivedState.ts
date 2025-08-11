// src/lib/stores/derivedState.ts
import { derived, get } from 'svelte/store';
import { page } from '$app/stores';
import { gameState } from './gameState';
import { logService } from '$lib/services/logService';
import type { GameState } from './gameState';
import type { Direction } from '$lib/services/gameLogicService';
import { playerInputStore } from './playerInputStore';
import type { PlayerInputState } from './playerInputStore';
import { settingsStore } from './settingsStore';
import { languages } from '$lib/constants';
import { animationStore } from './animationStore';
import { localGameStore } from './localGameStore';
import { getAvailableMoves } from '$lib/utils/boardUtils';

/**
 * Визначає, чи є поточна гра локальною (грають кілька людей).
 * @type {import('svelte/store').Readable<boolean>}
 */
export const isLocalGame = derived(page, $page =>
  $page.url.pathname.includes('/game/local')
);

/**
 * @typedef {object} ComputerMove
 * @property {Direction} direction
 * @property {number} distance
 */

/**
 * Derived store, що завжди містить останній хід комп'ютера.
 * Він автоматично оновлюється, коли змінюється gameState.moveQueue.
 * @type {import('svelte/store').Readable<ComputerMove | null>}
 */
// ГАРАНТІЯ: lastComputerMove derived ТІЛЬКИ з gameState.moveQueue. НЕ МОЖНА додавати залежність від animationStore, BoardWrapperWidget чи будь-якої візуалізації!
// Це гарантує, що center-info/control-btn завжди оновлюється одразу після зміни стану гри, незалежно від анімації.
export const lastComputerMove = derived(
  [gameState, isLocalGame],
  ([$gameState, $isLocalGame]) => {
    if ($isLocalGame) {
      // В локальній грі немає комп'ютера, тому lastComputerMove завжди null
      return null;
    }
    
    for (let i = $gameState.moveQueue.length - 1; i >= 0; i--) {
      const move = $gameState.moveQueue[i];
      if (move.player === 2) {
        return { direction: move.direction as Direction, distance: move.distance };
      }
    }
    return null;
  }
);

/**
 * Derived store, що завжди містить останній хід гравця в локальній грі.
 * Він автоматично оновлюється, коли змінюється gameState.moveQueue.
 * @type {import('svelte/store').Readable<ComputerMove | null>}
 */
export const lastPlayerMove = derived(gameState, $gameState => {
  if ($gameState.moveQueue.length === 0) return null;
  const lastMove = $gameState.moveQueue[$gameState.moveQueue.length - 1];
  return {
    direction: lastMove.direction as Direction,
    distance: lastMove.distance
  };
});

/**
 * Derived store, що визначає, чи триває пауза між ходом гравця та комп'ютера.
 * Використовується для приховування ходу комп'ютера в center-info під час паузи.
 * @type {import('svelte/store').Readable<boolean>}
 */
export const isPauseBetweenMoves = derived(
  [gameState, isLocalGame],
  ([$gameState, $isLocalGame]) => {
    if ($isLocalGame) {
      return false;
    }

    const lastMove = $gameState.moveQueue[$gameState.moveQueue.length - 1];
    if (!lastMove) {
      return false;
    }

    // Якщо останній хід не гравця, паузи немає
    if (lastMove.player !== 1) {
      return false;
    }

    // Шукаємо, чи є хід комп'ютера ПІСЛЯ останнього ходу гравця
    let lastPlayerMoveIndex = -1;
    for (let i = $gameState.moveQueue.length - 1; i >= 0; i--) {
      if ($gameState.moveQueue[i].player === 1) {
        lastPlayerMoveIndex = i;
        break;
      }
    }

    if (lastPlayerMoveIndex !== -1) {
      for (let i = lastPlayerMoveIndex + 1; i < $gameState.moveQueue.length; i++) {
        if ($gameState.moveQueue[i].player === 2) {
          return false; // Знайдено хід комп'ютера після ходу гравця
        }
      }
    }

    // Якщо хід комп'ютера не знайдено, пауза триває
    return true;
  }
);

/**
 * @typedef {object} CenterInfoState
 * @property {string} class - CSS-клас для стилізації.
 * @property {string} content - Текст для відображення.
 * @property {boolean} clickable - Чи є кнопка клікабельною.
 * @property {string} aria - Текст для aria-label.
 */

const directionArrows: Record<Direction, string> = {
  'up-left': '↖', 'up': '↑', 'up-right': '↗',
  'left': '←', 'right': '→',
  'down-left': '↙', 'down': '↓', 'down-right': '↘'
};

/**
 * Derived стор, що обчислює стан центральної кнопки/інфо-панелі.
 * Залежить від трьох джерел: gameState, playerInputStore та lastComputerMove.
 * @type {import('svelte/store').Readable<CenterInfoState>}
 */
// ВАЖЛИВО: center-info derived не залежить від анімації чи паузи (animationStore, BoardWrapperWidget), а оновлюється миттєво після зміни стану гри. Це гарантує SoC, SSoT, UDF.
// Це гарантує, що center-info/control-btn завжди оновлюється одразу після зміни стану гри, незалежно від анімації.
export const centerInfo = derived(
  [gameState, playerInputStore, lastComputerMove],
  ([$gameState, $playerInputStore, $lastComputerMove]) => {
    const { selectedDirection, selectedDistance } = $playerInputStore;
    const isPlayerTurn = $gameState.players[$gameState.currentPlayerIndex]?.type === 'human';
    let info;
    if (selectedDirection && selectedDistance) {
      const dir = directionArrows[selectedDirection] || '';
      info = {
        class: 'confirm-btn-active',
        content: `${dir}${selectedDistance}`,
        clickable: isPlayerTurn,
        aria: `Підтвердити хід: ${dir}${selectedDistance}`
      };
      return info;
    }
    if (selectedDirection) {
      const dir = directionArrows[selectedDirection] || '';
      info = {
        class: 'direction-distance-state',
        content: dir,
        clickable: false,
        aria: `Вибрано напрямок: ${dir}`
      };
      return info;
    }
    if ($lastComputerMove) {
      const dir = directionArrows[$lastComputerMove.direction] || '';
      const dist = $lastComputerMove.distance || '';
      info = {
        class: 'computer-move-display',
        content: `${dir}${dist}`,
        clickable: false,
        aria: `Хід комп'ютера: ${dir}${dist}`
      };
      return info;
    }
    info = { class: '', content: '•', clickable: false, aria: 'Порожньо' };
    return info;
  }
); 

/**
 * Derived стор, що визначає, чи заблокована кнопка підтвердження ходу.
 * @type {import('svelte/store').Readable<boolean>}
 */
export const isConfirmButtonDisabled = derived(
  [gameState, playerInputStore],
  ([$gameState, $playerInputStore]) => {
    const isPlayerTurn = $gameState.players[$gameState.currentPlayerIndex]?.type === 'human';
    const { selectedDirection, selectedDistance, isMoveInProgress } = $playerInputStore;

    return !isPlayerTurn || isMoveInProgress || !selectedDirection || !selectedDistance;
  }
); 

/**
 * Обчислює масив доступних відстаней для поточного розміру дошки.
 * @type {import('svelte/store').Readable<number[]>}
 */
/**
 * Визначає, чи зараз хід гравця (індекс 0 — гравець).
 * @type {import('svelte/store').Readable<boolean>}
 */
export const isPlayerTurn = derived(gameState, $gameState =>
  $gameState.players[$gameState.currentPlayerIndex]?.type === 'human'
);


/**
 * Реактивно обчислює доступні ходи на основі поточного стану гри.
 * @type {import('svelte/store').Readable<import('$lib/services/gameLogicService').Move[]>}
 */
export const availableMoves = derived(
  [gameState, settingsStore, lastPlayerMove, isLocalGame, lastComputerMove],
  ([$gameState, $settingsStore, $lastPlayerMove, $isLocalGame, $lastComputerMove]) => {
    const {
      playerRow,
      playerCol,
      boardSize,
      cellVisitCounts,
      board,
    } = $gameState;

    const { blockOnVisitCount, blockModeEnabled } = $settingsStore;

    // Для перевірки штрафних ходів нам потрібен останній хід *супротивника*.
    // У локальній грі це lastPlayerMove (хід попереднього гравця).
    // У грі проти ШІ це lastComputerMove.
    const moveForPenaltyCheck = $isLocalGame ? $lastPlayerMove : $lastComputerMove;

    return getAvailableMoves(
      playerRow,
      playerCol,
      boardSize,
      cellVisitCounts,
      blockOnVisitCount,
      board,
      blockModeEnabled,
      moveForPenaltyCheck
    );
  }
);

/**
 * Отримує колір попереднього гравця в локальній грі (який тільки що зробив хід).
 * @type {import('svelte/store').Readable<string | null>}
 */
export const previousPlayerColor = derived(
  [gameState, localGameStore, isLocalGame],
  ([$gameState, $localGameStore, $isLocalGame]) => {
    if (!$isLocalGame) return null;

    const currentPlayerIndex = $gameState.currentPlayerIndex;
    const playersCount = $localGameStore.players.length;
    if (playersCount === 0) return null;

    const previousPlayerIndex = (currentPlayerIndex + playersCount - 1) % playersCount;
    const previousPlayer = $localGameStore.players[previousPlayerIndex];
    
    return previousPlayer?.color || null;
  }
);

export const availableDistances = derived(gameState, $gameState => 
  Array.from({ length: $gameState.boardSize - 1 }, (_, i) => i + 1)
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
  // Для більшої кількості кнопок використовуємо chunk
  return chunk(dists, 4);
});

/**
 * @private
 * Допоміжна функція для розбиття масиву на частини.
 * @param {any[]} arr
 * @param {number} n
 */
function chunk(arr: any[], n: number) {
  const res = [];
  for (let i = 0; i < arr.length; i += n) res.push(arr.slice(i, i + n));
  return res;
} 

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
 * Визначає, чи потрібно приховати дошку після ходу гравця.
 * @type {import('svelte/store').Readable<boolean>}
 */
export const shouldHideBoard = derived(
  [settingsStore, gameState],
  ([$settingsStore, $gameState]) => {
    if (!$settingsStore.autoHideBoard) return false;
    const lastMove = $gameState.moveQueue?.[$gameState.moveQueue.length - 1];
    return lastMove?.player === 1;
  }
); 

// ===== НОВІ DERIVED STORES ДЛЯ ВІЗУАЛЬНИХ ДАНИХ =====

/**
 * Візуальна позиція ферзя з анімаційною затримкою.
 * Показує проміжні стани під час ходів для кращого UX.
 * @type {import('svelte/store').Readable<{row: number|null, col: number|null}>}
 */
// ВАЖЛИВО: visualPosition залежить від animationStore, щоб відображати
// позицію фігури синхронно з анімацією, а не з логікою гри.
export const visualPosition = derived(
  [gameState, animationStore],
  ([$gameState, $animationStore]) => {
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
    // Якщо гра не анімується, візуальний стан ПОВИНЕН відповідати логічному.
    // Це виправляє баг, коли cellVisitCounts скидається, але візуалізація не оновлюється.
    if (!$animationStore.isAnimating) {
      return $gameState.cellVisitCounts;
    }

    // Якщо анімація триває, використовуємо стару логіку для відображення історичного стану.
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
 * @type {import('svelte/store').Readable<VisualBoardState>}
 */
export const visualBoardState = derived(
  [gameState, animationStore],
  ([$gameState, $animationStore]) => ({
    // Логічні дані з gameState
    position: { 
      row: $gameState.playerRow, 
      col: $gameState.playerCol 
    },
    cellVisitCounts: $gameState.cellVisitCounts,
    availableMoves: $gameState.availableMoves,
    board: $gameState.board,
    boardSize: $gameState.boardSize,
    
    // Візуальні прапорці з animationStore
    isAnimating: $animationStore.isAnimating,
    
    // Додаткові візуальні властивості
    isGameOver: $gameState.isGameOver,
    currentPlayerIndex: $gameState.currentPlayerIndex
  })
);

/**
 * Обчислює індекс поточного гравця на основі ВІЗУАЛЬНОЇ черги анімації.
 * Це дозволяє UI реагувати на те, що бачить користувач, а не на миттєвий логічний стан.
 * @type {import('svelte/store').Readable<number>}
 */
export const visualCurrentPlayerIndex = derived(
  gameState,
  ($gameState) => $gameState.currentPlayerIndex
);

/**
 * Derived store, що містить дані поточного гравця.
 * @type {import('svelte/store').Readable<{id: number|string, type: 'human'|'ai', name: string}>}
 */
export const currentPlayer = derived(
  [gameState, visualCurrentPlayerIndex],
  ([$gameState, $visualCurrentPlayerIndex]) => {
    return $gameState.players[$visualCurrentPlayerIndex];
  }
);

/**
 * Обчислює колір поточного гравця для локальної гри.
 * Використовується для зміни кольору тіней елементів інтерфейсу.
 * @type {import('svelte/store').Readable<string | null>}
 */
export const currentPlayerColor = derived(
  [gameState, localGameStore, isLocalGame],
  ([$gameState, $localGameStore, $isLocalGame]) => {
    if (!$isLocalGame) return null;

    const currentPlayerIndex = $gameState.currentPlayerIndex;
    const currentPlayer = $localGameStore.players[currentPlayerIndex];

    return currentPlayer?.color || null;
  }
);

/**
 * Типи для візуального стану дошки
 */
export interface VisualBoardState {
  position: { row: number|null; col: number|null };
  cellVisitCounts: Record<string, number>;
  availableMoves: any[];
  board: number[][];
  boardSize: number;
  isAnimating: boolean;
  isGameOver: boolean;
  currentPlayerIndex: number;
}
