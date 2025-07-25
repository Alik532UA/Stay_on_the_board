import { get } from 'svelte/store';
import { gameState, createInitialState } from './gameState.js';
import { playerInputStore } from './playerInputStore.js';
import { replayStore } from './replayStore.js';
import { modalService } from '$lib/services/modalService.js';
import { settingsStore } from './settingsStore.js';
import * as core from '$lib/gameCore.js';
import { _ as t } from 'svelte-i18n';
import { navigateToMainMenu } from '$lib/utils/navigation.js';
import { computerLastMoveDisplayStore } from '$lib/gameOrchestrator.js';
import { goto } from '$app/navigation';
import { base } from '$app/paths';
import { modalStore } from './modalStore.js';

/** @type {ReturnType<typeof setInterval> | null} */
let autoPlayInterval: ReturnType<typeof setInterval> | null = null;

/**
 * @file Contains all functions (actions) that mutate the game's state.
 * This is the single entry point for any state modification, ensuring a unidirectional data flow.
 * Actions can read from multiple stores but should only write state through store updates.
 */
/**
 * Resets the game to its initial state. Can optionally take a new board size.
 * This is the single entry point for starting a new game.
 * @param {object} [options] - Optional parameters for resetting the game.
 * @param {number} [options.newSize] - The new size for the board.
 */
export function resetGame(options: { newSize?: number } = {}) {
  const { newSize } = options;
  // ВАЖЛИВО! Не видаляти і не змінювати цю логіку під час рефакторингу!
  // ---------------------------------------------------------------
  // Цей виклик гарантує, що чекбокси 'Показати ферзя' (showQueen) та 'Показувати доступні ходи' (showMoves)
  // будуть увімкнені ДО старту нової гри. Це критично для UX:
  // - Якщо вмикати їх після старту гри або після першого ходу, виникає візуальне блимання дошки (showBoard)
  // - Якщо не вмикати їх, користувач може не побачити фігури чи підсвітки ходів на початку
  // - showBoard тут НЕ чіпаємо, бо autoHideBoard може бути true і дошка має залишатися прихованою
  // Якщо ви змінюєте цю частину — ОБОВʼЯЗКОВО перевірте, що не виникає блимання і всі чекбокси працюють як треба!
  settingsStore.updateSettings({ showQueen: true, showMoves: true });
  // showBoard не чіпаємо, бо autoHideBoard може бути true
  const currentState = get(gameState);
  const size = newSize ?? currentState.boardSize;

  const newState = createInitialState();
  newState.boardSize = size;

  const { row, col } = core.getRandomCell(size);
  
  newState.playerRow = row;
  newState.playerCol = col;
  newState.board = core.createEmptyBoard(size);
  newState.board[row][col] = 1;
  newState.moveHistory = [{ pos: { row, col }, blocked: [], visits: {} }];

  gameState.set(newState);

  playerInputStore.set({
    selectedDirection: null,
    selectedDistance: null,
    distanceManuallySelected: false,
    lastComputerMove: null,
    isMoveInProgress: false,
  });

  replayStore.set({
    isReplayMode: false,
    replayCurrentStep: 0,
    autoPlayDirection: 'paused',
    limitReplayPath: true,
  });

  setTimeout(() => {
    gameState.update(state => ({
      ...state,
      availableMoves: core.getAvailableMoves(row, col, state.boardSize, {}, get(settingsStore).blockOnVisitCount),
    }));
  }, 550);
}

/**
 * Resets the game with a new board size.
 * @private
 * @param {number} newSize
 */
function _updateBoardSize(newSize: number) {
  resetGame({ newSize });
}

/**
 * Встановлює новий розмір дошки. Якщо є поточний рахунок — показує модалку для підтвердження.
 * @param {number} newSize Новий розмір дошки
 */
export function setBoardSize(newSize: number) {
  const { score, penaltyPoints, boardSize } = get(gameState);
  // Не робити нічого, якщо розмір не змінився
  if (newSize === boardSize) {
    return;
  }
  if (score === 0 && penaltyPoints === 0) {
    _updateBoardSize(newSize);
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
            _updateBoardSize(newSize); 
            modalStore.closeModal(); 
          } 
        },
        { textKey: 'modal.resetScoreCancel', onClick: modalStore.closeModal }
      ]
    });
  }
}

/**
 * Встановлює напрямок руху для гравця. Оновлює вибір відстані.
 * @param {import('$lib/gameCore').Direction} dir
 */
export function setDirection(dir: import('$lib/gameCore').Direction) {
  playerInputStore.update(state => {
    const { boardSize } = get(gameState);
    const maxDist = boardSize - 1;
    let newDistance = state.selectedDistance;
    let newManuallySelected = state.distanceManuallySelected;

    if (state.selectedDirection !== dir) {
      if (!state.distanceManuallySelected) {
        newDistance = 1;
        newManuallySelected = false;
      }
    } else {
      if (!state.distanceManuallySelected) {
        newDistance = (!state.selectedDistance || state.selectedDistance >= maxDist) ? 1 : state.selectedDistance + 1;
        newManuallySelected = false;
      }
    }
    return { ...state, selectedDirection: dir, selectedDistance: newDistance, distanceManuallySelected: newManuallySelected };
  });
  if (get(computerLastMoveDisplayStore)) {
    computerLastMoveDisplayStore.set(null);
  }
}

