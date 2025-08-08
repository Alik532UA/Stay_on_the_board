import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/svelte';
import { get } from 'svelte/store';
import { localGameStore } from '$lib/stores/localGameStore.js';
import PlayerManager from '$lib/components/local-setup/PlayerManager.svelte';
import LocalGameSettings from '$lib/components/local-setup/LocalGameSettings.svelte';

// Мокаємо svelte-i18n
vi.mock('svelte-i18n', () => ({
  _: vi.fn((/** @type {string} */ key) => {
    const translations = {
      'localGame.playerManagerTitle': 'Менеджер гравців',
      'localGame.addPlayer': 'Додати гравця',
      'localGame.removePlayer': 'Видалити гравця',
      'localGame.startGame': 'Почати гру',
      'localGame.settingsTitle': 'Налаштування гри',
      'localGame.lockSettings': 'Заборонити зміни під час гри',
      'settings.boardSize': 'Розмір дошки',
      'gameControls.blockMode': 'Режим заблокованих клітинок',
      'gameModes.autoHideBoard': 'Автоматично приховувати дошку'
    };
    return /** @type {string} */ (translations[/** @type {keyof typeof translations} */ (key)] || key);
  })
}));

describe('Local Game UI Components', () => {
  beforeEach(() => {
    localGameStore.resetStore();
  });

  describe('PlayerManager Component', () => {
    it('повинен відображати список гравців', () => {
      const { container } = render(PlayerManager);
      
      const playerRows = container.querySelectorAll('.player-row');
      expect(playerRows).toHaveLength(2); // Початкова кількість гравців
    });

    it('повинен додавати нового гравця при натисканні кнопки', async () => {
      const { container } = render(PlayerManager);
      
      const addButton = container.querySelector('.add-player-btn');
      expect(addButton).toBeTruthy();
      
      await fireEvent.click(addButton);
      
      const playerRows = container.querySelectorAll('.player-row');
      expect(playerRows).toHaveLength(3); // Додався новий гравець
      
      const state = get(localGameStore);
      expect(state.players).toHaveLength(3);
    });

    it('повинен видаляти гравця при натисканні кнопки видалення', async () => {
      const { container } = render(PlayerManager);
      
      // Спочатку додаємо гравця
      const addButton = container.querySelector('.add-player-btn');
      await fireEvent.click(addButton);
      
      let playerRows = container.querySelectorAll('.player-row');
      expect(playerRows).toHaveLength(3);
      
      // Видаляємо останнього гравця
      const removeButtons = container.querySelectorAll('.remove-player-btn');
      const lastRemoveButton = removeButtons[removeButtons.length - 1];
      await fireEvent.click(lastRemoveButton);
      
      playerRows = container.querySelectorAll('.player-row');
      expect(playerRows).toHaveLength(2);
      
      const state = get(localGameStore);
      expect(state.players).toHaveLength(2);
    });

    it('повинен оновлювати ім\'я гравця при редагуванні', async () => {
      const { container } = render(PlayerManager);
      
      const nameInputs = container.querySelectorAll('.player-name-input');
      const firstInput = nameInputs[0];
      
      await fireEvent.input(firstInput, { target: { value: 'Нове ім\'я' } });
      
      const state = get(localGameStore);
      expect(state.players[0].name).toBe('Нове ім\'я');
    });

    it('повинен оновлювати колір гравця при зміні', async () => {
      const { container } = render(PlayerManager);
      
      const colorInputs = container.querySelectorAll('.player-color-input');
      const firstInput = colorInputs[0];
      
      await fireEvent.input(firstInput, { target: { value: '#ff0000' } });
      
      const state = get(localGameStore);
      expect(state.players[0].color).toBe('#ff0000');
    });

    it('повинен мати кнопку "Почати гру"', () => {
      const { container } = render(PlayerManager);
      
      const startButton = container.querySelector('.start-game-btn');
      expect(startButton).toBeTruthy();
      expect(startButton.textContent).toContain('Почати гру');
    });

    it('повинен блокувати кнопку додавання при досягненні ліміту', async () => {
      const { container } = render(PlayerManager);
      
      const addButton = container.querySelector('.add-player-btn');
      
      // Додаємо гравців до ліміту
      for (let i = 0; i < 6; i++) {
        await fireEvent.click(addButton);
      }
      
      expect(/** @type {HTMLButtonElement} */ (addButton).disabled).toBe(true);
      
      const state = get(localGameStore);
      expect(state.players).toHaveLength(8);
    });

    it('повинен блокувати кнопки видалення при мінімальній кількості', () => {
      const { container } = render(PlayerManager);
      
      const removeButtons = container.querySelectorAll('.remove-player-btn');
      
      removeButtons.forEach(/** @type {any} */ button => {
        expect(/** @type {HTMLButtonElement} */ (button).disabled).toBe(true); // Мінімум 2 гравці
      });
    });
  });

  describe('LocalGameSettings Component', () => {
    it('повинен відображати налаштування розміру дошки', () => {
      const { container } = render(LocalGameSettings);
      
      const sizeDisplay = container.querySelector('.current-size');
      expect(sizeDisplay).toBeTruthy();
      expect(sizeDisplay.textContent).toBe('4x4'); // Початковий розмір
    });

    it('повинен збільшувати розмір дошки при натисканні "+"', async () => {
      const { container } = render(LocalGameSettings);
      
      const adjustButtons = container.querySelectorAll('.adjust-btn');
      const increaseButton = adjustButtons[1]; // Кнопка "+"
      
      await fireEvent.click(increaseButton);
      
      const sizeDisplay = container.querySelector('.current-size');
      expect(sizeDisplay.textContent).toBe('5x5');
      
      const state = get(localGameStore);
      expect(state.settings.boardSize).toBe(5);
    });

    it('повинен зменшувати розмір дошки при натисканні "-"', async () => {
      const { container } = render(LocalGameSettings);
      
      // Спочатку збільшуємо розмір
      const adjustButtons = container.querySelectorAll('.adjust-btn');
      const increaseButton = adjustButtons[1];
      await fireEvent.click(increaseButton);
      
      // Потім зменшуємо
      const decreaseButton = adjustButtons[0];
      await fireEvent.click(decreaseButton);
      
      const sizeDisplay = container.querySelector('.current-size');
      expect(sizeDisplay.textContent).toBe('4x4');
      
      const state = get(localGameStore);
      expect(state.settings.boardSize).toBe(4);
    });

    it('повинен блокувати кнопку зменшення при мінімальному розмірі', () => {
      const { container } = render(LocalGameSettings);
      
      // Встановлюємо мінімальний розмір
      localGameStore.updateSettings({ boardSize: 2 });
      
      const adjustButtons = container.querySelectorAll('.adjust-btn');
      const decreaseButton = adjustButtons[0];
      
      expect(/** @type {HTMLButtonElement} */ (decreaseButton).disabled).toBe(true);
    });

    it('повинен блокувати кнопку збільшення при максимальному розмірі', () => {
      const { container } = render(LocalGameSettings);
      
      // Встановлюємо максимальний розмір
      localGameStore.updateSettings({ boardSize: 9 });
      
      const adjustButtons = container.querySelectorAll('.adjust-btn');
      const increaseButton = adjustButtons[1];
      
      expect(/** @type {HTMLButtonElement} */ (increaseButton).disabled).toBe(true);
    });

    it('повинен перемикати режим заблокованих клітинок', async () => {
      const { container } = render(LocalGameSettings);
      
      const checkboxes = container.querySelectorAll('input[type="checkbox"]');
      const blockModeCheckbox = checkboxes[0];
      
      const initialState = get(localGameStore);
      expect(initialState.settings.blockModeEnabled).toBe(true);
      
      await fireEvent.click(blockModeCheckbox);
      
      const state = get(localGameStore);
      expect(state.settings.blockModeEnabled).toBe(false);
    });

    it('повинен перемикати автоматичне приховування дошки', async () => {
      const { container } = render(LocalGameSettings);
      
      const checkboxes = container.querySelectorAll('input[type="checkbox"]');
      const autoHideCheckbox = checkboxes[1];
      
      const initialState = get(localGameStore);
      expect(initialState.settings.autoHideBoard).toBe(true);
      
      await fireEvent.click(autoHideCheckbox);
      
      const state = get(localGameStore);
      expect(state.settings.autoHideBoard).toBe(false);
    });

    it('повинен перемикати блокування налаштувань', async () => {
      const { container } = render(LocalGameSettings);
      
      const checkboxes = container.querySelectorAll('input[type="checkbox"]');
      const lockSettingsCheckbox = checkboxes[2];
      
      const initialState = get(localGameStore);
      expect(initialState.settings.lockSettings).toBe(true);
      
      await fireEvent.click(lockSettingsCheckbox);
      
      const state = get(localGameStore);
      expect(state.settings.lockSettings).toBe(false);
    });

    it('повинен відображати правильні лейбли', () => {
      const { container } = render(LocalGameSettings);
      
      const title = container.querySelector('h2');
      expect(title.textContent).toBe('Налаштування гри');
      
      const labels = container.querySelectorAll('span');
      const hasBoardSizeLabel = Array.from(labels).some(label => 
        label.textContent.includes('Розмір дошки')
      );
      expect(hasBoardSizeLabel).toBe(true);
    });
  });

  describe('Інтеграція компонентів', () => {
    it('повинен синхронізувати стан між компонентами', async () => {
      const { container: playerManager } = render(PlayerManager);
      const { container: settings } = render(LocalGameSettings);
      
      // Змінюємо налаштування в LocalGameSettings
      const adjustButtons = settings.querySelectorAll('.adjust-btn');
      const increaseButton = adjustButtons[1];
      await fireEvent.click(increaseButton);
      
      // Перевіряємо, що зміни відобразилися в PlayerManager
      const state = get(localGameStore);
      expect(state.settings.boardSize).toBe(5);
      
      // Додаємо гравця в PlayerManager
      const addButton = playerManager.querySelector('.add-player-btn');
      await fireEvent.click(addButton);
      
      // Перевіряємо, що гравець додався
      expect(state.players).toHaveLength(3);
    });

    it('повинен правильно обробляти реактивні оновлення', async () => {
      const { container } = render(PlayerManager);
      
      // Змінюємо стан напряму
      localGameStore.addPlayer();
      
      // Перевіряємо, що UI оновився
      const playerRows = container.querySelectorAll('.player-row');
      expect(playerRows).toHaveLength(3);
      
      // Змінюємо налаштування
      localGameStore.updateSettings({ boardSize: 6 });
      
      // Перевіряємо, що налаштування оновилися
      const state = get(localGameStore);
      expect(state.settings.boardSize).toBe(6);
    });
  });

  describe('Валідація та обробка помилок', () => {
    it('повинен правильно обробляти порожні імена гравців', async () => {
      const { container } = render(PlayerManager);
      
      const nameInputs = container.querySelectorAll('.player-name-input');
      const firstInput = nameInputs[0];
      
      await fireEvent.input(firstInput, { target: { value: '' } });
      
      const state = get(localGameStore);
      expect(state.players[0].name).toBe('');
    });

    it('повинен правильно обробляти невалідні кольори', async () => {
      const { container } = render(PlayerManager);
      
      const colorInputs = container.querySelectorAll('.player-color-input');
      const firstInput = colorInputs[0];
      
      await fireEvent.input(firstInput, { target: { value: 'invalid-color' } });
      
      const state = get(localGameStore);
      expect(state.players[0].color).toBe('invalid-color');
    });

    it('повинен правильно обробляти граничні значення розміру дошки', () => {
      const { container } = render(LocalGameSettings);
      
      // Встановлюємо мінімальний розмір
      localGameStore.updateSettings({ boardSize: 2 });
      
      const adjustButtons = container.querySelectorAll('.adjust-btn');
      const decreaseButton = adjustButtons[0];
      const increaseButton = adjustButtons[1];
      
      expect(/** @type {HTMLButtonElement} */ (decreaseButton).disabled).toBe(true);
      expect(/** @type {HTMLButtonElement} */ (increaseButton).disabled).toBe(false);
      
      // Встановлюємо максимальний розмір
      localGameStore.updateSettings({ boardSize: 9 });
      
      expect(/** @type {HTMLButtonElement} */ (decreaseButton).disabled).toBe(false);
      expect(/** @type {HTMLButtonElement} */ (increaseButton).disabled).toBe(true);
    });
  });
}); 