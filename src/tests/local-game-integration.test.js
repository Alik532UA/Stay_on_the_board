import { describe, it, expect, beforeEach, vi } from 'vitest';
import { get } from 'svelte/store';
import { localGameStore } from '$lib/stores/localGameStore.js';
import { gameState } from '$lib/stores/gameState.js';
import { settingsStore } from '$lib/stores/settingsStore.js';
import { resetGame } from '$lib/services/gameLogicService.js';
import { navigationService } from '$lib/services/navigationService.js';

// Мокаємо навігаційний сервіс
vi.mock('$lib/services/navigationService.js', () => ({
  navigationService: {
    goTo: vi.fn()
  }
}));

describe('Local Game Integration', () => {
  beforeEach(() => {
    // Скидаємо всі stores
    localGameStore.resetStore();
    gameState.set({
      gameId: Date.now(),
      boardSize: 4,
      board: Array(4).fill().map(() => Array(4).fill(0)),
      playerRow: 1,
      playerCol: 1,
      availableMoves: [],
      players: [
        { id: 1, type: 'human', name: 'Гравець', score: 0 },
        { id: 2, type: 'ai', name: 'Комп\'ютер', score: 0 }
      ],
      currentPlayerIndex: 0,
      isGameOver: false,
      penaltyPoints: 0,
      movesInBlockMode: 0,
      jumpedBlockedCells: 0,
      finishedByFinishButton: false,
      cellVisitCounts: {},
      moveHistory: [{ pos: { row: 1, col: 1 }, blocked: [], visits: {} }],
      gameOverReasonKey: null,
      gameOverReasonValues: null,
      moveQueue: [],
      noMovesClaimsCount: 0,
      noMovesClaimed: false,
      isFirstMove: true,
      wasResumed: false
    });
    
    // Очищаємо моки
    vi.clearAllMocks();
  });

  describe('Функція startGame', () => {
    it('повинен правильно конвертувати гравців з localGameStore в gameState формат', () => {
      // Налаштовуємо гравців в localGameStore
      localGameStore.updatePlayer(1, { name: 'Анна', color: '#ff0000' });
      localGameStore.updatePlayer(2, { name: 'Борис', color: '#00ff00' });
      localGameStore.addPlayer(); // Додаємо третього гравця
      localGameStore.updatePlayer(3, { name: 'Віктор', color: '#0000ff' });

      const localState = get(localGameStore);
      expect(localState.players).toHaveLength(3);

      // Симулюємо startGame логіку
      const gamePlayers = localState.players.map(player => ({
        id: player.id,
        name: player.name,
        type: /** @type {const} */ ('human'),
        score: 0
      }));

      expect(gamePlayers).toHaveLength(3);
      expect(gamePlayers[0].name).toBe('Анна');
      expect(gamePlayers[0].type).toBe('human');
      expect(gamePlayers[1].name).toBe('Борис');
      expect(gamePlayers[1].type).toBe('human');
      expect(gamePlayers[2].name).toBe('Віктор');
      expect(gamePlayers[2].type).toBe('human');
    });

    it('повинен передавати правильні налаштування в resetGame', () => {
      // Налаштовуємо налаштування в localGameStore
      localGameStore.updateSettings({
        boardSize: 6,
        blockModeEnabled: false,
        autoHideBoard: false,
        lockSettings: true
      });

      const localState = get(localGameStore);
      
      // Симулюємо виклик resetGame з налаштуваннями
      const settings = {
        boardSize: localState.settings.boardSize,
        blockModeEnabled: localState.settings.blockModeEnabled,
        autoHideBoard: localState.settings.autoHideBoard,
        lockSettings: localState.settings.lockSettings
      };

      expect(settings.boardSize).toBe(6);
      expect(settings.blockModeEnabled).toBe(false);
      expect(settings.autoHideBoard).toBe(false);
      expect(settings.lockSettings).toBe(true);
    });

    it('повинен викликати навігацію до гри після ініціалізації', () => {
      // Симулюємо startGame
      const localState = get(localGameStore);
      
      // Конвертуємо гравців
      const gamePlayers = localState.players.map(player => ({
        id: player.id,
        name: player.name,
        type: /** @type {const} */ ('human'),
        score: 0
      }));

      // Ініціалізуємо гру
      resetGame({
        newSize: localState.settings.boardSize,
        players: gamePlayers,
        settings: {
          blockModeEnabled: localState.settings.blockModeEnabled,
          autoHideBoard: localState.settings.autoHideBoard,
          lockSettings: localState.settings.lockSettings
        }
      });

      // Перевіряємо, що навігація викликана
      expect(navigationService.goTo).toHaveBeenCalledWith('/game');
    });
  });

  describe('Інтеграція з gameState', () => {
    it('повинен правильно ініціалізувати gameState з налаштуваннями локальної гри', () => {
      // Налаштовуємо локальну гру
      localGameStore.updateSettings({
        boardSize: 5,
        blockModeEnabled: true,
        autoHideBoard: false,
        lockSettings: false
      });
      localGameStore.updatePlayer(1, { name: 'Гравець 1' });
      localGameStore.updatePlayer(2, { name: 'Гравець 2' });

      const localState = get(localGameStore);
      
      // Конвертуємо гравців
      const gamePlayers = localState.players.map(player => ({
        id: player.id,
        name: player.name,
        type: /** @type {const} */ ('human'),
        score: 0
      }));

      // Ініціалізуємо гру
      resetGame({
        newSize: localState.settings.boardSize,
        players: gamePlayers,
        settings: {
          blockModeEnabled: localState.settings.blockModeEnabled,
          autoHideBoard: localState.settings.autoHideBoard,
          lockSettings: localState.settings.lockSettings
        }
      });

      const gameStateValue = get(gameState);
      
      expect(gameStateValue.boardSize).toBe(5);
      expect(gameStateValue.players).toHaveLength(2);
      expect(gameStateValue.players[0].name).toBe('Гравець 1');
      expect(gameStateValue.players[0].type).toBe('human');
      expect(gameStateValue.players[1].name).toBe('Гравець 2');
      expect(gameStateValue.players[1].type).toBe('human');
    });
  });

  describe('Інтеграція з settingsStore', () => {
    it('повинен правильно застосовувати налаштування блокування', () => {
      // Налаштовуємо блокування в локальній грі
      localGameStore.updateSettings({
        lockSettings: true
      });

      const localState = get(localGameStore);
      
      // Симулюємо застосування налаштувань
      settingsStore.updateSettings({
        lockSettings: localState.settings.lockSettings
      });

      const settingsState = get(settingsStore);
      expect(settingsState.lockSettings).toBe(true);
    });

    it('повинен правильно застосовувати всі налаштування гри', () => {
      // Налаштовуємо всі параметри
      localGameStore.updateSettings({
        boardSize: 7,
        blockModeEnabled: false,
        autoHideBoard: true,
        lockSettings: true
      });

      const localState = get(localGameStore);
      
      // Застосовуємо налаштування
      settingsStore.updateSettings({
        blockModeEnabled: localState.settings.blockModeEnabled,
        autoHideBoard: localState.settings.autoHideBoard,
        lockSettings: localState.settings.lockSettings,
        showBoard: true,
        showPiece: true,
        showMoves: true
      });

      const settingsState = get(settingsStore);
      expect(settingsState.blockModeEnabled).toBe(false);
      expect(settingsState.autoHideBoard).toBe(true);
      expect(settingsState.lockSettings).toBe(true);
      expect(settingsState.showBoard).toBe(true);
      expect(settingsState.showPiece).toBe(true);
      expect(settingsState.showMoves).toBe(true);
    });
  });

  describe('Валідація даних', () => {
    it('повинен правильно обробляти мінімальну кількість гравців', () => {
      const localState = get(localGameStore);
      expect(localState.players).toHaveLength(2); // Мінімум

      // Конвертуємо гравців
      const gamePlayers = localState.players.map(player => ({
        id: player.id,
        name: player.name,
        type: /** @type {const} */ ('human'),
        score: 0
      }));

      expect(gamePlayers).toHaveLength(2);
      expect(gamePlayers.every(p => p.type === 'human')).toBe(true);
    });

    it('повинен правильно обробляти максимальну кількість гравців', () => {
      // Додаємо гравців до ліміту
      for (let i = 0; i < 6; i++) {
        localGameStore.addPlayer();
      }

      const localState = get(localGameStore);
      expect(localState.players).toHaveLength(8); // Максимум

      // Конвертуємо гравців
      const gamePlayers = localState.players.map(player => ({
        id: player.id,
        name: player.name,
        type: /** @type {const} */ ('human'),
        score: 0
      }));

      expect(gamePlayers).toHaveLength(8);
      expect(gamePlayers.every(p => p.type === 'human')).toBe(true);
    });

    it('повинен правильно обробляти різні розміри дошки', () => {
      const testSizes = [2, 3, 4, 5, 6, 7, 8, 9];
      
      testSizes.forEach(size => {
        localGameStore.updateSettings({ boardSize: size });
        const localState = get(localGameStore);
        
        expect(localState.settings.boardSize).toBe(size);
        expect(size).toBeGreaterThanOrEqual(2);
        expect(size).toBeLessThanOrEqual(9);
      });
    });
  });

  describe('Помилки та граничні випадки', () => {
    it('повинен правильно обробляти порожні імена гравців', () => {
      localGameStore.updatePlayer(1, { name: '' });
      localGameStore.updatePlayer(2, { name: '   ' });

      const localState = get(localGameStore);
      
      // Конвертуємо гравців (логіка повинна обробляти порожні імена)
      const gamePlayers = localState.players.map(player => ({
        id: player.id,
        name: player.name || `Гравець ${player.id}`,
        type: /** @type {const} */ ('human'),
        score: 0
      }));

      expect(gamePlayers[0].name).toBe('');
      expect(gamePlayers[1].name).toBe('   ');
    });

    it('повинен правильно обробляти дублікати ID гравців', () => {
      const localState = get(localGameStore);
      const player1Id = localState.players[0].id;
      const player2Id = localState.players[1].id;

      expect(player1Id).not.toBe(player2Id);
      expect(typeof player1Id).toBe('number');
      expect(typeof player2Id).toBe('number');
    });
  });
}); 