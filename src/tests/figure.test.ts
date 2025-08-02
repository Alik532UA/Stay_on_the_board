import { describe, it, expect, beforeEach } from 'vitest';
import { Figure, MoveDirection } from '../lib/models/Figure';

describe('Figure Class', () => {
  let figure: Figure;

  beforeEach(() => {
    figure = new Figure(1, 1, 4); // Початкова позиція (1,1) на дошці 4x4
  });

  describe('Конструктор та базові методи', () => {
    it('повинен створювати фігуру з правильною позицією', () => {
      expect(figure.row).toBe(1);
      expect(figure.col).toBe(1);
      expect(figure.boardSize).toBe(4);
    });

    it('повинен повертати поточну позицію', () => {
      const position = figure.getPosition();
      expect(position).toEqual({ row: 1, col: 1 });
    });

    it('повинен встановлювати нову позицію', () => {
      const result = figure.setPosition(2, 2);
      expect(result).toBe(true);
      expect(figure.row).toBe(2);
      expect(figure.col).toBe(2);
    });

    it('повинен відхиляти невалідну позицію', () => {
      const result = figure.setPosition(-1, 5);
      expect(result).toBe(false);
      expect(figure.row).toBe(1); // Позиція не змінилася
      expect(figure.col).toBe(1);
    });
  });

  describe('Розрахунок нової позиції', () => {
    it('повинен правильно обчислювати позицію для напрямку "вгору"', () => {
      const newPos = figure.calculateNewPosition(MoveDirection.UP, 1);
      expect(newPos).toEqual({ row: 0, col: 1 });
    });

    it('повинен правильно обчислювати позицію для напрямку "вниз"', () => {
      const newPos = figure.calculateNewPosition(MoveDirection.DOWN, 2);
      expect(newPos).toEqual({ row: 3, col: 1 });
    });

    it('повинен правильно обчислювати позицію для напрямку "ліворуч"', () => {
      const newPos = figure.calculateNewPosition(MoveDirection.LEFT, 1);
      expect(newPos).toEqual({ row: 1, col: 0 });
    });

    it('повинен правильно обчислювати позицію для напрямку "праворуч"', () => {
      const newPos = figure.calculateNewPosition(MoveDirection.RIGHT, 1);
      expect(newPos).toEqual({ row: 1, col: 2 });
    });

    it('повинен правильно обчислювати позицію для діагонального напрямку', () => {
      const newPos = figure.calculateNewPosition(MoveDirection.UP_LEFT, 1);
      expect(newPos).toEqual({ row: 0, col: 0 });
    });
  });

  describe('Виконання руху', () => {
    it('повинен виконувати валідний рух', () => {
      const result = figure.move(MoveDirection.UP, 1);
      expect(result.success).toBe(true);
      expect(result.newPosition).toEqual({ row: 0, col: 1 });
      expect(figure.row).toBe(0);
      expect(figure.col).toBe(1);
    });

    it('повинен відхиляти рух за межі дошки', () => {
      const result = figure.move(MoveDirection.UP, 3);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Позиція поза межами дошки');
      expect(figure.row).toBe(1); // Позиція не змінилася
      expect(figure.col).toBe(1);
    });

    it('повинен перевіряти можливість руху', () => {
      expect(figure.canMove(MoveDirection.UP, 1)).toBe(true);
      expect(figure.canMove(MoveDirection.UP, 3)).toBe(false);
    });
  });

  describe('Доступні ходи', () => {
    it('повинен повертати список доступних ходів', () => {
      const moves = figure.getAvailableMoves();
      expect(Array.isArray(moves)).toBe(true);
      expect(moves.length).toBeGreaterThan(0);
      
      // Перевіряємо, що всі ходи валідні
      moves.forEach(move => {
        expect(move).toHaveProperty('direction');
        expect(move).toHaveProperty('distance');
        expect(figure.canMove(move.direction, move.distance)).toBe(true);
      });
    });
  });

  describe('Утилітарні методи', () => {
    it('повинен клонувати фігуру', () => {
      const clone = figure.clone();
      expect(clone.row).toBe(figure.row);
      expect(clone.col).toBe(figure.col);
      expect(clone.boardSize).toBe(figure.boardSize);
      expect(clone).not.toBe(figure); // Різні об'єкти
    });

    it('повинен порівнювати фігури', () => {
      const sameFigure = new Figure(1, 1, 4);
      const differentFigure = new Figure(2, 2, 4);

      expect(figure.equals(sameFigure)).toBe(true);
      expect(figure.equals(differentFigure)).toBe(false);
    });

    it('повинен обчислювати відстань до іншої фігури', () => {
      const otherFigure = new Figure(3, 3, 4);
      const distance = figure.distanceTo(otherFigure);
      expect(distance).toBe(2); // Максимум з |3-1| = 2 та |3-1| = 2
    });
  });
}); 