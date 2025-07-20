import { get } from 'svelte/store';
import { appState, _performMove, _updateAvailableMoves, _endGame, _applyPenalty, _incrementScore, resetAndCloseModal, startReplay, continueGameAndClearBlocks, finishGameWithBonus } from './stores/gameStore.js';
import { settingsStore } from './stores/settingsStore.js';
import { modalStore } from './stores/modalStore.js';
import { agents } from './playerAgents.js';
import * as core from './gameCore.js';
import { speakText, langMap } from '$lib/speech.js';
import { _ as t } from 'svelte-i18n';

async function triggerComputerMove() {
  const current = get(appState);
  if (current.isGameOver || current.players[current.currentPlayerIndex]?.type !== 'ai') return;

  const move = await agents.ai.getMove(current);

  if (move) {
    const directionKey = Object.keys(core.numToDir).find(key => core.numToDir[key] === move.direction) || move.direction;
    console.log('[Orchestrator] Setting computer move display:', { direction: move.direction, distance: move.distance });
    // Атомарне оновлення: одночасно очищуємо вибір гравця і встановлюємо хід комп'ютера
    appState.update(state => ({
      ...state,
      computerLastMoveDisplay: { direction: move.direction, distance: move.distance },
      lastComputerMove: { direction: move.direction, distance: move.distance },
    }));
    await new Promise(resolve => setTimeout(resolve, 900));
    _performMove(move.row, move.col);
    await new Promise(resolve => setTimeout(resolve, 600));
    _updateAvailableMoves();
    const latestSettings = get(settingsStore);
    if (latestSettings.speechEnabled) {
      const $t = get(t);
      const directionText = $t(`speech.directions.${move.direction}`) || move.direction;
      const textToSpeak = `${move.distance} ${directionText}.`;
      const langCode = langMap[/** @type {keyof typeof langMap} */(latestSettings.language)] || 'uk-UA';
      speakText(textToSpeak, langCode, latestSettings.selectedVoiceURI ?? null);
    }
    // Повертаємо хід гравцеві
    appState.update(state => ({ ...state, currentPlayerIndex: (state.currentPlayerIndex + 1) % state.players.length }));
  } else {
    const previewScoreDetails = core.calculateFinalScore({ ...current, finishedByNoMovesButton: true });
    const $t = get(t);
    modalStore.showModal({
      titleKey: 'modal.computerNoMovesTitle',
      content: { reason: $t('modal.computerNoMovesContent'), scoreDetails: previewScoreDetails },
      buttons: [
        { textKey: 'modal.continueGame', primary: true, isHot: true, onClick: continueGameAndClearBlocks, customClass: 'green-btn' },
        { text: $t('modal.finishGameWithBonus', { values: { bonus: current.boardSize } }), customClass: 'blue-btn', onClick: finishGameWithBonus },
        { textKey: 'modal.watchReplay', customClass: 'blue-btn', onClick: startReplay }
      ]
    });
  }
}

export async function confirmPlayerMove() {
  const state = get(appState);
  const { selectedDirection, selectedDistance, playerRow, playerCol, lastComputerMove, boardSize, blockModeEnabled } = state;
  if (!selectedDirection || !selectedDistance || playerRow === null || playerCol === null) return;
  const [dr, dc] = core.dirMap[selectedDirection];
  const newRow = playerRow + dr * selectedDistance;
  const newCol = playerCol + dc * selectedDistance;
  const isOutsideBoard = newRow < 0 || newRow >= boardSize || newCol < 0 || newCol >= boardSize;
  const visitCount = state.cellVisitCounts[`${newRow}-${newCol}`] || 0;
  const isCellBlocked = blockModeEnabled && visitCount > get(settingsStore).blockOnVisitCount;
  if (isOutsideBoard || isCellBlocked) {
    _endGame(isOutsideBoard ? 'modal.gameOverReasonOut' : 'modal.gameOverReasonBlocked');
    return;
  }
  const { showBoard, showQueen } = get(settingsStore);
  let scoreChange = 1;
  if (!showBoard) scoreChange = 3;
  else if (!showQueen) scoreChange = 2;
  _incrementScore(scoreChange);
  if (lastComputerMove && selectedDistance === lastComputerMove.distance && selectedDirection === core.oppositeDirections[lastComputerMove.direction]) {
    _applyPenalty(2);
  }
  _performMove(newRow, newCol);
  // NEW LOGIC HERE
  appState.update(s => ({
    ...s,
    selectedDirection: null,
    selectedDistance: null,
    distanceManuallySelected: false,
    currentPlayerIndex: (s.currentPlayerIndex + 1) % s.players.length
  }));
  await new Promise(resolve => setTimeout(resolve, 100));
  await triggerComputerMove();
}

export function claimNoMoves() {
  const state = get(appState);
  if (state.availableMoves.length === 0) {
    const previewScoreDetails = core.calculateFinalScore({ ...state, finishedByNoMovesButton: true });
    const $t = get(t);
    modalStore.showModal({
      titleKey: 'modal.playerNoMovesTitle',
      content: { reason: $t('modal.playerNoMovesContent'), scoreDetails: previewScoreDetails },
      buttons: [
        { textKey: 'modal.continueGame', primary: true, isHot: true, onClick: continueGameAndClearBlocks, customClass: 'green-btn' },
        { text: $t('modal.finishGameWithBonus', { values: { bonus: state.boardSize } }), customClass: 'blue-btn', onClick: finishGameWithBonus },
        { textKey: 'modal.watchReplay', customClass: 'blue-btn', onClick: startReplay }
      ]
    });
  } else {
    _endGame('modal.errorContent');
  }
} 