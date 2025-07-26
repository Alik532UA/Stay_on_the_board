// src/lib/gameOrchestrator.js
import { get } from 'svelte/store';
import { gameState } from './stores/gameState.js';
import { playerInputStore } from './stores/playerInputStore.js';
import * as gameLogicService from '$lib/services/gameLogicService.js';
import { settingsStore } from './stores/settingsStore.js';
import { modalService } from '$lib/services/modalService.js';
import { modalStore } from './stores/modalStore.js';
import { agents } from './playerAgents.js';
import { speakText, langMap } from '$lib/services/speechService.js';
import { _ as t } from 'svelte-i18n';
import { logService } from '$lib/services/logService.js';
import { lastComputerMove } from './stores/derivedState.js';
import { replayStore } from './stores/replayStore.js';
import { goto } from '$app/navigation';
import { base } from '$app/paths';

/**
 * Сервіс, що керує ігровим процесом.
 * Він є єдиною точкою входу для дій гравця та координує
 * оновлення стану, хід комп'ютера та побічні ефекти.
 */
export const gameOrchestrator = {
  /**
   * Встановлює новий розмір дошки, обробляючи логіку підтвердження.
   * @param {number} newSize
   */
  setBoardSize(newSize) {
    const { score, penaltyPoints, boardSize } = get(gameState);
    if (newSize === boardSize) return;

    if (score === 0 && penaltyPoints === 0) {
      gameLogicService.resetGame({ newSize });
    } else {
      modalStore.showModal({
        titleKey: 'modal.resetScoreTitle',
        contentKey: 'modal.resetScoreContent',
        buttons: [
          { 
            textKey: 'modal.resetScoreConfirm', 
            customClass: 'green-btn', 
            isHot: true, 
            onClick: () => { 
              gameLogicService.resetGame({ newSize }); 
              modalStore.closeModal(); 
            } 
          },
          { textKey: 'modal.resetScoreCancel', onClick: modalStore.closeModal }
        ]
      });
    }
  },

  /**
   * Завершує гру з вказаною причиною.
   * @param {string} reasonKey
   * @param {Record<string, any> | null} [reasonValues=null]
   */
  endGame(reasonKey, reasonValues = null) {
    const state = get(gameState);
    const finalScoreDetails = gameLogicService.calculateFinalScore(state);
    gameState.update(s => ({ 
      ...s, 
      isGameOver: true, 
      baseScore: finalScoreDetails.baseScore,
      sizeBonus: finalScoreDetails.sizeBonus,
      blockModeBonus: finalScoreDetails.blockModeBonus,
      jumpBonus: finalScoreDetails.jumpBonus,
      finishBonus: finalScoreDetails.finishBonus,
      noMovesBonus: finalScoreDetails.noMovesBonus,
      totalPenalty: finalScoreDetails.totalPenalty,
      totalScore: finalScoreDetails.totalScore,
      gameOverReasonKey: reasonKey,
      gameOverReasonValues: reasonValues,
      cellVisitCounts: {} // --- Очищаємо заблоковані клітини ---
    }));
    // --- Очищаємо візуальні заблоковані клітини ---
    import('$lib/stores/animationStore').then(mod => {
      mod.animationStore.update(v => ({ ...v, visualCellVisitCounts: {} }));
    });
  },

  /**
   * Запускає режим перегляду повтору.
   */
  startReplay() {
    modalService.closeModal();
    const { moveHistory, boardSize } = get(gameState);
    sessionStorage.setItem('replayData', JSON.stringify({ moveHistory, boardSize }));
    replayStore.update(state => ({ ...state, isReplayMode: true, replayCurrentStep: 0 }));
    goto(`${base}/replay`);
  },

  /**
   * Фіналізує гру, яка вже знаходиться в стані isGameOver,
   * оновлюючи причину завершення.
   * @param {string} reasonKey
   */
  finalizeGameWithBonus(reasonKey) {
    // 1. Спочатку оновлюємо прапорець
    gameState.update(s => ({ ...s, finishedByFinishButton: true }));

    // 2. Тепер беремо оновлений стан
    const state = get(gameState);
    const finalScoreDetails = gameLogicService.calculateFinalScore(state);

    // 3. Оновлюємо всі фінальні поля
    gameState.update(s => ({
      ...s,
      baseScore: finalScoreDetails.baseScore,
      sizeBonus: finalScoreDetails.sizeBonus,
      blockModeBonus: finalScoreDetails.blockModeBonus,
      jumpBonus: finalScoreDetails.jumpBonus,
      finishBonus: finalScoreDetails.finishBonus,
      noMovesBonus: finalScoreDetails.noMovesBonus,
      totalPenalty: finalScoreDetails.totalPenalty,
      totalScore: finalScoreDetails.totalScore,
      gameOverReasonKey: reasonKey,
    }));
  },

  /**
   * Продовжує гру після успішної заяви "Ходів немає", очищуючи поле.
   */
  continueAfterNoMoves() {
    gameState.update(state => {
      const { playerRow, playerCol, boardSize } = state;
      if (playerRow === null || playerCol === null) return state;

      const newState = {
        ...state,
        // --- ПОВНЕ ОЧИЩЕННЯ СТАНУ ЗАВЕРШЕННЯ ---
        isGameOver: false,
        gameOverReasonKey: null,
        gameOverReasonValues: null,
        // -----------------------------------------
        cellVisitCounts: {},
        finishedByNoMovesButton: false,
        currentPlayerIndex: 0,
        // Скидаємо поля фінального рахунку
        baseScore: undefined,
        sizeBonus: undefined,
        blockModeBonus: undefined,
        jumpBonus: undefined,
        finishBonus: undefined,
        noMovesBonus: undefined,
        totalPenalty: undefined,
        totalScore: undefined,
      };

      newState.availableMoves = gameLogicService.getAvailableMoves(playerRow, playerCol, boardSize, {}, get(settingsStore).blockOnVisitCount);
      
      return newState;
    });
    
    modalStore.closeModal();
  },

  /**
   * Гравець підтверджує свій хід.
   */
  confirmPlayerMove() {
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

    const [dr, dc] = gameLogicService.dirMap[selectedDirection];
    const newRow = playerRow + dr * selectedDistance;
    const newCol = playerCol + dc * selectedDistance;

    gameState.update(s => ({
      ...s,
      moveQueue: [...s.moveQueue, { player: 1, direction: selectedDirection, distance: selectedDistance }]
    }));

    const visitCount = get(gameState).cellVisitCounts[`${newRow}-${newCol}`] || 0;
    const isCellBlocked = blockModeEnabled && visitCount > get(settingsStore).blockOnVisitCount;
    const isOutsideBoard = newRow < 0 || newRow >= boardSize || newCol < 0 || newCol >= boardSize;

    if (isOutsideBoard || isCellBlocked) {
      gameLogicService.performMove(newRow, newCol);
      this.endGame(isOutsideBoard ? 'modal.gameOverReasonOut' : 'modal.gameOverReasonBlocked');
      playerInputStore.update(s => ({ ...s, isMoveInProgress: false }));
      return;
    }

    this._processPlayerMove(playerRow, playerCol, newRow, newCol);
    gameLogicService.performMove(newRow, newCol);

    playerInputStore.update(s => ({ ...s, selectedDirection: null, selectedDistance: null, distanceManuallySelected: false }));
    gameState.update(s => ({ ...s, currentPlayerIndex: 1 }));
    
    this._triggerComputerMove();
    playerInputStore.update(s => ({ ...s, isMoveInProgress: false }));
  },

  /**
   * Гравець заявляє, що у нього немає ходів.
   */
  claimNoMoves() {
    const state = get(gameState);
    if (state.availableMoves.length === 0) {
      gameState.update(s => ({ ...s, noMovesClaimsCount: (s.noMovesClaimsCount || 0) + 1 }));
      this.endGame('modal.playerNoMovesContent');
    } else {
      this.endGame('modal.errorContent', { count: state.availableMoves.length });
    }
  },

  /**
   * @private
   * Обробляє логіку ходу гравця, включаючи нарахування балів, штрафів та бонусних лічильників.
   * @param {number} startRow
   * @param {number} startCol
   * @param {number} newRow
   * @param {number} newCol
   */
  _processPlayerMove(startRow, startCol, newRow, newCol) {
    const settings = get(settingsStore);
    const computerMove = get(lastComputerMove);
    const { selectedDistance, selectedDirection } = get(playerInputStore);
    const { cellVisitCounts } = get(gameState);

    let scoreChange = 1;
    if (!settings.showBoard) scoreChange = 3;
    else if (!settings.showQueen) scoreChange = 2;

    let penaltyChange = 0;
    if (
      !settings.blockModeEnabled &&
      computerMove &&
      selectedDirection === gameLogicService.oppositeDirections[computerMove.direction] &&
      selectedDistance != null &&
      selectedDistance <= computerMove.distance
    ) {
      penaltyChange = 2;
    }

    const blockModeMovesChange = settings.blockModeEnabled ? 1 : 0;
    const jumpedCellsChange = settings.blockModeEnabled 
      ? gameLogicService.countJumpedCells(startRow, startCol, newRow, newCol, cellVisitCounts, settings.blockOnVisitCount)
      : 0;

    gameState.update(s => ({
      ...s, 
      score: s.score + scoreChange,
      penaltyPoints: s.penaltyPoints + penaltyChange,
      movesInBlockMode: s.movesInBlockMode + blockModeMovesChange,
      jumpedBlockedCells: s.jumpedBlockedCells + jumpedCellsChange,
    }));
  },

  /**
   * @private
   * Запускає логіку ходу комп'ютера.
   */
  async _triggerComputerMove() {
    const current = get(gameState);
    if (current.isGameOver || current.players[current.currentPlayerIndex]?.type !== 'ai') return;

    try {
      const move = await agents.ai.getMove(current);
      if (move) {
        gameState.update(state => ({
          ...state,
          moveQueue: [...state.moveQueue, { player: 2, direction: move.direction, distance: move.distance }]
        }));

        gameLogicService.performMove(move.row, move.col);
        this._handleComputerMoveSideEffects(move);
        
        gameLogicService.updateAvailableMoves();
        gameState.update(state => ({ ...state, currentPlayerIndex: 0 }));
      } else {
        gameState.update(s => ({ ...s, finishedByNoMovesButton: true }));
        this.endGame('modal.computerNoMovesContent');
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logService.addLog(`Error in _triggerComputerMove: ${err.message}`, 'error');
      modalService.showModal({
        titleKey: 'modal.errorTitle',
        content: 'Виникла помилка під час ходу комп\'ютера.',
      });
    }
  },

  /**
   * @private
   * Обробляє побічні ефекти ходу комп'ютера (озвучення).
   * @param {any} move
   */
  _handleComputerMoveSideEffects(move) {
    const latestSettings = get(settingsStore);
    if (latestSettings.speechEnabled) {
      let speechLang = langMap[/** @type {keyof typeof langMap} */(latestSettings.language)] || 'uk-UA';
      let speechVoice = latestSettings.selectedVoiceURI ?? null;
      let allVoices = (typeof window !== 'undefined' && 'speechSynthesis' in window) ? window.speechSynthesis.getVoices() : [];
      let selectedVoiceObj = speechVoice ? allVoices.find(v => v.voiceURI === speechVoice) : null;
      if (!selectedVoiceObj) {
        const fallbackVoices = allVoices.filter(v => v.lang === speechLang);
        if (!fallbackVoices.length) {
          const enVoices = allVoices.filter(v => v.lang.startsWith('en'));
          if (enVoices.length) {
            speechLang = 'en-US';
            speechVoice = enVoices[0].voiceURI;
          }
        }
      } else {
        speechLang = selectedVoiceObj.lang;
      }
      
      let textToSpeak = '';
      if (speechLang.startsWith('en')) {
        /** @type {Record<import('$lib/services/gameLogicService').Direction, string>} */
        const directionEn = {
          'up-left': 'up left', 'up': 'up', 'up-right': 'up right',
          'left': 'left', 'right': 'right',
          'down-left': 'down left', 'down': 'down', 'down-right': 'down right'
        };
        const dirKey = /** @type {import('$lib/services/gameLogicService').Direction} */ (move.direction);
        textToSpeak = `${move.distance} ${directionEn[dirKey] ?? move.direction}.`;
      } else {
        const $t = get(t);
        const directionText = $t(`speech.directions.${move.direction}`) || move.direction;
        textToSpeak = `${move.distance} ${directionText}.`;
      }
      speakText(textToSpeak, speechLang, speechVoice);
    }
  }
};