/**
 * Встановлює відстань руху для гравця.
 * @param {number} dist
 */
export function setDistance(dist: number) {
  playerInputStore.update(state => ({ ...state, selectedDistance: dist, distanceManuallySelected: true }));
  if (get(computerLastMoveDisplayStore)) {
    computerLastMoveDisplayStore.set(null);
  }
}

/**
 * Виконує хід гравця: оновлює позицію, історію, доступні ходи.
 * @param {number} newRow
 * @param {number} newCol
 */
export function performMove(newRow: number, newCol: number) {
  gameState.update(state => {
    const { playerRow, playerCol, boardSize } = state;
    if (playerRow === null || playerCol === null) return state;

    const newBoard = state.board.map(row => row.slice());

    // 1. Очищуємо стару позицію, якщо вона була в межах дошки
    if (playerRow >= 0 && playerRow < boardSize && playerCol >= 0 && playerCol < boardSize) {
      newBoard[playerRow][playerCol] = 0;
    }

    // 2. Встановлюємо нову позицію, ТІЛЬКИ ЯКЩО вона в межах дошки
    if (newRow >= 0 && newRow < boardSize && newCol >= 0 && newCol < boardSize) {
      newBoard[newRow][newCol] = 1;
    }

    const newVisitCounts = { ...state.cellVisitCounts };
    if (get(settingsStore).blockModeEnabled) {
      const cellKey = `${playerRow}-${playerCol}`;
      newVisitCounts[cellKey] = (newVisitCounts[cellKey] || 0) + 1;
    }

    // 3. Оновлюємо логічні координати гравця в будь-якому випадку
    return {
      ...state,
      board: newBoard,
      playerRow: newRow,
      playerCol: newCol,
      cellVisitCounts: newVisitCounts,
      moveHistory: [...state.moveHistory, { pos: { row: newRow, col: newCol }, blocked: [], visits: newVisitCounts }],
    };
  });
  updateAvailableMoves();
}

/**
 * Оновлює список доступних ходів для поточної позиції гравця.
 */
export function updateAvailableMoves() {
  gameState.update(state => {
    const { playerRow, playerCol, boardSize, cellVisitCounts } = state;
    if (playerRow === null || playerCol === null) return state;
    const { blockOnVisitCount } = get(settingsStore);
    const newAvailableMoves = core.getAvailableMoves(playerRow, playerCol, boardSize, cellVisitCounts, blockOnVisitCount);
    return { ...state, availableMoves: newAvailableMoves };
  });
}

/**
 * Обробляє логіку ходу гравця, включаючи нарахування балів, штрафів та бонусних лічильників.
 * @param {number} startRow
 * @param {number} startCol
 * @param {number} newRow
 * @param {number} newCol
 */
export function processPlayerMove(startRow: number, startCol: number, newRow: number, newCol: number) {
  const settings = get(settingsStore);
  const { lastComputerMove, selectedDistance, selectedDirection } = get(playerInputStore);
  const { cellVisitCounts, score: oldScore } = get(gameState);

  // 1. Розрахунок базових балів за хід
  let scoreChange = 1;
  if (!settings.showBoard) scoreChange = 3;
  else if (!settings.showQueen) scoreChange = 2;

  // 2. Розрахунок штрафу за гарантовано безпечний хід
  // Штраф нараховується, якщо гравець робить хід у протилежному напрямку після ходу комп'ютера,
  // і відстань менша або дорівнює попередній, але тільки якщо НЕ увімкнено режим заблокованих клітинок
  let penaltyChange = 0;
  if (
    !settings.blockModeEnabled &&
    lastComputerMove &&
    selectedDirection === core.oppositeDirections[lastComputerMove.direction] &&
    selectedDistance != null &&
    selectedDistance <= lastComputerMove.distance
  ) {
    penaltyChange = 2;
  }

  // 3. Оновлення лічильника ходів у режимі блокування
  const blockModeMovesChange = settings.blockModeEnabled ? 1 : 0;

  // 4. Підрахунок перестрибнутих клітинок
  const jumpedCellsChange = settings.blockModeEnabled 
    ? core.countJumpedCells(startRow, startCol, newRow, newCol, cellVisitCounts, settings.blockOnVisitCount)
    : 0;

  // 5. Атомарне оновлення стану гри
  gameState.update(s => { 
    const newScore = s.score + scoreChange;
    console.log('[processPlayerMove] oldScore:', s.score, 'scoreChange:', scoreChange, 'newScore:', newScore, 'penaltyChange:', penaltyChange, 'blockModeMovesChange:', blockModeMovesChange, 'jumpedCellsChange:', jumpedCellsChange);
    return {
      ...s, 
      score: newScore,
      penaltyPoints: s.penaltyPoints + penaltyChange,
      movesInBlockMode: s.movesInBlockMode + blockModeMovesChange,
      jumpedBlockedCells: s.jumpedBlockedCells + jumpedCellsChange,
    };
  });
}

