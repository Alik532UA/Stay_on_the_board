import { describe, it, expect, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import { localGameStore } from '$lib/stores/localGameStore.js';

describe('LocalGameStore', () => {
  beforeEach(() => {
    // Скидаємо store перед кожним тестом
    localGameStore.resetStore();
  });

  describe('Початковий стан', () => {
    it('повинен мати правильну початкову структуру', () => {
      const state = get(localGameStore);
      
      expect(state).toHaveProperty('players');
      expect(state).toHaveProperty('settings');
      expect(Array.isArray(state.players)).toBe(true);
      expect(typeof state.settings).toBe('object');
    });

    it('повинен мати двох гравців за замовчуванням', () => {
      const state = get(localGameStore);
      
      expect(state.players).toHaveLength(2);
      expect(state.players[0]).toHaveProperty('id');
      expect(state.players[0]).toHaveProperty('name');
      expect(state.players[0]).toHaveProperty('color');
      expect(state.players[1]).toHaveProperty('id');
      expect(state.players[1]).toHaveProperty('name');
      expect(state.players[1]).toHaveProperty('color');
    });

    it('повинен мати правильні налаштування за замовчуванням', () => {
      const state = get(localGameStore);
      
      expect(state.settings.boardSize).toBe(4);
      expect(state.settings.blockModeEnabled).toBe(true);
      expect(state.settings.autoHideBoard).toBe(true);
      expect(state.settings.lockSettings).toBe(true);
    });
  });

  describe('Керування гравцями', () => {
    it('повинен додавати нового гравця', () => {
      const initialState = get(localGameStore);
      const initialPlayerCount = initialState.players.length;
      
      localGameStore.addPlayer();
      
      const newState = get(localGameStore);
      expect(newState.players).toHaveLength(initialPlayerCount + 1);
      
      const newPlayer = newState.players[newState.players.length - 1];
      expect(newPlayer).toHaveProperty('id');
      expect(newPlayer).toHaveProperty('name');
      expect(newPlayer).toHaveProperty('color');
      expect(newPlayer.name).toMatch(/Гравець \d+/);
    });

    it('повинен видаляти гравця за ID', () => {
      const initialState = get(localGameStore);
      const playerToRemove = initialState.players[0];
      
      localGameStore.removePlayer(playerToRemove.id);
      
      const newState = get(localGameStore);
      expect(newState.players).toHaveLength(initialState.players.length - 1);
      expect(newState.players.find(p => p.id === playerToRemove.id)).toBeUndefined();
    });

    it('не повинен видаляти гравця, якщо залишилося менше двох', () => {
      const initialState = get(localGameStore);
      
      // Видаляємо одного гравця
      localGameStore.removePlayer(initialState.players[0].id);
      
      const stateAfterFirstRemoval = get(localGameStore);
      expect(stateAfterFirstRemoval.players).toHaveLength(1);
      
      // Спроба видалити ще одного гравця
      localGameStore.removePlayer(stateAfterFirstRemoval.players[0].id);
      
      const stateAfterSecondRemoval = get(localGameStore);
      expect(stateAfterSecondRemoval.players).toHaveLength(1); // Не змінилося
    });

    it('не повинен додавати гравця, якщо досягнуто ліміт', () => {
      // Додаємо гравців до ліміту (8)
      for (let i = 0; i < 6; i++) {
        localGameStore.addPlayer();
      }
      
      const stateAtLimit = get(localGameStore);
      expect(stateAtLimit.players).toHaveLength(8);
      
      // Спроба додати ще одного гравця
      localGameStore.addPlayer();
      
      const stateAfterAttempt = get(localGameStore);
      expect(stateAfterAttempt.players).toHaveLength(8); // Не змінилося
    });

    it('повинен оновлювати дані гравця', () => {
      const initialState = get(localGameStore);
      const playerToUpdate = initialState.players[0];
      
      localGameStore.updatePlayer(playerToUpdate.id, {
        name: 'Нове ім\'я',
        color: '#ff0000'
      });
      
      const newState = get(localGameStore);
      const updatedPlayer = newState.players.find(p => p.id === playerToUpdate.id);
      
      expect(updatedPlayer.name).toBe('Нове ім\'я');
      expect(updatedPlayer.color).toBe('#ff0000');
    });

    it('повинен генерувати унікальні ID для гравців', () => {
      const initialState = get(localGameStore);
      const player1Id = initialState.players[0].id;
      const player2Id = initialState.players[1].id;
      
      expect(player1Id).not.toBe(player2Id);
      expect(typeof player1Id).toBe('number');
      expect(typeof player2Id).toBe('number');
    });
  });

  describe('Керування налаштуваннями', () => {
    it('повинен оновлювати налаштування гри', () => {
      const newSettings = {
        boardSize: 6,
        blockModeEnabled: false,
        autoHideBoard: false,
        lockSettings: false
      };
      
      localGameStore.updateSettings(newSettings);
      
      const state = get(localGameStore);
      expect(state.settings.boardSize).toBe(6);
      expect(state.settings.blockModeEnabled).toBe(false);
      expect(state.settings.autoHideBoard).toBe(false);
      expect(state.settings.lockSettings).toBe(false);
    });

    it('повинен частково оновлювати налаштування', () => {
      const initialState = get(localGameStore);
      
      localGameStore.updateSettings({ boardSize: 8 });
      
      const state = get(localGameStore);
      expect(state.settings.boardSize).toBe(8);
      expect(state.settings.blockModeEnabled).toBe(initialState.settings.blockModeEnabled);
      expect(state.settings.autoHideBoard).toBe(initialState.settings.autoHideBoard);
      expect(state.settings.lockSettings).toBe(initialState.settings.lockSettings);
    });
  });

  describe('Скидання стану', () => {
    it('повинен скидати store до початкового стану', () => {
      // Змінюємо стан
      localGameStore.addPlayer();
      localGameStore.updateSettings({ boardSize: 8 });
      
      // Скидаємо
      localGameStore.resetStore();
      
      const state = get(localGameStore);
      expect(state.players).toHaveLength(2);
      expect(state.settings.boardSize).toBe(4);
      expect(state.settings.blockModeEnabled).toBe(true);
      expect(state.settings.autoHideBoard).toBe(true);
      expect(state.settings.lockSettings).toBe(true);
    });
  });

  describe('Інтеграція з Svelte', () => {
    it('повинен бути реактивним store', () => {
      let callCount = 0;
      const unsubscribe = localGameStore.subscribe(() => {
        callCount++;
      });
      
      // Змінюємо стан
      localGameStore.addPlayer();
      localGameStore.updateSettings({ boardSize: 6 });
      
      expect(callCount).toBeGreaterThan(0);
      
      unsubscribe();
    });
  });
}); 