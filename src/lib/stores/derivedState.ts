// src/lib/stores/derivedState.ts
import { derived } from 'svelte/store';
import { gameState } from './gameState';
import type { GameState } from './gameState';
import type { Direction } from '$lib/services/gameLogicService';
import { playerInputStore } from './playerInputStore';
import type { PlayerInputState } from './playerInputStore';
import { settingsStore } from './settingsStore';
import { languages } from '$lib/constants';

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
export const lastComputerMove = derived(
  gameState,
  ($gameState: GameState) => {
    // Шукаємо з кінця черги останній хід, зроблений гравцем 2 (AI)
    for (let i = $gameState.moveQueue.length - 1; i >= 0; i--) {
      const move = $gameState.moveQueue[i];
      if (move.player === 2) {
        return { 
          direction: move.direction as Direction, 
          distance: move.distance 
        };
      }
    }
    return null; // Якщо комп'ютер ще не ходив
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
export const centerInfo = derived(
  [gameState, playerInputStore, lastComputerMove],
  ([$gameState, $playerInputStore, $lastComputerMove]) => {
    const { selectedDirection, selectedDistance } = $playerInputStore;
    const isPlayerTurn = $gameState.players[$gameState.currentPlayerIndex]?.type === 'human';

    // ПРІОРИТЕТ 1: Ввід гравця
    if (selectedDirection && selectedDistance) {
      const dir = directionArrows[selectedDirection] || '';
      return {
        class: 'confirm-btn-active',
        content: `${dir}${selectedDistance}`,
        clickable: isPlayerTurn,
        aria: `Підтвердити хід: ${dir}${selectedDistance}`
      };
    }
    if (selectedDirection) {
      const dir = directionArrows[selectedDirection] || '';
      return {
        class: 'direction-distance-state',
        content: dir,
        clickable: false,
        aria: `Вибрано напрямок: ${dir}`
      };
    }

    // ПРІОРИТЕТ 2: Останній хід комп'ютера
    if ($lastComputerMove) {
      const dir = directionArrows[$lastComputerMove.direction] || '';
      const dist = $lastComputerMove.distance || '';
      return {
        class: 'computer-move-display',
        content: `${dir}${dist}`,
        clickable: false,
        aria: `Хід комп'ютера: ${dir}${dist}`
      };
    }

    // ПРІОРИТЕТ 3: Стан за замовчуванням
    return { class: '', content: '•', clickable: false, aria: 'Порожньо' };
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