/**
 * Завершує гру, оновлюючи стан.
 * @param {string} reasonKey Ключ причини завершення гри для локалізації
 */
export function endGame(reasonKey: string, reasonValues: Record<string, any> | null = null) {
  const state = get(gameState);
  const finalScoreDetails = core.calculateFinalScore(state);
  console.log('[endGame] state.score:', state.score, 'finalScoreDetails:', finalScoreDetails);
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
    gameOverReasonValues: reasonValues
  }));
}

/**
 * Фіналізує гру, яка вже знаходиться в стані isGameOver,
 * оновлюючи причину завершення.
 * @param {string} reasonKey
 */
export function finalizeGameWithBonus(reasonKey: string) {
  // 1. Спочатку оновлюємо прапорець
  gameState.update(s => ({ ...s, finishedByFinishButton: true }));

  // 2. Тепер беремо оновлений стан
  const state = get(gameState);
  const finalScoreDetails = core.calculateFinalScore(state);

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
}

/**
 * Продовжує гру після успішної заяви "Ходів немає", очищуючи поле.
 */
export function continueAfterNoMoves() {
  gameState.update(state => {
    const { playerRow, playerCol, boardSize } = state;
    if (playerRow === null || playerCol === null) return state;

    // Скидаємо лічильники відвідувань та стан завершення гри
    const newState = {
      ...state,
      isGameOver: false,
      cellVisitCounts: {},
      finishedByNoMovesButton: false,
      currentPlayerIndex: 0, // Повертаємо хід гравцю
      // noMovesClaimsCount: 0, // Видалено! Лічильник не скидається при 'Продовжити'
    };

    // Оновлюємо доступні ходи з чистого поля
    newState.availableMoves = core.getAvailableMoves(playerRow, playerCol, boardSize, {}, get(settingsStore).blockOnVisitCount);
    
    return newState;
  });
  // Закриваємо модальне вікно, щоб гра реально продовжилася
  import('$lib/stores/modalStore.js').then(m => m.modalStore.closeModal());
}

/**
 * Запускає режим перегляду повтору гри.
 */
export function startReplay() {
  // Модальне вікно буде закрито глобальним обробником у +layout.svelte.
  modalService.closeModal();

  const { moveHistory, boardSize } = get(gameState);
  sessionStorage.setItem('replayData', JSON.stringify({ moveHistory, boardSize }));
  
  replayStore.update(state => ({ ...state, isReplayMode: true, replayCurrentStep: 0 }));
  
  goto(`${base}/replay`);
}

/**
 * Зупиняє режим перегляду повтору гри та повертає до фінального модального вікна.
 */
export function stopReplay() {
    if (autoPlayInterval) clearInterval(autoPlayInterval);
    replayStore.update(s => ({ ...s, isReplayMode: false, autoPlayDirection: 'paused' }));
    // Optionally show game over modal again
    endGame('modal.gameOverReasonOut'); // Generic reason
}

/**
 * Переходить до вказаного кроку у повторі гри.
 * @param {number} step Номер кроку (індекс у історії ходів)
 */
export function goToReplayStep(step: number) {
    replayStore.update(state => {
        const { moveHistory } = get(gameState);
        const newStep = Math.max(0, Math.min(step, (moveHistory?.length || 1) - 1));
        return { ...state, replayCurrentStep: newStep };
    });
}

/**
 * Перемикає автопрогравання повтору гри вперед (або ставить на паузу).
 */
export function toggleAutoPlayForward() {
    if (autoPlayInterval) clearInterval(autoPlayInterval);
    const state = get(replayStore);
    if (state.autoPlayDirection === 'forward') {
        replayStore.update(s => ({ ...s, autoPlayDirection: 'paused' }));
    } else {
        const { moveHistory } = get(gameState);
        if (state.replayCurrentStep >= (moveHistory?.length || 1) - 1) {
            goToReplayStep(0);
        }
        replayStore.update(s => ({ ...s, autoPlayDirection: 'forward' }));
        autoPlayInterval = setInterval(() => {
            const { replayCurrentStep } = get(replayStore);
            const { moveHistory } = get(gameState);
            if (replayCurrentStep < (moveHistory?.length || 1) - 1) {
                goToReplayStep(replayCurrentStep + 1);
            } else {
                if (autoPlayInterval) clearInterval(autoPlayInterval);
                replayStore.update(s => ({ ...s, autoPlayDirection: 'paused' }));
            }
        }, 1000);
    }
} 