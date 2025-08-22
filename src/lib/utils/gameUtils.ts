export type Direction = 'up'|'down'|'left'|'right'|'up-left'|'up-right'|'down-left'|'down-right';

export interface Move {
  row: number;
  col: number;
  direction: Direction;
  distance: number;
  isPenalty?: boolean;
}
