/**
 * Enum для напрямків руху фігури
 */
export const MoveDirection = {
  UP: 'up',
  DOWN: 'down',
  LEFT: 'left',
  RIGHT: 'right',
  UP_LEFT: 'up-left',
  UP_RIGHT: 'up-right',
  DOWN_LEFT: 'down-left',
  DOWN_RIGHT: 'down-right'
} as const;

export type MoveDirectionType = typeof MoveDirection[keyof typeof MoveDirection];


/**
 * Клас фігури, що представляє гравця на дошці
 */
export class Figure {
  public row: number;
  public col: number;
  public boardSize: number;

  constructor(row: number, col: number, boardSize: number = 4) {
    this.row = row;
    this.col = col;
    this.boardSize = boardSize;
  }

  /**
   * Отримати поточну позицію
   */
  getPosition(): any {
    return { row: this.row, col: this.col };
  }

  /**
   * Встановити позицію
   */
  setPosition(row: number, col: number): boolean {
    if (this.isValidPosition(row, col)) {
      this.row = row;
      this.col = col;
      return true;
    }
    return false;
  }

  /**
   * Перевірити чи позиція в межах дошки
   */
  isValidPosition(row: number, col: number): boolean {
    return row >= 0 && row < this.boardSize && 
           col >= 0 && col < this.boardSize;
  }

  /**
   * Обчислити нову позицію на основі напрямку та відстані
   */
  calculateNewPosition(direction: MoveDirectionType, distance: number): any {
    const newRow = this.row;
    const newCol = this.col;

    switch (direction) {
      case MoveDirection.UP:
        return { row: newRow - distance, col: newCol };
      case MoveDirection.DOWN:
        return { row: newRow + distance, col: newCol };
      case MoveDirection.LEFT:
        return { row: newRow, col: newCol - distance };
      case MoveDirection.RIGHT:
        return { row: newRow, col: newCol + distance };
      case MoveDirection.UP_LEFT:
        return { row: newRow - distance, col: newCol - distance };
      case MoveDirection.UP_RIGHT:
        return { row: newRow - distance, col: newCol + distance };
      case MoveDirection.DOWN_LEFT:
        return { row: newRow + distance, col: newCol - distance };
      case MoveDirection.DOWN_RIGHT:
        return { row: newRow + distance, col: newCol + distance };
      default:
        throw new Error(`Невідомий напрямок: ${direction}`);
    }
  }

  /**
   * Виконати рух у вказаному напрямку на вказану відстань
   */
  move(direction: MoveDirectionType, distance: number): any {
    const newPosition = this.calculateNewPosition(direction, distance);
    
    if (this.isValidPosition(newPosition.row, newPosition.col)) {
      this.row = newPosition.row;
      this.col = newPosition.col;
      return { success: true, newPosition };
    }
    
    return { success: false, error: 'Позиція поза межами дошки' };
  }

  /**
   * Перевірити чи можливий рух у вказаному напрямку на вказану відстань
   */
  canMove(direction: MoveDirectionType, distance: number): boolean {
    const newPosition = this.calculateNewPosition(direction, distance);
    return this.isValidPosition(newPosition.row, newPosition.col);
  }

  /**
   * Отримати список доступних ходів
   */
  getAvailableMoves(): any[] {
    const moves: any[] = [];
    const directions = Object.values(MoveDirection);
    
    for (const direction of directions) {
      for (let distance = 1; distance <= this.boardSize; distance++) {
        if (this.canMove(direction, distance)) {
          moves.push({ direction, distance });
        }
      }
    }
    
    return moves;
  }

  /**
   * Клонувати фігуру
   */
  clone(): Figure {
    return new Figure(this.row, this.col, this.boardSize);
  }

  /**
   * Порівняти з іншою фігурою
   */
  equals(other: Figure): boolean {
    return this.row === other.row && this.col === other.col;
  }

  /**
   * Обчислити відстань до іншої фігури
   */
  distanceTo(other: Figure): number {
    const deltaRow = Math.abs(this.row - other.row);
    const deltaCol = Math.abs(this.col - other.col);
    return Math.max(deltaRow, deltaCol);
  }
} 