import { get } from 'svelte/store';
import { boardStore, type BoardState } from '$lib/stores/boardStore';
import { playerStore, type PlayerState } from '$lib/stores/playerStore';
import { scoreStore, type ScoreState } from '$lib/stores/scoreStore';
import { gameSettingsStore } from '$lib/stores/gameSettingsStore';
import { testModeStore } from '$lib/stores/testModeStore';
import { gameOverStore } from '$lib/stores/gameOverStore';
import { getInitialPosition } from '$lib/utils/initialPositionUtils';
import { createEmptyBoard } from '$lib/utils/boardUtils';
import type { Player, BonusHistoryItem } from '$lib/models/player';
import { availableMovesService } from './availableMovesService';
import { animationService } from './animationService';
import { logService } from './logService';
import { DEFAULT_PLAYER_NAMES } from '$lib/config/defaultPlayers';
import { getRandomUnusedColor } from '$lib/utils/playerUtils';
import { initialUIState, uiStateStore, type UiState } from '$lib/stores/uiStateStore';
import { uiEffectsStore } from '$lib/stores/uiEffectsStore';

export const gameService = {
  initializeNewGame(config: {
    size?: number;
    players?: Player[];
  } = {}) {
    logService.init('[GameService] initializeNewGame: Створення нового ігрового стану...', config);

    // Ініціалізація слухачів подій для UI сторів
    uiStateStore.initEventListeners();
    uiEffectsStore.initEventListeners();

    // FIX: Спочатку скидаємо анімацію, щоб очистити черги і таймери.
    // Це запобігає конфліктам між старими анімаціями і новим станом дошки.
    animationService.reset();

    const settings = get(gameSettingsStore);
    const testModeState = get(testModeStore);
    const size = config.size ?? settings.boardSize;

    if (!config.players) {
      const usedColors: string[] = [];
      config.players = DEFAULT_PLAYER_NAMES.map((name, index) => {
        const color = getRandomUnusedColor(usedColors);
        usedColors.push(color);
        return {
          id: index + 1,
          type: 'human',
          name,
          score: 0,
          color,
          isComputer: false,
          penaltyPoints: 0,
          bonusPoints: 0,
          bonusHistory: [] as BonusHistoryItem[]
        };
      });
    }

    const players = config.players;

    const { row: initialRow, col: initialCol } = getInitialPosition(size, testModeState);
    const board = createEmptyBoard(size);
    board[initialRow][initialCol] = 1;

    const initialBoardState: BoardState = {
      boardSize: size,
      board,
      playerRow: initialRow,
      playerCol: initialCol,
      cellVisitCounts: {},
      moveHistory: [{ pos: { row: initialRow, col: initialCol }, blocked: [], visits: {}, blockModeEnabled: settings.blockModeEnabled }],
      moveQueue: [],
    };

    const initialPlayerState: PlayerState = {
      players,
      currentPlayerIndex: 0,
    };

    const initialScoreState: ScoreState = {
      penaltyPoints: 0,
      movesInBlockMode: 0,
      jumpedBlockedCells: 0,
      noMovesBonus: 0,
      distanceBonus: 0,
    };

    const currentUiState = get(uiStateStore);

    const newUiState: UiState = {
      ...initialUIState,
      intendedGameType: currentUiState.intendedGameType,
      onlinePlayerIndex: currentUiState.onlinePlayerIndex,
      amIHost: currentUiState.amIHost,
      testModeOverrides: currentUiState.testModeOverrides
    };

    // Оновлюємо всі стори
    boardStore.set(initialBoardState);
    playerStore.set(initialPlayerState);
    scoreStore.set(initialScoreState);
    uiStateStore.set(newUiState);

    gameOverStore.resetGameOverState();

    gameSettingsStore.updateSettings({
      showBoard: true,
      showPiece: true,
      showMoves: true
    });

    availableMovesService.updateAvailableMoves();

    // animationService.reset() вже викликано на початку, але для надійності
    // можна викликати ще раз, якщо є підозра на асинхронні ефекти,
    // але в даному випадку це зайве.
  }
};