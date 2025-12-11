// file: src/lib/models/moveHistory.ts

export interface MoveHistoryEntry {
  pos: { row: number, col: number };
  blocked: { row: number, col: number }[];
  visits?: any;
  blockModeEnabled?: boolean;
}
