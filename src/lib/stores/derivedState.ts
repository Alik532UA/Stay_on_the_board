// src/lib/stores/derivedState.ts
import { derived } from 'svelte/store';
import { gameState } from './gameState';
import type { GameState } from './gameState';
import type { Direction } from '$lib/services/gameLogicService';
import { playerInputStore } from './playerInputStore';
import type { PlayerInputState } from './playerInputStore';
import { settingsStore } from './settingsStore';
import { languages } from '$lib/constants';
import { animationStore } from './animationStore';

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
  gameState,
  ($gameState: GameState) => {
    // Шукаємо з кінця черги останній хід, зроблений гравцем 2 (AI)
    for (let i = $gameState.moveQueue.length - 1; i >= 0; i--) {
      const move = $gameState.moveQueue[i];
      if (move.player === 2) {
        const result = { direction: move.direction as Direction, distance: move.distance };
        console.log('[lastComputerMove] Оновлено:', result);
        return result;
      }
    }
    console.log('[lastComputerMove] Оновлено: null');
    return null; // Якщо комп'ютер ще не ходив
  }
);

/**
 * Derived store, що визначає, чи триває пауза між ходом гравця та комп'ютера.
 * Використовується для приховування ходу комп'ютера в center-info під час паузи.
 * @type {import('svelte/store').Readable<boolean>}
 */
export const isPauseBetweenMoves = derived(
  gameState,
  ($gameState: GameState) => {
    // Пауза триває, якщо останній хід в черзі - це хід гравця (player: 1)
    // і ще немає ходу комп'ютера після нього
    const lastMove = $gameState.moveQueue[$gameState.moveQueue.length - 1];
    console.log('[isPauseBetweenMoves] Перевірка: lastMove =', lastMove);
    
    if (lastMove && lastMove.player === 1) {
      // Перевіряємо, чи є хід комп'ютера після ходу гравця
      for (let i = $gameState.moveQueue.length - 1; i >= 0; i--) {
        const move = $gameState.moveQueue[i];
        if (move.player === 2) {
          console.log('[isPauseBetweenMoves] Оновлено: false (є хід комп\'ютера)');
          return false;
        }
      }
      console.log('[isPauseBetweenMoves] Оновлено: true (пауза між ходами)');
      return true;
    }
    console.log('[isPauseBetweenMoves] Оновлено: false (не пауза)');
    return false;
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
      console.log('[centerInfo] Оновлено (input):', info);
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
      console.log('[centerInfo] Оновлено (direction):', info);
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
      console.log('[centerInfo] Оновлено (computer):', info);
      return info;
    }
    info = { class: '', content: '•', clickable: false, aria: 'Порожньо' };
    console.log('[centerInfo] Оновлено (default):', info);
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
    console.log('[visualPosition] Оновлення:', {
      gameStateRow: $gameState.playerRow,
      gameStateCol: $gameState.playerCol,
      visualMoveQueueLength: $animationStore.visualMoveQueue?.length,
      visualMoveQueue: $animationStore.visualMoveQueue,
      isPlayingAnimation: $animationStore.isPlayingAnimation
    });
    
    // Якщо є ходи в visualMoveQueue — показуємо позицію після останнього анімованого ходу
    if ($animationStore.visualMoveQueue && $animationStore.visualMoveQueue.length > 0) {
      const lastAnimatedMove = $animationStore.visualMoveQueue[$animationStore.visualMoveQueue.length - 1];
      const result = {
        row: lastAnimatedMove.to?.row ?? $gameState.playerRow,
        col: lastAnimatedMove.to?.col ?? $gameState.playerCol
      };
      console.log('[visualPosition] Використовуємо анімовану позицію:', result, 'з ходу:', lastAnimatedMove);
      return result;
    }
    
    // Якщо черга пуста — показуємо поточну позицію з gameState
    const result = {
      row: $gameState.playerRow,
      col: $gameState.playerCol
    };
    console.log('[visualPosition] Використовуємо логічну позицію:', result);
    return result;
  }
);

/**
 * Візуальні лічильники відвідувань клітин, синхронізовані з анімацією.
 * Обчислює стан "пошкодження" клітинок на основі того, що гравець бачить на екрані.
 * @type {import('svelte/store').Readable<Record<string, number>>}
 */
export const visualCellVisitCounts = derived(
  [visualPosition, gameState],
  ([$visualPosition, $gameState]) => {
    // Якщо візуальна позиція ще не визначена, показуємо початковий стан
    if (!$visualPosition || $visualPosition.row === null || $visualPosition.col === null) {
      return $gameState.moveHistory[0]?.visits || {};
    }

    // Знаходимо в історії останній запис, що відповідає поточній ВІЗУАЛЬНІЙ позиції фігури.
    // Це гарантує, що ми показуємо стан "visits" саме на момент прибуття фігури в цю точку.
    const relevantHistoryEntry = [...$gameState.moveHistory].reverse().find(entry =>
      entry.pos.row === $visualPosition.row && entry.pos.col === $visualPosition.col
    );

    // Якщо такий запис знайдено, повертаємо його стан відвідувань.
    if (relevantHistoryEntry && relevantHistoryEntry.visits) {
      return relevantHistoryEntry.visits;
    }

    // Як запасний варіант, повертаємо найостанніший відомий стан.
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
  animationStore,
  ($animationStore) => {
    const visualQueue = $animationStore.visualMoveQueue;
    if (!visualQueue || visualQueue.length === 0) {
      return 0; // На початку гри хід гравця
    }
    
    const lastVisualMove = visualQueue[visualQueue.length - 1];
    // Якщо останній візуальний хід був гравця (player: 1), то наступний - комп'ютера (індекс 1).
    // Якщо останній був комп'ютера (player: 2), то наступний - гравця (індекс 0).
    return lastVisualMove.player === 1 ? 1 : 0;
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

 