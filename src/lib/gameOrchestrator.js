import { get } from 'svelte/store';
import { gameState } from './stores/gameState.js';
import { playerInputStore } from './stores/playerInputStore.js';
import { performMove, updateAvailableMoves, endGame, resetGame, startReplay, processPlayerMove } from './stores/gameActions.js';
import { settingsStore } from './stores/settingsStore.js';
import { modalService } from '$lib/services/modalService.js';
import { agents } from './playerAgents.js';
import * as core from './gameCore.js';
import { speakText, langMap } from '$lib/services/speechService.js';
import { _ as t } from 'svelte-i18n';
import { logService } from '$lib/services/logService.js';
import { writable } from 'svelte/store';

/**
 * @typedef {{direction: string, distance: number} | null} ComputerLastMoveDisplay
 */
/** @type {import('svelte/store').Writable<ComputerLastMoveDisplay>} */
export const computerLastMoveDisplayStore = writable(null);

function triggerComputerMove() {
  const current = get(gameState);
  if (current.isGameOver || current.players[current.currentPlayerIndex]?.type !== 'ai') return;

  // getMove залишається асинхронним, але ми обробляємо результат у .then()
  agents.ai.getMove(current).then(move => {
    if (move) {
      // Усі наступні дії - синхронні
      computerLastMoveDisplayStore.set({ direction: move.direction, distance: move.distance });
      playerInputStore.update(s => ({ ...s, lastComputerMove: { direction: move.direction, distance: move.distance } }));
      gameState.update(state => ({
        ...state,
        moveQueue: [...state.moveQueue, { player: 2, direction: move.direction, distance: move.distance }]
      }));

      performMove(move.row, move.col);

      const latestSettings = get(settingsStore);
      if (latestSettings.speechEnabled) {
        const $t = get(t);
        const directionText = $t(`speech.directions.${move.direction}`) || move.direction;
        const textToSpeak = `${move.distance} ${directionText}.`;
        const langCode = langMap[/** @type {keyof typeof langMap} */(latestSettings.language)] || 'uk-UA';
        speakText(textToSpeak, langCode, latestSettings.selectedVoiceURI ?? null);
      }

      updateAvailableMoves();
      gameState.update(state => ({ ...state, currentPlayerIndex: 0 }));

    } else {
      // Комп'ютер не може зробити хід. Завершуємо гру, передаючи спеціальний ключ.
      gameState.update(s => ({ ...s, finishedByNoMovesButton: true })); // Встановлюємо прапорець для правильного розрахунку бонусу
      endGame('modal.computerNoMovesContent');
    }
  }).catch(error => {
    const err = error instanceof Error ? error : new Error(String(error));
    logService.addLog(`Error in triggerComputerMove: ${err.message}`, 'error');
    modalService.showModal({
      titleKey: 'modal.errorTitle',
      content: 'Виникла помилка під час ходу комп\'ютера.',
    });
  });
}

export function confirmPlayerMove() {
  const { selectedDirection, selectedDistance, isMoveInProgress } = get(playerInputStore);
  if (isMoveInProgress) return;

  playerInputStore.update(s => ({ ...s, isMoveInProgress: true }));

  const state = get(gameState);
  const { playerRow, playerCol, boardSize } = state;
  const { blockModeEnabled } = get(settingsStore);

  if (!selectedDirection || !selectedDistance || playerRow === null || playerCol === null) {
    playerInputStore.update(s => ({ ...s, isMoveInProgress: false }));
    return;
  }

  // 1. Розраховуємо новий хід
  const [dr, dc] = core.dirMap[selectedDirection];
  const newRow = playerRow + dr * selectedDistance;
  const newCol = playerCol + dc * selectedDistance;

  // 2. НЕГАЙНО оновлюємо стан гри, щоб анімація могла початися
  gameState.update(s => ({
    ...s,
    moveQueue: [...s.moveQueue, { player: 1, direction: selectedDirection, distance: selectedDistance }]
  }));

  // 3. Перевіряємо, чи був хід програшним
  const isOutsideBoard = newRow < 0 || newRow >= boardSize || newCol < 0 || newCol >= boardSize;
  const visitCount = get(gameState).cellVisitCounts[`${newRow}-${newCol}`] || 0;
  const isCellBlocked = blockModeEnabled && visitCount > get(settingsStore).blockOnVisitCount;

  // 4. ЯВНИЙ ПОТІК КЕРУВАННЯ
  if (isOutsideBoard || isCellBlocked) {
    // Сценарій поразки
    computerLastMoveDisplayStore.set(null); // Очищуємо показ старого ходу
    endGame(isOutsideBoard ? 'modal.gameOverReasonOut' : 'modal.gameOverReasonBlocked');
    playerInputStore.update(s => ({ ...s, isMoveInProgress: false }));
    return;
  }

  // Якщо хід валідний — тільки тоді оновлюємо рахунок і позицію
  processPlayerMove(playerRow, playerCol, newRow, newCol);
  performMove(newRow, newCol);

  playerInputStore.update(s => ({ ...s, selectedDirection: null, selectedDistance: null, distanceManuallySelected: false }));
  gameState.update(s => ({ ...s, currentPlayerIndex: 1 }));
  triggerComputerMove();
  playerInputStore.update(s => ({ ...s, isMoveInProgress: false }));
}

export function claimNoMoves() {
  const state = get(gameState);
  if (state.availableMoves.length === 0) {
    // Успішна заява: гравець перемагає
    gameState.update(s => ({ ...s, noMovesClaimsCount: (s.noMovesClaimsCount || 0) + 1 }));
    endGame('modal.playerNoMovesContent');
  } else {
    // Помилкова заява: гравець програє
    endGame('modal.errorContent', { count: state.availableMoves.length });
  }
} 