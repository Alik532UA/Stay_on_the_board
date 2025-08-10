// src/tests/animation.test.js
import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { get } from 'svelte/store';
import { animationStore } from '../lib/stores/animationStore.js';
import { gameState } from '../lib/stores/gameState.js';
import { visualPosition } from '../lib/stores/derivedState.ts';

describe('Animation Store', () => {
  beforeEach(() => {
    // Скидаємо стан перед кожним тестом
    animationStore.reset();
    gameState.set({
      gameId: Date.now(),
      playerRow: 0,
      playerCol: 0,
      boardSize: 4,
      moveQueue: [],
      moveHistory: [],
      availableMoves: [],
      cellVisitCounts: {},
      players: [{ id: 1, name: 'Player', type: 'human', score: 0 }, { id: 2, name: 'AI', type: 'ai', score: 0 }],
      currentPlayerIndex: 0,
      penaltyPoints: 0,
      isGameOver: false,
      noMovesBonus: 0,
      noMovesClaimsCount: 0,
      board: Array(4).fill().map(() => Array(4).fill(0)),
      movesInBlockMode: 0,
      jumpedBlockedCells: 0,
      finishedByFinishButton: false,
      gameOverReasonKey: null,
      gameOverReasonValues: null,
      noMovesClaimed: false,
      isFirstMove: true,
      wasResumed: false
    });
  });

  afterEach(() => {
    // Очищаємо після кожного тесту
    animationStore.reset();
  });

  describe('Initial State', () => {
    test('початковий стан повинен бути правильним', () => {
      const state = get(animationStore);
      expect(state.isAnimating).toBe(false);
      expect(state.visualMoveQueue).toEqual([]);
      expect(state.animationQueue).toEqual([]);
      expect(state.isPlayingAnimation).toBe(false);
    });
  });

  describe('Player Move Animation', () => {
    test('хід гравця повинен показувати правильну послідовність анімації', async () => {
      // Початкова позиція
      const initialPosition = get(visualPosition);
      expect(initialPosition).toEqual({ row: 0, col: 0 });

      // Симулюємо хід гравця
      const newRow = 2;
      const newCol = 2;
      
      // Додаємо хід до moveQueue
      gameState.update(state => ({
        ...state,
        moveQueue: [...state.moveQueue, {
          from: { row: 0, col: 0 },
          to: { row: newRow, col: newCol },
          player: 1, // player: 1 для гравця
          direction: 'down-right', // напрямок ходу
          distance: 2 // відстань
        }]
      }));

      // Даємо час для запуску анімації
      await new Promise(resolve => setTimeout(resolve, 50));

      // Перевіряємо, що анімація почалася
      const animationState = get(animationStore);
      expect(animationState.isPlayingAnimation).toBe(true);
      expect(animationState.animationQueue.length).toBeGreaterThan(0);

      // Перевіряємо, що візуальна позиція залишається старою під час анімації
      const positionDuringAnimation = get(visualPosition);
      expect(positionDuringAnimation).toEqual({ row: 0, col: 0 });

      // Чекаємо завершення анімації
      await new Promise(resolve => setTimeout(resolve, 1600)); // 500ms анімація + 1000ms пауза + 100ms буфер

      // Перевіряємо, що анімація завершилася
      const finalAnimationState = get(animationStore);
      expect(finalAnimationState.isPlayingAnimation).toBe(false);
      expect(finalAnimationState.animationQueue.length).toBe(0);

      // Перевіряємо, що візуальна позиція оновилася
      const finalPosition = get(visualPosition);
      expect(finalPosition).toEqual({ row: newRow, col: newCol });
    });
  });

  describe('Computer Move Animation', () => {
    test('хід комп\'ютера повинен показувати правильну послідовність анімації', async () => {
      // Початкова позиція
      const initialPosition = get(visualPosition);
      expect(initialPosition).toEqual({ row: 0, col: 0 });

      // Симулюємо хід комп'ютера
      const newRow = 1;
      const newCol = 1;
      
      // Додаємо хід до moveQueue
      gameState.update(state => ({
        ...state,
        moveQueue: [...state.moveQueue, {
          from: { row: 0, col: 0 },
          to: { row: newRow, col: newCol },
          player: 2, // player: 2 для комп'ютера
          direction: 'down-right', // напрямок ходу
          distance: 1 // відстань
        }]
      }));

      // Даємо час для запуску анімації
      await new Promise(resolve => setTimeout(resolve, 50));

      // Перевіряємо, що анімація почалася
      const animationState = get(animationStore);
      expect(animationState.isPlayingAnimation).toBe(true);
      expect(animationState.animationQueue.length).toBeGreaterThan(0);

      // Перевіряємо, що візуальна позиція залишається старою під час анімації
      const positionDuringAnimation = get(visualPosition);
      expect(positionDuringAnimation).toEqual({ row: 0, col: 0 });

      // Чекаємо завершення анімації
      await new Promise(resolve => setTimeout(resolve, 700)); // 500ms анімація + 100ms пауза + 100ms буфер

      // Перевіряємо, що анімація завершилася
      const finalAnimationState = get(animationStore);
      expect(finalAnimationState.isPlayingAnimation).toBe(false);
      expect(finalAnimationState.animationQueue.length).toBe(0);

      // Перевіряємо, що візуальна позиція оновилася
      const finalPosition = get(visualPosition);
      expect(finalPosition).toEqual({ row: newRow, col: newCol });
    });
  });

  describe('Animation Sequence', () => {
    test('послідовність ходів повинна показувати правильну анімацію', async () => {
      // Початкова позиція
      expect(get(visualPosition)).toEqual({ row: 0, col: 0 });

      // Хід гравця
      gameState.update(state => ({
        ...state,
        moveQueue: [...state.moveQueue, {
          from: { row: 0, col: 0 },
          to: { row: 2, col: 2 },
          player: 1,
          direction: 'down-right',
          distance: 2
        }]
      }));

      // Даємо час для запуску анімації
      await new Promise(resolve => setTimeout(resolve, 50));

      // Чекаємо завершення анімації гравця
      await new Promise(resolve => setTimeout(resolve, 1600));
      expect(get(visualPosition)).toEqual({ row: 2, col: 2 });

      // Хід комп'ютера
      gameState.update(state => ({
        ...state,
        moveQueue: [...state.moveQueue, {
          from: { row: 2, col: 2 },
          to: { row: 3, col: 3 },
          player: 2,
          direction: 'down-right',
          distance: 1
        }]
      }));

      // Даємо час для запуску анімації
      await new Promise(resolve => setTimeout(resolve, 50));

      // Чекаємо завершення анімації комп'ютера
      await new Promise(resolve => setTimeout(resolve, 700));
      expect(get(visualPosition)).toEqual({ row: 3, col: 3 });
    });
  });

  describe('Animation Queue Management', () => {
    test('черга анімацій повинна правильно обробляти кілька ходів', async () => {
      // Додаємо кілька ходів одразу
      gameState.update(state => ({
        ...state,
        moveQueue: [
          {
            from: { row: 0, col: 0 },
            to: { row: 1, col: 1 },
            player: 1,
            direction: 'down-right',
            distance: 1
          },
          {
            from: { row: 1, col: 1 },
            to: { row: 2, col: 2 },
            player: 2,
            direction: 'down-right',
            distance: 1
          }
        ]
      }));

      // Даємо час для запуску анімації
      await new Promise(resolve => setTimeout(resolve, 50));

      // Перевіряємо, що анімація почалася
      const animationState = get(animationStore);
      expect(animationState.isPlayingAnimation).toBe(true);
      expect(animationState.animationQueue.length).toBe(2);

      // Чекаємо завершення всіх анімацій
      await new Promise(resolve => setTimeout(resolve, 2500)); // 2 ходи * (500ms + 1000ms/100ms) + буфер

      // Перевіряємо, що всі анімації завершилися
      const finalAnimationState = get(animationStore);
      expect(finalAnimationState.isPlayingAnimation).toBe(false);
      expect(finalAnimationState.animationQueue.length).toBe(0);

      // Перевіряємо фінальну позицію
      const finalPosition = get(visualPosition);
      expect(finalPosition).toEqual({ row: 2, col: 2 });
    });
  });

  describe('Reset Functionality', () => {
    test('reset повинен очищати всі стани анімації', () => {
      // Додаємо хід
      gameState.update(state => ({
        ...state,
        moveQueue: [...state.moveQueue, {
          from: { row: 0, col: 0 },
          to: { row: 1, col: 1 },
          player: 1,
          direction: 'down-right',
          distance: 1
        }]
      }));

      // Скидаємо анімацію
      animationStore.reset();

      // Перевіряємо, що всі стани очищені
      const state = get(animationStore);
      expect(state.isAnimating).toBe(false);
      expect(state.visualMoveQueue).toEqual([]);
      expect(state.animationQueue).toEqual([]);
      expect(state.isPlayingAnimation).toBe(false);
    });
  });
}); 